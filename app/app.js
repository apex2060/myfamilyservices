var it = {};
var app = null;

app = angular.module('RootApp', ['ngAnimate','ngResource','ngRoute','ngTouch','xeditable','textAngular']);
app.config(function($routeProvider,$compileProvider,$controllerProvider,$provide) {
	app.lazy = {
		controller: $controllerProvider.register,
		factory: 	$provide.factory,
		service: 	$provide.service,
	};

	var parent 		= ['scalehouse', 'equipment', 'operations']
 	// :module/index.html		>	:module/ctrl.js
	var child		= ['admin', 'employee', 'communication']
	// :module/:view/index.html	> 	:module/:view/ctrl.js
	var sibbling	= ['main']
	// :module/:view.html		> 	:module/ctrl.js
	var double		= []
	// :module/:view/index.html	> 	:module/ctrl.js + :module/:view/ctrl.js
	
	// Require specific js files for modules.
	function requires($q, module, view, id){
		var deferred = $q.defer();
		var includes = [];
		
		if(module=='employee'){
			includes.push('vendor/jSignature/flashcanvas.js')
			includes.push('vendor/jSignature/jSignature.min.js')
		}
		
		
		if(parent.indexOf(module) != -1)
			includes.push('modules/'+module+'/ctrl.js');
		if(child.indexOf(module) != -1)
			if(view)
				includes.push('modules/'+module+'/'+view+'/ctrl.js');
			else
				includes.push('modules/'+module+'/ctrl.js');
		if(sibbling.indexOf(module) != -1)
			includes.push('modules/'+module+'/ctrl.js');
		if(double.indexOf(module) != -1){
			includes.push('modules/'+module+'/ctrl.js');
			if(view)
				includes.push('modules/'+module+'/'+view+'/ctrl.js');
		}
		if(!includes.length)
			if(view)
				includes.push('modules/'+module+'/'+view+'/ctrl.js');
			else
				includes.push('modules/'+module+'/ctrl.js');

		if(includes.length)
			require(includes, function () {
				deferred.resolve();
			});
		else
			deferred.resolve();
			
		return deferred.promise;
	}
	function path(module, view, id){
		if(parent.indexOf(module) != -1)
			return 'modules/'+module+'/index.html';
		if(child.indexOf(module) != -1)
			if(view)
				return 'modules/'+module+'/'+view+'/index.html';
			else
				return 'modules/'+module+'/index.html';
		if(sibbling.indexOf(module) != -1)
			if(view)
				return 'modules/'+module+'/'+view+'.html';
			else
				return 'modules/'+module+'/index.html';
		if(double.indexOf(module) != -1)
			if(view)
				return 'modules/'+module+'/'+view+'/index.html';
			else
				return 'modules/'+module+'/index.html';
				
		if(view)
			return 'modules/'+module+'/'+view+'/index.html';
		else
			return 'modules/'+module+'/index.html';
	}

	$routeProvider
	.when('/:module', {
		reloadOnSearch: false,
		templateUrl: function(){
			var pieces = location.hash.split('/');
			return path(pieces[1])
		},
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
			return path(pieces[1], pieces[2])
		},
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
			return path(pieces[1], pieces[2], pieces[3])
		},
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
app.run(function(editableOptions) {
	editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});



// All the following is to allow google visualizations...
var vizPromise = new Promise(function(resolve, reject) {
	google.setOnLoadCallback(function () {  
		resolve();
	});
});
var letsBegin = null;
var authPromise = new Promise(function(resolve, reject) {
	letsBegin = function(){
		resolve();
	}
});

Promise.all([vizPromise, authPromise]).then(function() {
	angular.bootstrap(document, ['RootApp']);
}, function() {
  // one or more failed
});

google.load('visualization', '1', {packages: ['gauge']});
google.load('visualization', '1', {packages: ['corechart']});