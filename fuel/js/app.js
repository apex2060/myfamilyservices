var it = {};

var app = angular.module('FuelApp', ['ngAnimate','ngResource','ngRoute','ngTouch']);
app.config(function($routeProvider,$compileProvider,$controllerProvider,$provide) {
	function path(view){
		return '/fuel/views/'+view+'.html'
	}

	$routeProvider
	.when('/:view', {
		templateUrl: function(){
			var pieces = location.hash.split('/');
			return path(pieces[1])
		},
		controller: 'MainCtrl'
	})
	.when('/:view/:id', {
		templateUrl: function(){
			var pieces = location.hash.split('/');
			return path(pieces[1])
		},
		controller: 'MainCtrl'
	})
	.otherwise({
		redirectTo: '/main'
	});

	// $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel|sms):/);
	// $translateProvider.useStaticFilesLoader({
	// 	prefix: 'static/languages/',
	// 	suffix: '.json'
	// });
	// $translateProvider.uses('en');
});

angular.element(document).ready(function() {
	angular.bootstrap(document, ['FuelApp']);
});


$(document).on('click', '.navbar-collapse.in', function(e) {
	if ($(e.target).is('a')) {
		$(this).collapse('hide');
	}
});