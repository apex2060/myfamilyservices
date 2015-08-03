app.lazy.controller('ComFaxCtrl', function($scope, $timeout, $http, $sce, config, FileService, Documents, Data, Auth){
	var acceptedFiles = ['doc', 'docx', 'pdf', 'tif', 'jpg', 'png', 'odt', 'txt', 'html'];
	
	var FaxNums		= Data({
		className: 	'PhoneNumbers',
		query: 		'?order=-createdAt&where={"type":"fax"}',
		fireRef:	'FaxNumbers'
	});
	var Faxes 		= Data({
		className: 	'Faxes',
		query: 		'?order=-createdAt&where={"archived":false}',
		fireRef:	'Faxes'
	});
	var FaxAlerts 	= Data({
		className: 	'Alerts',
		query: 		'?order=-createdAt&where={"class":"Faxes"}',
		fireRef:	'FaxAlerts'
	});
	$scope.$on(FaxNums.listener, function(e, faxNumbers) {
		$scope.faxNumbers = faxNumbers
	});
	$scope.$on(Faxes.listener, function(e, faxes) {
		var faxesSent 		= $scope.faxesSent = [];
		var faxesReceived 	= $scope.faxesReceived = [];
		for(var i=0; i<faxes.length; i++)
			if(faxes[i].direction == 'sent')
				faxesSent.push(faxes[i])
			else
				faxesReceived.push(faxes[i])
	});

	var tools = $scope.tools = {
		init: function(){
			tools.number.init();
			tools.file.init();
			Auth.tools.init().then(function(user){
				FaxNums.tools.list()
				Faxes.tools.list()
				FaxAlerts.tools.list()
			});
		},
		number: {
			init: function(){
				tools.number.list();
				tools.number.areaCodes();
				$scope.number = {status: 'Choose an area code to provision a new fax number.'}
			},
			areaCodes: function(){
				$http.post('https://api.parse.com/1/functions/faxAreaCodes', {}).success(function(data){
					var ac = data.result.data.data;
					var acs = [];
					for(var key in ac)
						acs.push(key);
					$scope.areaCodes = acs;
				}).error(function(e){
					$scope.file.status = 'Error sending fax.'
				})
			},
			sync: function(){
				$http.post('https://api.parse.com/1/functions/syncFaxNumbers', {}).success(function(data){
					tools.number.list();
				}).error(function(e){
					$scope.file.status = 'Error sending fax.'
				})
			},
			list: function(){
				FaxNums.tools.broadcast();
			},
			add: function(areaCode){
				FaxNums.tools.save({areaCode: areaCode, type: 'fax'})
			},
			focus: function(faxNum){
				$scope.faxNum = faxNum;
				tools.alerts.listFor(faxNum.number);
			},
			save: function(faxNum){
				var fax = angular.copy(faxNum);
				FaxNums.tools.save(fax)
			},
			remove: function(faxNum){
				if(confirm('You will not be able to recover this number once it is gone.  Are you sure you want to release this number?')){
					FaxNums.tools.delete(faxNum).then(function(data){
						$scope.faxNum = null;
					})
				}
			}
		},
		fax: {
			init: function(){
				$scope.fax = {status: 'Choose a file to fax.'};
			},
			upload: function(file){
				Documents.upload(file).then(function(data){
					tools.file.renderPdf(file);
					$scope.file = data;
				})
			},
			send: function(from, to, doc){
				to = to.replace(/\D/g,'');

				if(to.length == 10)
					to = 1+''+to;
				else if(to.length == 7)
					to = 1+''+from.areaCode+to;
					
					
				if(to.length != 11){
					alert('You must enter a 10 digit phone number.')
				}else if(!from){
					alert('You must select the number from which you will be sending this fax.')
				}else{
					var fax = {
						document: 	Documents.root.tools.ref(doc),
						file: 			doc.file,
						localNumber: 	from.number,
						remoteNumber: 	to
					}
					
					Faxes.tools.save(fax).then(function(result){
						$scope.sendFaxResult = result;
					})
				}
			}
		},
		alerts: {
			listFor: function(number){
				$scope.faxAlert = {};
				FaxAlerts.tools.list().then(function(alerts){
					$scope.faxAlerts = [];
					for(var i=0; i<alerts.length; i++)
						for(var c=0; c<alerts[i].rules.criteria.length; c++)
							if(alerts[i].rules.criteria[c].column == 'localNumber' && alerts[i].rules.criteria[c].value == ''+number)
								$scope.faxAlerts.push(alerts[i])
				})
			},
			focus: function(a){
				$scope.faxAlert = a;
			},
			add: function(localNumber, remoteNumber){
				var notification = {
					"criteria":[
						{"column":"direction","comparison":"equalTo","value":"received"}
					],"notifications":[
						{"message":"You received a fax from: <remoteNumber>.  <link>","to":"cellNumber","type":"txt"}
					]
				}
				if(localNumber)
					notification.criteria.push({"column":"localNumber","comparison":"equalTo","value":localNumber})
				if(remoteNumber)
					notification.criteria.push({"column":"remoteNumber","comparison":"equalTo","value":remoteNumber})
				$scope.faxAlerts.push({rules:notification});
			},
			save: function(faxAlert){
				FaxAlerts.tools.save(faxAlert).then(function(){
					alert('Notification saved.')
				})
			}
		},
		file: {
			init: function(){
				$scope.faxPreview = null;
				var file = {status: 'Choose a file to fax.'}
				if($scope.file && $scope.file.from)
					file.from = $scope.file.from;
				if($scope.file && $scope.file.to)
					file.to = $scope.file.to;
				$scope.file = file;
			},
			add: function(file){
				$timeout(function(){ 
					var pieces = file.attr.name.split('.');
					file.name = pieces[0];
					file.suffix = pieces[pieces.length-1].toLowerCase();
					
					if(acceptedFiles.indexOf(file.suffix) != -1){
						file.status = 'Uploading File... Please Wait';
						if($scope.file && $scope.file.from)
							file.from = $scope.file.from;
						if($scope.file && $scope.file.to)
							file.to = $scope.file.to;
						$scope.file = file;
						tools.file.upload(file)
					}else{
						$scope.file = $scope.file || {};
						$scope.file.status = 'You can only send files of type: '+JSON.stringify(acceptedFiles)
					}
				});
			},
			upload: function(file) {
				var src = file.src;
				var name = file.name;
				FileService.upload(name, src).then(function(data) {
					$scope.result = data;
					file.url = data._url;
					file.status = 'Upload Complete';
					if(file.suffix == 'pdf')
						tools.file.renderPdf(file);
					else if(['tif','jpg','png'].indexOf(file.suffix) != -1)
						tools.file.renderImg(file);
				});
			},
			renderPdf: function(file){
				PDFJS.getDocument(file.url).then(function(pdf) {
					pdf.getPage(1).then(function(page) {
						var scale = 1.5;
						var viewport = page.getViewport(scale);

						var canvas = document.getElementById('pdfview');
						var context = canvas.getContext('2d');
						canvas.height = viewport.height;
						canvas.width = viewport.width;

						var renderContext = {
							canvasContext: context,
							viewport: viewport
						};
						page.render(renderContext);
						
						var desiredWidth = 100;
						var viewport = page.getViewport(1);
						var scale = desiredWidth / viewport.width;
						var scaledViewport = page.getViewport(scale);
					});
				});
			},
			renderImg: function(file){
				$scope.faxPreview = file.url
			},
			ipreview: function(file){
				$scope.iframe = $sce.trustAsResourceUrl(file.url);
			},
			send: function() {
				var file = $scope.file;
					file.to = file.to.replace(/\D/g,'');
				if(file.to.length != 10){
					alert('You must enter a 10 digit phone number.')
				}else if(!file.from){
					alert('You must select the number from which you will be sending this fax.')
				}else{
					var number = 1+''+file.to;
					$scope.file.status = 'Sending...'
					$http.post('https://api.parse.com/1/functions/sendFax', {
						to: number,
						url: file.url,
						from: file.from.number
					}).success(function(data){
						$scope.file.status = 'Complete'
						$timeout(function(){
							Faxes.tools.broadcast();
						}, 30000)
					}).error(function(e){
						$scope.file.status = 'Error sending fax.'
					})
				}
			},
			archive: function(fax){
				if(confirm('Archiving will remove this fax from the list.  Are you sure you want to archive this fax?')){
					fax.archived = true;
					Faxes.tools.save(fax)
				}
			},
			reload: function(){
				Faxes.tools.broadcast();
			}
		}
	}
	
	tools.init();
	it.ComFaxCtrl = $scope;
});