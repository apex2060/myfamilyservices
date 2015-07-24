app.lazy.controller('ComFaxCtrl', function($scope, $timeout, $http, $sce, config, FileService, Data, Auth){
	var acceptedFiles = ['doc', 'docx', 'pdf', 'tif', 'jpg', 'png', 'odt', 'txt', 'html'];
	
	var Faxes 		= Data({
		className: 	'Faxes',
		query: 		'?order=-createdAt&where={"archived":false}',
		fireRef:	'Faxes'
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
			tools.file.clear();
			Auth.tools.init().then(function(user){
				Faxes.tools.list()
			});
		},
		file: {
			add: function(file){
				$timeout(function(){ 
					var pieces = file.attr.name.split('.');
					file.name = pieces[0];
					file.suffix = pieces[pieces.length-1].toLowerCase();
					
					if(acceptedFiles.indexOf(file.suffix) != -1){
						if($scope.file && $scope.file.number)
							file.number = $scope.file.number;
						file.status = 'Uploading File... Please Wait';
						$scope.file = file;
						tools.file.upload(file)
					}else{
						$scope.file = $scope.file || {};
						$scope.file.status = 'You can only send files of type: '+JSON.stringify(acceptedFiles)
					}
				});
			},
			clear: function(){
				$scope.faxPreview = null;
				var file = {status: 'Choose a file to fax.'}
				if($scope.file && $scope.file.number)
					file.number = $scope.file.number;
				$scope.file = file;
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
					file.number = file.number.replace(/\D/g,'');
				if(file.number.length == 10){
					var number = 1+''+file.number;
					$scope.file.status = 'Sending...'
					$http.post('https://api.parse.com/1/functions/sendFax', {
						to: number,
						url: file.url
					}).success(function(data){
						$scope.file.status = 'Complete'
						$timeout(function(){
							Faxes.tools.broadcast();
						}, 30000)
					}).error(function(e){
						$scope.file.status = 'Error sending fax.'
					})
				}else{
					alert('You must enter a 10 digit phone number.')
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