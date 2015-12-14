app.lazy.controller('MainCtrl', function($rootScope, $scope, $routeParams, $http, config, Easy, Data){
	$scope.srvcs = ['Budgeting', 'Educational Support',  'Self-esteem Building', 'Resume Building Skills','Utilities','Rent','Food and Clothing','Basic Life Skills','Heat NM','Safe Link Phones'];
	$scope.team = [];
	// 	{name: '', pic: {url: ''}},
	// 	{name: '', pic: {url: ''}},
	// 	{name: '', pic: {url: ''}},
	// 	{name: '', pic: {url: ''}},
	// ]

	var carousel = {
		type: 'carousel',
		slides: [{
			title: '',
			description: 'Our lovely little office.',
			img: {
				src: '/static/images/house.jpg',
				description: ''
			}
		},{
			title: '',
			description: 'The Playground.',
			img: {
				src: '/static/images/playground.jpg',
				description: ''
			}
		},{
			title: '',
			description: 'The children love to drive around.',
			img: {
				src: '/static/images/cars.jpg',
				description: ''
			}
		}]
	}
	$scope.manifest = [carousel]
		// {
		// 	type: 'outpostCards',
		// 	title: 'Locations',
		// 	cards: operations
		// }
	
	
	var tools = $scope.tools = {
		init: function(){
			for(var i=0; i<6; i++)
				$.ajax({
					url: 'https://randomuser.me/api/',
					dataType: 'json',
					success: function(data) {
						$scope.team.push(data.results[0].user);
						$scope.$apply();
					}
				});
		}
	}
	tools.init()
	it.MainCtrl = $scope;
});