app.factory('Easy', function ($http, $q, $timeout, $sce, config) {
	var Easy = {
		map: function(geo, size, zoom){	//size = 600x300
			if(!geo)
				return '/static/img/worldsm.jpg';
			if(!size)
				size = '600x300';
			if(!zoom)
				zoom = 13;
				
			var lat = geo.latitude;
			var lng = geo.longitude;
			return '//maps.googleapis.com/maps/api/staticmap?center='+lat+','+lng+'&zoom='+zoom+'&size='+size+'&maptype=roadmap&markers=color:blue%7Clabel:S%7C'+lat+','+lng;
		},
		mapLink: function(geo){
			return 'http://maps.google.com/maps?q='+geo.latitude+','+geo.longitude
		},
		elements: function(){
			var element = this;
			element.list = {};
			var inputElem 	= function(){
				this.name 		= 'Input';
				this.element 	= 'input';
				this.options 	= ['button','checkbox','color','date ','datetime ','datetime-local ','email ','month ','number ','password','radio','range ','reset','search','submit','tel','text','time ','url','week'];
				this.config 	= {};
				this.create = function(){
					this.config.label 	= prompt('Input label:');
					this.config.name 	= this.config.label.toCamelCase();
					this.config.type 	= prompt('Input type:');
				},
				this.html = function(){
					if(this.config.type)
						return $sce.trustAsHtml(this.config.label+' <input class="form-control" name="'+this.config.name+'" type="'+this.config.type+'" ng-model="form.'+this.config.name+'">');
				}
			}
			var htmlElem 	= function(){
				this.name 		= 'HTML';
				this.options 	= ['div','span','h1','h2','h3'];
				this.config 	= {};
				this.create = function(){
					this.config.content 	= prompt('HTML content:');
					this.config.classes 	= prompt('HTML classes:');
					this.config.type 		= prompt('Input type:');
				},
				this.html = function(){
					if(this.config.type)
						return $sce.trustAsHtml('<'+this.config.type+' class="'+this.config.classes+'">'+this.config.content+'</'+this.config.type+'>');
				}
			}
			element.list.input 	= inputElem;
			element.list.html 	= htmlElem;
		}
	}

	it.Easy = Easy;
	return Easy;
});


app.factory('Auth', function (User) {
	if(!authUser){
		var authUser = new User();
			authUser.init();
	}
	return authUser;
});
app.factory('User', function ($http, $q, $timeout, config) {
	var g = config.google;
	var defaults = {
		scopes: 'email https://www.googleapis.com/auth/plus.me',
	}

	var User = function(scopes){
		var my = this;
			my.status 	= 'start';
			my.pending 	= true;
			my.roles 	= [];
			my.data 	= {};
			my.data.date= new Date();
			my.defer 	= $q.defer()
			if(scopes)
				my.data.scopes 	= scopes;
			else
				my.data.scopes 	= defaults.scopes;
			
				
		var tools = {
			reset: function(scopes){
				my.data 		= {}
				my.objectId 	= null
				my.sessionToken = null
				my.gAuth 		= null
				my.pAuth		= null
				my.roles 		= []
				my.profile 		= {}
				my.defer 		= $q.defer()
			},
			init: function(scopes){
				if(my.status == 'start')
					tools.loadUser(true);
				return my.defer.promise;
			},
			login: function(scopes){
				tools.loadUser();
				return my.defer.promise;
			},
			logout: function(){
				gapi.auth.signOut();
				tools.reset();
			},
			loadUser: function(immediate){
				// alert('Load User')
				// [] TODO This has a problem... it is being called 3+ times
				tools.google.auth(immediate).then(function(gAuth){
					if(gAuth.error){
						my.error = gAuth;
					}else{
						tools.parse.auth(gAuth).then(function(){
							tools.userData().then(function(){
								my.pending = false;
								my.defer.resolve(my);
							})
						})
					}
				}).catch(function(e){
					my.error = e;
					my.defer.reject(e);
					it.me = my;
				})
			},
			is: function(roles) {
				var permissionGranted = true;
				if(typeof(roles)=='string')
					roles = [roles]
				var myRoles = [];
				for(var i=0; i<my.roles.length; i++)
					myRoles.push(my.roles[i].name)
				for(var i=0; i<roles.length; i++)
					if(myRoles.indexOf(roles[i]) == -1)
						permissionGranted = false;
				return permissionGranted;
			},
			isOr: function(roles) {
				var permissionGranted = false;
				if(typeof(roles)=='string')
					roles = [roles]
				var myRoles = [];
				for(var i=0; i<my.roles.length; i++)
					myRoles.push(my.roles[i].name)
				for(var i=0; i<roles.length; i++)
					if(myRoles.indexOf(roles[i]) != -1)
						permissionGranted = true;
				return permissionGranted;
			},
			userData: function(){
				var deferred = $q.defer();
				var profile = tools.google.profile();
				var roles 	= tools.parse.roles.list();
				$q.all([profile, roles]).then(function() {
					deferred.resolve(my);
				});
				return deferred.promise;
			},
			google: {
				auth: function(immediate){
					var deferred = $q.defer();
					gapi.auth.authorize({
						client_id: config.google.client_id, 
						scope: my.data.scopes, 
						immediate: immediate
					}, function(gAuth){
						my.gAuth = gAuth;
						deferred.resolve(gAuth)
					});
					return deferred.promise;
				},
				plus: function(){
					return gapi.client.load('plus', 'v1');
				},
				scopes: function(scopes){
					if(typeof(scopes)=='object')
						scopes = scopes.join(' ');
					if(scopes)
						my.data.scopes += ' '+scopes;
					return tools.google.auth();
				},
				profile: function(){
					var deferred = $q.defer();
					if(my.profile && my.profile.length)
						deferred.resolve(my.profile)
					else
						$http.get('https://www.googleapis.com/plus/v1/people/me?access_token='+my.gAuth.access_token).success(function(profile){
							$http.get('https://api.parse.com/1/classes/UserProfile').then(function(response){
		 						my.profile = angular.extend(profile, response.data.results[0])
								my.profile.gId = my.profile.id;
								delete my.profile.id;
			 					deferred.resolve(my.profile);
							}).catch(function(){
		 						my.profile = profile;
								my.profile.gId = my.profile.id;
								delete my.profile.id;
			 					deferred.resolve(my.profile);
							})
		 				});
					return deferred.promise;
				}
			},
			parse: {
				auth: function(gAuth){
					var deferred = $q.defer();
					if(my.status == 'start'){
						my.status = 'looking up google user form parse.';
						$http.post('https://api.parse.com/1/functions/googleAuth', gAuth).success(function(data) {
							my.status = 'parse auth complete.';
							my.pAuth 			= data.result;
							my.objectId 		= data.result.user.objectId;
							my.sessionToken 	= data.result.token;
							Parse.User.become(my.sessionToken)
							$http.defaults.headers.common['X-Parse-Session-Token'] = my.sessionToken;
							deferred.resolve();
						}).error(function(error){
							my.status = 'error authenticating through parse.';
							deferred.reject(error);
							tools.logout();
						})
					}else{
						deferred.resolve('Already Processing / Processed');
					}
		 			return deferred.promise;
				},
				roles: {
					list: function() {
						var deferred = $q.defer();
						if(my.roles.length) {
							deferred.resolve(my.roles)
						}else{
							var roleQry = 'where={"users":{"__type":"Pointer","className":"_User","objectId":"' + my.objectId + '"}}'
							if(my.objectId)
								$http.get('https://api.parse.com/1/classes/_Role?' + roleQry).success(function(data) {
									my.roles = data.results;
									deferred.resolve(data.results);
								}).error(function(data) {
									deferred.reject(data);
								});
						}
						return deferred.promise;
					},
					toggle: function(roleId) {
						if (typeof(roleId) != 'string')
							roleId = roleId.objectId;

						var operation = 'AddRelation';
						for (var i = 0; i < my.roles.length; i++)
							if (my.roles[i].objectId == roleId)
								operation = 'RemoveRelation';

						var request = {
							users: {
								__op: operation,
								objects: [{
									__type: "Pointer",
									className: "_User",
									objectId: my.objectId
								}]
							}
						}
						$http.put('https://api.parse.com/1/classes/_Role/' + roleId, request).success(function(data) {
							console.log('Role toggled.');
						}).error(function(error) {
							console.error(error);
						})
					}
				}
			}
		}
		
		this.tools 	= tools;
		this.is 	= tools.is;
		this.isOr 	= tools.isOr;
		this.init 	= tools.init;
	}
	return User;
});

app.factory('Data', function ($q, ParseData) {
	var pl = [];
	return function(params){
		var defaults = {
			rootUrl: 	'https://api.parse.com/1/classes/',
			className: 	'TestData',
			query: 		null,	//Setup a specific query for the data.
			fireRef:	null, 	//Set fireRef for live and offline data...
			listener: 	'', 	//Will broadcast at this address when data changes.
			list: 		[],		//Will host a list of all results.
		}
		//If we want to be very simple and only pass in the class name:::
		if(typeof(params) != 'object')
			params = {className:params, fireRef:params}
		
		var ds = {};
		angular.extend(ds, defaults);
		angular.extend(ds, params);
		
		var parseData = null;
		for(var i=0; i<pl.length; i++)
			if(pl[i].className == ds.className && pl[i].fireRef == ds.fireRef)
				parseData = pl[i];
		if(!parseData){
			parseData = new ParseData(ds);
			pl.push(parseData);
		}
		it.pl = pl
		return parseData;
	}
});
app.factory('ParseData', function ($rootScope, $timeout, $http, $q, config, Auth) {
	var ParseData = function(params){
		//Extend this object so we can use it more simply within this service.
		var ds = this;
		angular.extend(this, params);
		
		this.start = true;
		this.deferred = $q.defer();
		if(this.fireRef){
			this.fire = new Firebase(config.firebase+this.fireRef);
			this.listener = 'ds-'+this.fireRef;

			var local = localStorage.getItem(this.listener)
			if(local){
				local = angular.fromJson(local)
				this.updatedAt 	= local.updatedAt;
				this.list 		= local.list;
			}
		}
		
		//Setup the tools provided
		var tools = this.tools = {
			list: function(updateToken){
				if(!updateToken)
					updateToken = ds.updatedAt;
				if(!updateToken)
					updateToken = 'FirstTime';
				
				if(ds.start){
					ds.start = false;
					//Temporary try (added if-else for non-live -load on refresh- data)
					if(ds.fire){
						ds.fire.on('value', function(updateToken){
							ds.tools.list(updateToken.val()).then(function(list){
								$rootScope.$broadcast(ds.listener, list);
							})
						})
						tools.getUpdate(updateToken).then(function(list){
							ds.deferred.resolve(list);
						})
					}else{
						ds.tools.list().then(function(list){
							$rootScope.$broadcast(ds.listener, list);
						})
						tools.getUpdate(updateToken).then(function(list){
							ds.deferred.resolve(list);
						})
					}
					return ds.deferred.promise;
				}else{
					var deferred = $q.defer();
					ds.deferred.promise.then(function(){
						tools.getUpdate(updateToken).then(function(list){
							deferred.resolve(ds.list);
						})
					})
					return deferred.promise;
				}
			},
			getUpdate: function(updateToken){
				if(!updateToken)
					return console.error('You must provide an update token to get an upate..')
				var deferred = $q.defer();
				if(updateToken && updateToken == ds.updatedAt){
					deferred.resolve(ds.list);
				}else{	//Update the data.
					ds.updatedAt = updateToken;
					tools.live().then(function(list){
						ds.list = list;
						localStorage.setItem(ds.listener, angular.toJson({updatedAt: ds.updatedAt, list: ds.list}))
						deferred.resolve(ds.list);
					})
				}
				return deferred.promise;
			},
			local: function(){
				var deferred = $q.defer();
					deferred.resolve(ds.list);
				return deferred.promise;
			},
			live: function(){
				var deferred = $q.defer();
					var uri = ds.rootUrl+ds.className;
					if(ds.query)
						uri += ds.query;
					$http.get(uri).success(function(data){
						if(data.results){
							deferred.resolve(data.results);
						}else{
							deferred.reject(data)
						}
					})
				return deferred.promise;
			},
			broadcast: function(updateToken){
				if(!updateToken){
					updateToken = new Date();
					updateToken = updateToken.toISOString();
				}
				ds.fire.set(updateToken);
			},
			save: function(item){
				delete item.$$hashKey;
				if(item.objectId)
					return ds.tools.update(item);
				else
					return ds.tools.add(item);
			},
			add: function(item){
				var deferred = $q.defer();
				var temp = angular.copy(item);
				$http.post(ds.rootUrl+ds.className, temp).success(function(data){
					tools.broadcast(data.createdAt);
					deferred.resolve(data);
				}).error(function(e){
					deferred.reject(e);
				})
				return deferred.promise;
			},
			update: function(item){
				var deferred = $q.defer();
				var temp = angular.copy(item);
				delete temp.createdAt;
				delete temp.updatedAt;
				delete temp.objectId;
				$http.put(ds.rootUrl+ds.className+'/'+item.objectId, temp).success(function(data){
					tools.broadcast(data.updatedAt);
					deferred.resolve(item);
				}).error(function(e){
					deferred.reject(e);
				})
				return deferred.promise;
			},
			delete: function(item){
				var deferred = $q.defer();
				if(confirm('Are you sure you want to delete this?')){
					var deletedAt = new Date();
					var updateToken = deletedAt.toISOString();
					$http.delete(ds.rootUrl+ds.className+'/'+item.objectId).success(function(){
						tools.broadcast(updateToken);
						deferred.resolve();
					}).error(function(error){
						//If there was an error, because the item could not be found:
						if(error.code == 101){
							tools.broadcast(updateToken);
							deferred.resolve();
						}
					});
				}else{
					deferred.resolve();
				}
				return deferred.promise;
			},
			addRelation: function(item){
				return {
					"__op": "AddRelation",
					"objects": [tools.ref(item)]
				}
			},
			removeRelation: function(item){
				return {
					"__op": "RemoveRelation",
					"objects": [tools.ref(item)]
				}
			},
			ref: function(item){
				var className = ds.className;
				if(className == 'users')
					className = '_User'
				if(className == 'roles')
					className = '_Role'
					
				return {
					"__type": "Pointer",
					"className": className,
					"objectId": item.objectId
				}
			},
			byRef: function(ref){
				var deferred = $q;
				ds.tools.list().then(function(items){
					for(var i=0; i<items.length; i++)
						if(ref.objectId == items[i].objectId)
							deferred.resolve(items[i]);
				})
				return deferred.promise;
			},
			byId: function(objectId){
				var deferred = $q.defer();
				ds.tools.list().then(function(items){
					for(var i=0; i<items.length; i++)
						if(objectId == items[i].objectId)
							deferred.resolve(items[i]);
				})
				return deferred.promise;
			},
			by: function(col, val){
				var deferred = $q.defer();
				ds.tools.list().then(function(items){
					var table = [];
					for(var i=0; i<items.length; i++)
						if(val == items[i][col])
							table.push(items[i]);
					deferred.resolve(table);
				})
				return deferred.promise;
			},
			liveId: function(objectId){
				for(var i=0; i<ds.list.length; i++)
					if(objectId == ds.list[i].objectId)
						return ds.list[i]
			},
			byIds: function(objectIds){
				var deferred = $q.defer();
				if(objectIds[0].objectId){
					deferred.resolve(objectIds);
				}else{
					var arrayResponse = [];
					ds.tools.list().then(function(items){
						for(var i=0; i<items.length; i++)
							if(objectIds.indexOf(items[i].objectId) != -1)
								arrayResponse.push(items[i])
						deferred.resolve(arrayResponse);
					})
				}
				return deferred.promise;
			}
		}
		
		it[this.className] = this;
	}
	it.ParseData = ParseData;
	return ParseData;
});

app.factory('SpreadSheet', function ($http, $q) {
	var SpreadSheet = function(spreadsheetId){
		var ss 			= this;
		this.id 		= spreadsheetId;
		this.ref		= null;
		this.title 		= null;
		this.author		= [];
		this.link 		= [];
		this.data 		= [];
		this.setId 		= function(id){
			this.id = id;
		}
		this.load 		= function(id){
			var deferred = $q.defer();
			if(id)
				this.setId(id);
			this.ref = 'https://spreadsheets.google.com/feeds/list/'+this.id+'/od6/public/values?alt=json-in-script&callback=JSON_CALLBACK';
			/*
				If content is not loading, make sure you publish the document and that the gid is equal to 0.
				If the gid in the url of the original spreadsheet si not 0, it will throw an error.
			*/
			$http.jsonp(this.ref).success(function(data){
				ss.title 	= data.feed.title.$t;
				ss.link 	= data.feed.link;
				ss.data 	= data.feed.entry;
				for(var i=0; i<data.feed.author.length; i++)
					ss.author.push({
						name: 	data.feed.author[i].name.$t,
						email: 	data.feed.author[i].email.$t
					})

				deferred.resolve(ss);
			});
			
			return deferred.promise;
		}
		this.columns = function(){
			var columns = [];
			var object = this.data[0];
			for (var property in object) {
				if (object.hasOwnProperty(property) && property.indexOf('gsx$') == 0) {
					columns.push(property.slice(4))
				}
			}
			return columns;
		}
		this.toTable = function(){
			var columns = this.columns();
			var table = [];
			for(var r=0; r<this.data.length; r++){
				table[r]=[];
				for(var c=0; c<columns.length; c++){
					table[r][c] = this.data[r]['gsx$'+columns[c]].$t
				}
			}
			return table;
		},
		this.toJson = function(row){
			var columns = this.columns();
			if(row != undefined){
				var item = {}
				for(var c=0; c<columns.length; c++){
					item[columns[c]] = this.data[row]['gsx$'+columns[c]].$t
				}
				return item;
			}else{
				var list = [];
				for(var r=0; r<this.data.length; r++){
					list[r]={};
					for(var c=0; c<columns.length; c++){
						list[r][columns[c]] = this.data[r]['gsx$'+columns[c]].$t
					}
				}
				return list;
			}
		}
	}

	it.SpreadSheet = SpreadSheet;
	return SpreadSheet;
});
app.factory('GeoService', function ($q) {
	var  GeoService={
		helpModal:function(){
			$('#userGeoHelpModal').modal('show');
		},
		location:function(){
			var deferred = $q.defer();
			if(navigator.geolocation){
				navigator.geolocation.getCurrentPosition(function(geo){
					deferred.resolve(geo)
				})
			}else{
				deferred.resolve({status:'error',message:'Geolocation is not supported by this browser.'});
			}
			return deferred.promise;
		},
		distance:function(geo1,geo2){
			var from = new google.maps.LatLng(geo1.latitude,geo1.longitude);
			var to = new google.maps.LatLng(geo2.latitude,geo2.longitude);
			var dist = google.maps.geometry.spherical.computeDistanceBetween(from, to);
			var miles = dist*.00062137;
			return miles;
		},
		parsePoint:function(geo){
			console.log(geo)
			if(geo.coords)
				return {
					__type:"GeoPoint",
					latitude:geo.coords.latitude,
					longitude:geo.coords.longitude
				}
			else
				return {
					__type:"GeoPoint",
					latitude:geo.latitude,
					longitude:geo.longitude
				}
		},
		parseSearch:function(geoShape){
			var where = {};
			if(geoShape.type=='circle'){
				where={
					"location": {
						"$nearSphere": {
							"__type": "GeoPoint",
							"latitude": geoShape.latitude,
							"longitude": geoShape.longitude
						},
						"$maxDistanceInMiles": geoShape.radius
					}
				}
			}else if(geoShape.type=='rectangle'){
				where = {
					"location": {
						"$within": {
							"$box": [{
								"__type": "GeoPoint",
								"latitude": geoShape.northEast.latitude,
								"longitude": geoShape.northEast.longitude
							},{
								"__type": "GeoPoint",
								"latitude": geoShape.southWest.latitude,
								"longitude": geoShape.southWest.longitude
							}]
						}
					}
				}
			}else if(geoShape.type=='marker'){
				where={
					"location": {
						"$nearSphere": {
							"__type": "GeoPoint",
							"latitude": geoShape.latitude,
							"longitude": geoShape.longitude
						}
					}
				}
			}
			return where;
		}
	}
	it.GeoService = GeoService;
	return GeoService;
});
app.factory('FileService', function ($http, $q) {
	var FileService = {
		upload:function(name,b64){
			var deferred = $q.defer();
			var file = new Parse.File(name, { base64: b64});
			file.save().then(function(data) {
				deferred.resolve(data);
			}, function(error) {
				deferred.reject(error);
			});
			return deferred.promise;
		}
	}
	it.FileService = FileService;
	return FileService;
});

app.factory('Documents', function ($rootScope, $http, $q, Auth, Data, FileService) {
	var Docs		= Data({
		className: 	'Documents',
		query: 		'?order=-createdAt',
		fireRef:	'Documents'
	});
	
	Auth.tools.init().then(function(user){
		Docs.tools.list()
	});
	
	var Documents = {
		root: Docs,
		upload: function(file){
			var deferred = $q.defer();
			file.status = 'Uploading';
			FileService.upload(file.name, file.src).then(function(data) {
				file.status = 'Recording';
				var doc = {
					__type: "File",
					name: 	data._name,
					url: 	data._url
				}
				var entry = {
					file: doc,
					name: file.name
				}
				Docs.tools.save(entry).then(function(data){
					file.url = data.file.url;
					file.status = 'Complete'
					deferred.resolve(data);
				})
			});
			return deferred.promise;
		}
	}
	it.Documents = Documents;
	return Documents;
});


app.factory('Dados', function($q, $rootScope, $http, config, Auth){
	/*
		The purpose of this factory is to provide a simple interface between data and Parse.
		- Realtime updates
		- Offline Capable
		- Sync Ability
		- Dependent data modules
			If one data source referrs to a secondary data source, then it is necissary to resolve the dependancies first.
		- Provide immediate ID, provide incramental ID if required.
	*/
		
	var parseUrl = config.parse.root+'/classes/';
	var ListaDeDados 	= [];
	var defaults 		= {
		className: 		'NewClass',
		query: 			'',
		dependencies: 	[]
	}
	function hash(params){
		var keys = Object.keys(params);
		var string = params.className+params.query;
		for(var ret = 0, i = 0, len = string.length; i < len; i++)
			ret = (31 * ret + string.charCodeAt(i)) << 0;
		return 'P'+ret+'D';
	}
	function Connection(params){ //Used to create an actual instance of the connection.  Instance should not be called publically.
		var ds = this;
			ds.deferred 		= $q.defer();
			ds.params 			= params;
			ds.state 			= {sync: 'initial'};
			ds.db 				= new PouchDB(ds.params.hash, {auto_compaction: true});
			ds.fire 			= new Firebase(config.firebase+ds.params.className);
		it[ds.params.className+'000'+ds.params.hash] = ds;
		//GET LOCAL LIST FIRST
		ds.db.allDocs({include_docs: true, descending: true}, function(err, doc) {
			ds.list = doc.rows;
		});
		//LISTEN FOR LOCAL CHANGES
		ds.db.changes({
			since: 'now',
				live: true,
				include_docs: true
			}).on('change', function(change) {
				ds.db.allDocs({include_docs: true, descending: true}, function(err, doc) {
					ds.list = doc.rows;
				});
				$rootScope.$broadcast(ds.params.hash, change.doc);
			});
		
		//LISTEN FOR REMOTE CHANGES
		ds.fire.on("child_added", function(snapshot) {
			if(ds.state.sync !== 'initial'){
				var snap = snapshot.val();
				ds.db.get(snap.localId).then(function(doc){
					console.log(snap, doc)
					if(doc.updatedAt !== snap.updatedAt)
						if(snap.localDb == ds.params.hash)
							privateTools.syncFromParse(doc)
						else
							ds.state.data = 'parseChange'
				}).catch(function(error){
					//Item does not exist in DB --- fetch full query for re-sync
					ds.state.data = 'parseChange'
				})
			}
		});
		ds.fire.on("child_changed", function(snapshot) {
			if(ds.state.sync !== 'initial'){
				var snap = snapshot.val();
				ds.db.get(snap.localId).then(function(doc){
					if(doc.updatedAt !== snap.updatedAt)
						privateTools.syncFromParse(doc)
				}).catch(function(error){
					//Item does not exist in DB --- fetch full query for re-sync
					ds.state.data = 'parseChange'
				})
			}else{
				//Full sync is already in progress... re-check when done...
			}
		});
		
		var privateTools = {
			init: function(){
				ds.db.info().then(function (r) {
					if(r.doc_count == 0)
						privateTools.syncAllFromParse()
				})
			},
			waitForOthers: function(){
				var deferred = $q.defer();
				var promises = [];
				for(var i=0; i<ds.dependencies.length; i++)
					promises.push(ds.dependencies.object.upToDate())
				$q.all(promises).then(function(){
					deferred.resolve('Everyone is ready.');
				});
				return deferred.promise;
			},
			syncToParse: function(doc){
				var deferred = $q.defer();
				var item = angular.copy(doc);
				item.ref = item._id;
				item.rev = item._rev;
				delete item._id;
				delete item._rev;
				delete item.local;
				delete item.syncError;
				
				if(item.objectId){
					var objectId = item.objectId;
					delete item.objectId;
					delete item.updatedAt;
					delete item.createdAt;
					$http.put(parseUrl + ds.params.className + '/' + objectId, item).success(function(data) {
						item.objectId 	= doc.objectId;
						item.createdAt 	= doc.createdAt;
						item.updatedAt 	= data.updatedAt;
						item._id 		= item.ref;
						item._rev 		= item.rev;
						delete item.ref;
						delete item.rev;
						ds.db.put(item).then(function(r){
							ds.state.data = 'clean';
							ds.state.sync = 'upToDate';
							$rootScope.$broadcast(ds.params.hash, 'upToDate');
							var fireRef = ds.fire.child(item.objectId);
							fireRef.set({
								localDb: 	ds.params.hash,
								objectId: 	item.objectId,
								localId: 	r.id,
								updatedAt: 	item.updatedAt,
							});
							deferred.resolve('Sync Complete');
						})
					}).error(function(e) {
						item.syncError 	= e;
						item._id 		= item.ref;
						item._rev 		= item.rev;
						delete item.ref;
						delete item.rev;
						ds.db.put(item)
						deferred.reject(e)
					})
					return deferred.promise;
				}else{
					$http.post(parseUrl + ds.params.className, item).success(function(data) {
						item.objectId 	= data.objectId;
						item.createdAt 	= data.createdAt;
						item.updatedAt 	= data.createdAt;
						item._id 		= item.ref;
						item._rev 		= item.rev;
						delete item.ref;
						delete item.rev;
						ds.db.put(item).then(function(r){
							ds.state.data = 'clean';
							ds.state.sync = 'upToDate';
							$rootScope.$broadcast(ds.params.hash, 'upToDate');
							var fireRef = ds.fire.child(item.objectId);
							fireRef.set({
								localDb: 	ds.params.hash,
								objectId: 	item.objectId,
								localId: 	r.id,
								updatedAt: 	item.updatedAt,
							});
							deferred.resolve('Sync Complete');
						})
					}).error(function(e) {
						item.syncError 	= e;
						item._id 		= item.ref;
						item._rev 		= item.rev;
						delete item.ref;
						delete item.rev;
						ds.db.put(item)
						deferred.reject(e)
					})
				}
			},
			syncFromParse: function(doc){
				//Go through the DB and find existing, replace data and re-save
				console.log('doc', doc)
				$http.get('https://api.parse.com/1/classes/'+ds.params.className+'/'+doc.objectId).then(function(response){
					console.log('parseItem', response)
				});
			},
			// [] TODO
			// syncAllFromParse: function(){
			// 	$http.get('https://api.parse.com/1/classes/'+ds.params.className).then(function(response){
			// 		var list = response.data.results;
			// 		for(var i=0; i<list.length; i++)
			// 			tools.
			// 			var item = list[i]
			// 			ds.db.get(snap.localId).then(function(doc) {
			// 				if (doc.updatedAt !== snap.updatedAt)
			// 					if (snap.localDb == ds.params.hash)
			// 						privateTools.syncFromParse(doc)
			// 					else
			// 						ds.state.data = 'parseChange'
			// 			}).catch(function(error) {
			// 				//Item does not exist in DB --- fetch full query for re-sync
			// 				ds.state.data = 'parseChange'
			// 			})
			// 		}
			// 	});
			// },
			saveLocally: function(item){
				
			}
		}
		ds.upToDate = function(){
			var deferred = $q.defer();
			if(ds.state.sync == 'upToDate')
				deferred.resolve();
			else
				$rootScope.$on(ds.params.hash, function(event, data){
					if(data == 'upToDate')
						deferred.resolve();
				});
			return deferred.promise;
		}
		ds.tools = {
			// Listen, Sync, 
			item: {
				list: function(){
					var deferred = $q.defer();
					ds.db.allDocs({include_docs: true, descending: true}, function(err, doc) {
						deferred.resolve(doc.rows);
					});
					return deferred.promise;
				},
				save: function(item){
					var deferred = $q.defer();
					if(!item._id)
						item._id = Math.floor((Math.abs(Math.sin(moment().format('x')) * 2000000000000)) % 2000000000000).toString(36);
					ds.state.sync = 'localChange';
					ds.db.put(item).then(function(r){
						ds.db.get(item._id).then(function(doc){
							privateTools.syncToParse(doc).then(function(result){
								alert('Saved Successfully!')
							}, function(error){
								console.error(error);
							})
						})
					})
					return deferred.promise;
				},
				delete: function(item){
					
				}
			},
			permissions: {
				
			},
			relations: {
				
			},
			destroy: function(){
				if(confirm('Are you sure you want to destroy this DB?  All data could be lost.')){
					ds.db.destroy()
				}
			}
		}
		privateTools.init();
		return ds;
	}

	
	var Dados = {
		data: function(){
			
		},
		list: function(){ //returns a list of all registered data objects.
			return ListaDeDados;
		},
		connection: function(params){ //Used to create a new connection.
			if(typeof(params) != 'object')
				params = angular.extend(defaults, {className: params})
			params.hash = hash(params);
			if(!ListaDeDados[params.hash])
				ListaDeDados[params.hash] = new Connection(params);
				
			return ListaDeDados[params.hash];
		},
		acl: {
			
		}
	}
	return Dados;
})