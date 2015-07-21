app.lazy.controller('DashCtrl', function($rootScope, $scope, $routeParams, $timeout, $http, config, Easy){
	$scope.Easy = Easy;


	var tools = $scope.tools = {
		authUrl: function(){
			return 'https://dash.by/api/auth/authorize?response_type=code&client_id='+config.dash.client_id+'&scope=user trips&state=xyz&redirect_uri='+config.devUrl;
		},
		getToken: function(){
			$http.post(config.parse.root+'/functions/dash', {token: 'commingsoon'}).success(function(data){
				it.dash = data;
				console.log('dash')
			});
		}
	}


	it.DashCtrl = $scope;
});