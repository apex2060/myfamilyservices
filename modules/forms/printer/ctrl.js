app.lazy.controller('PrinterSetupCtrl', function($scope, $http, config, Auth){
	var tools = $scope.tools = {
		init: function(){
			Auth.init().then(function(){
				tools.plaid.load();
			});
		},
		load: function(req){
			$http.get(config.parse.root+'/classes/udEmail').success(function(data){
				$scope.accounts = data;
			})	
		},
		view: function(view){
			if(view)
				$scope.view = view;
			return '/modules/forms/printer/'+$scope.view+'.html';
		}
	}
	it.PrinterSetupCtrl = $scope;
});