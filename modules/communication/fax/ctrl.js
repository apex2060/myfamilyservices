app.lazy.controller('ComFaxCtrl', function($rootScope, $scope, $timeout, $http, $sce,  $q, config, FileService, Auth){
	$scope.files = [];
	var tools = $scope.tools = {
		init: function(){
			$http.get('https://api.parse.com/1/classes/Faxes?order=-createdAt&where={"archived":false}').success(function(data){
				var faxes = data.results;
				var faxesSent 		= $scope.faxesSent = [];
				var faxesReceived 	= $scope.faxesReceived = [];
				for(var i=0; i<faxes.length; i++)
					if(faxes[i].direction == 'sent')
						faxesSent.push(faxes[i])
					else
						faxesReceived.push(faxes[i])
			})
		},
		file: {
			add: function(file){
				$timeout(function(){ 
					var pieces = file.attr.name.split('.');
					file.name = pieces[0];
					file.suffix = pieces[pieces.length-1];
					if($scope.file && $scope.file.number)
						file.number = $scope.file.number;
					$scope.file = file;
					tools.file.upload(file)
				});
			},
			clear: function(){
				$scope.file = {number: $scope.file.number};
			},
			upload: function(file) {
				var src = file.src;
				var name = file.name;
				FileService.upload(name, src).then(function(data) {
					$scope.result = data;
					file.url = data._url;
					tools.file.renderPdf(file);
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
					})
				}else{
					alert('You must enter a 10 digit phone number.')
				}
			},
		}
	}
	
	tools.init();
	it.ComFaxCtrl = $scope;
});