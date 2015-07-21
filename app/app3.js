var it = {};
var app = null;

//Require site-wide js files
var initialFiles = [
	'//ajax.googleapis.com/ajax/libs/angularjs/1.3.0/angular-animate.min.js',
	'//ajax.googleapis.com/ajax/libs/angularjs/1.3.0/angular-resource.min.js',
	'//ajax.googleapis.com/ajax/libs/angularjs/1.3.0/angular-route.min.js',
	'//ajax.googleapis.com/ajax/libs/angularjs/1.3.0/angular-touch.min.js',
	'//apis.google.com/js/client:platform.js',
	
	'//cdn.firebase.com/js/client/1.0.21/firebase.js',
	'//www.parsecdn.com/js/parse-1.3.1.min.js',
	'//maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js',
	'//js.stripe.com/v2/',
	'//cdnjs.cloudflare.com/ajax/libs/moment.js/2.6.0/moment.js',
	'//cdnjs.cloudflare.com/ajax/libs/wow/1.0.3/wow.min.js',
	
	'/vendor/chance.js',
	'/vendor/dragable.js',
];
require(initialFiles, initApp);


function initApp(ngAnimate, ngResource, ngRoute, ngTouch, firebase, parse){
	app = angular.module('RootApp', ['ngAnimate','ngResource','ngRoute','ngTouch']);
	app.config(function($routeProvider,$compileProvider,$controllerProvider,$provide) {
		app.lazy = {
			controller: $controllerProvider.register,
			factory: 	$provide.factory,
			service: 	$provide.service,
		};
	
		function requires($q, module, view, id){
			var deferred = $q.defer();
			var includes = [];
			
			if(module)
				if(view)
					includes.push('modules/'+module+'/'+view+'/ctrl');
				else
					includes.push('modules/'+module+'/ctrl');
				
			var subModules = ['admin','dashboard'];
			if(subModules.indexOf(module) != -1)
				if(view)
					includes.push('modules/'+module+'/'+view+'/ctrl');
			else
				deferred.resolve();
	
			if(includes.length)
				require(includes, function () {
					deferred.resolve();
				});
			else
				deferred.resolve();
				
			return deferred.promise;
		}
	
	
		$routeProvider
		.when('/:module', {
			reloadOnSearch: false,
			templateUrl: function(){
				var pieces = location.hash.split('/');
				return 'modules/'+pieces[1]+'/index.html';
			},
			controller: 'SiteCtrl',
			resolve: {
				load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
					var pieces = $location.path().split('/');
					return requires($q, pieces[1], null, null)
				}]
			}
		})
		.when('/:module/:view', {
			reloadOnSearch: false,
			templateUrl: function(){
				var pieces = location.hash.split('/');
				return 'modules/'+pieces[1]+'/'+pieces[2]+'/index.html';
			},
			controller: 'SiteCtrl',
			resolve: {
				load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
					var pieces = $location.path().split('/');
					return requires($q, pieces[1], pieces[2], null)
				}]
			}
		})
		.when('/:module/:view/:id', {
			reloadOnSearch: false,
			templateUrl: function(){
				var pieces = location.hash.split('/');
				return 'modules/'+pieces[1]+'/'+pieces[2]+'/index.html';
			},
			controller: 'SiteCtrl',
			resolve: {
				load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
					var pieces = $location.path().split('/');
					return requires($q, pieces[1], pieces[2], pieces[3])
				}]
			}
		})
		.otherwise({
			redirectTo: '/main'
		});
	
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel|sms):/);
		// $translateProvider.useStaticFilesLoader({
		// 	prefix: 'static/languages/',
		// 	suffix: '.json'
		// });
		// $translateProvider.uses('en');
	});

	app.run(['$window', '$rootScope', function($window, $rootScope) {
		new WOW().init();
		$rootScope.$on('$routeChangeStart', function(next, current) {
			new WOW().sync();
		});
	}])
	
	require(['app/config', 'app/custom', 'app/directives', 'app/services', 'app/controllers'], function(){
		angular.element(document).ready(function() {
			angular.bootstrap(document, ['RootApp']);
		});
	});
}