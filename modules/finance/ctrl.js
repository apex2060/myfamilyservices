app.lazy.controller('FinanceCtrl', function($rootScope, $scope, $routeParams, $http, $q, $timeout, config, Easy, Data, Auth){
	$scope.temp = {};
	it.http = $http
	
	var tools = $scope.tools = {
		init: function(){
			Auth.init().then(function(){
				tools.plaid.load();
			});
		},
		plaid: {
			connect: function(req){
				$http.post(config.parse.root+'/functions/plaidConnect', req).success(function(data){
					it.plaidConnect = data;
					// $scope.temp.access_token = data.access_token;
				}).error(function(response){
					console.error('Finance error', response)
				})	
			},
			connectStep: function(code, access_token){
				var req = {
					mfa: code,
					access_token: access_token
				}
				$http.post(config.parse.root+'/functions/plaidConnectStep', req).success(function(data){
					it.plaidConnectStep = data;
				}).error(function(response){
					console.error('Finance error', response)
				})	
			},
			load: function(){
				$http.post(config.parse.root+'/functions/plaidTransactions', {}).success(function(data){
					$scope.bank = data.result;
				}).error(function(response){
					console.error('Finance error', response)
				})	
			}
		}
	}
	it.FinanceCtrl = $scope;
});