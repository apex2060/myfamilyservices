app.lazy.controller('FormCtrl', function($rootScope, $scope, $routeParams, $http, $q, config, Easy, ParseData){
	// var Outpost 	= new ParseData('Outposts');
	// var Hardware 	= new ParseData('Hardware');
	// var Software 	= new ParseData('Software');
	

	var tools = $scope.tools = {
		// url: function(){
		// 	if(!$routeParams.v)
		// 		$routeParams.v = 'itemListView';
		// 	return '/modules/it/distribution/'+$routeParams.v+'.html';
		// },
		// init: function(){
		// 	$q.all([Outpost.tools.list(), Hardware.tools.list(), Software.tools.list()]).then(function(data){
		// 		$scope.outposts = data[0];
		// 		$scope.hardware = data[1];
		// 		$scope.software = data[2];
		// 	})
		// },
		// hardware: {
		// 	add: function(){
		// 		$('#itemAddModal').modal('show');
		// 	}
		// }
	}

	tools.init();
	it.FormCtrl = $scope;
});