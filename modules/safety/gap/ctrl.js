/*
	This controller uses the kimono labs api to import safety regulations.  
	This data can be modified through the kimono labs dashboard.
*/

app.lazy.controller('SafetyGapCtrl', function($rootScope, $scope, $routeParams, $http, config, Easy, ParseData, Auth){
	$scope.Easy = Easy;
	$scope.temp = {};
	var Outpost = new ParseData('Outposts');
		
	var tools = $scope.tools = {
		url: function(){
			if(!$routeParams.v)
				return '/modules/safety/gap/default.html'	
			else
				return '/modules/safety/gap/'+$routeParams.v+'.html'
		},
		init: function(){
			// tools.regs.load();
		},
		regs: {
			load: function(ttl, vol){
				$http.jsonp('https://www.kimonolabs.com/api/2v6ut8m2?crossDomain=true&kimbypage=1&callback=JSON_CALLBACK&apikey='+config.kimono.api_key).success(function(data){
					$scope.regs = data.results;
				});
			}
		},
		inspection: {
			init: function(){
				$scope.gap = {
					auditors: [],
					violations: []
				}
				if(!$scope.regs)
					tools.regs.load();
				Outpost.tools.list().then(function(outposts){
					$scope.outposts = outposts;
				})
				Auth.init().then(function(user){
					$scope.gap.inspector = {
						objectId: user.objectId,
						displayName: user.profile.displayName
					}
				});
			},
			addAuditor: function(){
				$scope.gap.auditors.push({});
			},
			addAssignment: function(){
				$scope.gap.violations.push({
					msha: {}
				});
			},
			mshaRef: function(violation){
				$scope.temp.violation = violation;
				$('#mshaModal').modal('show');
			},
			setReg: function(reg, section){
				$scope.temp.violation.msha = {
					code: reg.Document[0].code,
					link: reg.url,
					description: section.regulations
				}
				$('#mshaModal').modal('hide');
			}
		}
	}

	tools.init();
	it.SafetyGapCtrl = $scope;
});