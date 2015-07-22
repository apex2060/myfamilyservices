app.lazy.controller('ComFaxCtrl', function($rootScope, $scope, $timeout, $http, $sce,  $q, config, FileService, Auth){
	$scope.files = [];
	var tools = $scope.tools = {
		file: {
			add: function(file){
				$timeout(function(){ 
					var pieces = file.attr.name.split('.');
					file.name = pieces[0];
					file.suffix = pieces[pieces.length-1];
					$scope.files.push(file)
				});
			},
			upload: function(file) {
				var src = file.src;
				var name = file.name;
				FileService.upload(name, src).then(function(data) {
					$scope.result = data;
					file.url = data._url;
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
			send: function(file) {
				var phone = prompt('Phone Number: ')
				$http.post('https://api.parse.com/1/functions/sendFax', {
					to: phone,
					url: file.url
				}).success(function(data){
					it.send = data;
				})
			},
		}
	}
	
	it.ComFaxCtrl = $scope;
});