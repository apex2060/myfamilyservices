app.lazy.controller('SafetyRegulationsCtrl', function($rootScope, $scope, $routeParams, $http, config, Easy, ParseData){
		$scope.Easy = Easy;
		// var Outpost = new ParseData('Outposts', '?where={"public":true}');
		
	var tools = $scope.tools = {
		init: function(){
			tools.regs.load();
		},
		regs: {
			load: function(ttl, vol){
				$http.jsonp('https://www.kimonolabs.com/api/2v6ut8m2?crossDomain=true&kimbypage=1&callback=JSON_CALLBACK&apikey='+config.kimono.api_key).success(function(data){
					$scope.regs = data.results;
				});
			}
		}
	}

	tools.init();
	it.SafetyRegulationsCtrl = $scope;
});