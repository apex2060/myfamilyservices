app.factory('ParseData', function ($rootScope, $timeout, $http, $q, config) {
	var store = {};
	var Data = function(userParams){
		var params = {
			method: 			'get',
			query: 				'/classes/TestClass',
			table:				'TestClass',
			listener:			'Ds2TestClass',
			transformations: 	[],	//These will be called on save to transform content
			validations: 		[], //These will be called on save to validate content
			dependancies: 		[]	//Pass in the actual parse data object!  (This will be synced before the other data is synced.)
		};
		if(typeof(userParams)=='string'){
			angular.extend(params, {
				query:		'/classes/'+userParams,
				table: 		userParams,
				listener: 	'ds2'+userParams
			})
		}else{
			angular.extend(params, userParams)
		}
		var dataObj = null;
		if(store[params.listener])
			dataObj = store[params.listener]
		else
			dataObj = store[params.listener] = new ParseData(params);
		return dataObj;
	}
	
	var ParseData = function(params){
		var ds = this;
			ds.deferred = $q.defer();
		angular.extend(ds, params);
		
		ds.tools = {
			load: function(){
				$http[ds.method](config.parse.root+ds.query).success(function(data){
					localStorage.setItem(ds.listener, angular.toJson(data))
					ds.data = data;
					ds.deferred.resolve(ds.data)
				})
			},
			save: function(items){
				if(Object.prototype.toString.call(items) == '[object Object]')
					items = [items];
			},
			remove: function(items){
				if(Object.prototype.toString.call(items) == '[object Object]')
					items = [items];
			},
			syncDown: function(){
				
			},
			syncUp: function(){
				//Must return a promise which gets reset when data is dirty and not synced.
			}
		}
		
		var local = localStorage.getItem(ds.listener)
		if(ds.data){
			ds.deferred.resolve(ds.data)
		}else if(navigator.onLine){
			ds.tools.load();
		}else if(local){
			ds.data = angular.fromJson(local)
			ds.deferred.resolve(ds.data)
		}else{
			ds.deferred.reject('You are ofline, and no data has been loaded.')
		}
		
		return ds.deferred.promise;
	}
	return Data;
});