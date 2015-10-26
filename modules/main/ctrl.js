app.lazy.controller('MainCtrl', function($rootScope, $scope, $routeParams, $http, config, Easy, Data){
	var tools = $scope.tools = {
		init: function(){
			$scope.workers = [{name:{first:'HI'}}];
			for(var i=0; i<5; i++){
				$http.get('http://randomuser.me/api/').success(function(person){
					console.log(person)
					$scope.workers.push(person);
				})
			}
		}
	}
	tools.init()
	it.MainCtrl = $scope;
});