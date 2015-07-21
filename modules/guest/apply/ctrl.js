app.lazy.controller('GuestApplyCtrl', function($rootScope, $scope, $routeParams, $timeout, $http, config, Easy, ParseData){
	var Outpost 	= new ParseData('Outposts'); //'?where={"public":true}'
	var Position 	= new ParseData('Positions');
	
	var tools = $scope.tools = {
		init: function(){
			form.create();
			Outpost.tools.list().then(function(outposts){
				$scope.outposts = outposts;
			})
			Position.tools.list().then(function(positions){
				$scope.positions = positions;
			})
		}
	}
		
	var form = $scope.form = {
		create: function(){
			$scope.appli = {
				position: {
					types: [],
					location: []
				},
				employment: {
					jobs: []	
				}
			}
		},
		position: {
			isChecked: function(position){
				var positions = $scope.appli.position.types;
				return positions.indexOf(position.objectId) > -1;
			},
			toggle: function(position) {
				var positions = $scope.appli.position.types;
				var idx = positions.indexOf(position.objectId);
				if (idx > -1)
					positions.splice(idx, 1);
				else
					positions.push(position.objectId);
			},
		},
		location: {
			isChecked: function(position){
				var positions = $scope.appli.position.location;
				return positions.indexOf(position.objectId) > -1;
			},
			toggle: function(position) {
				var positions = $scope.appli.position.location;
				var idx = positions.indexOf(position.objectId);
				if (idx > -1)
					positions.splice(idx, 1);
				else
					positions.push(position.objectId);
			},
		},
		employment: {
			add: function(){
				$scope.appli.employment.jobs.push({});
			}
		}
	}

	tools.init();
	
	it.GuestApplyCtrl = $scope;
});