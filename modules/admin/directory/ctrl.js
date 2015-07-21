app.lazy.controller('WorkDirectoryCtrl', function($rootScope, $scope, $q, $http, config, Auth){

	var tools = $scope.tools = {
		init: function(){
			var deferred = $q.defer();
			var scopes = [
				'https://www.googleapis.com/auth/admin.directory.user',
				'https://www.googleapis.com/auth/admin.directory.orgunit',
				'https://www.googleapis.com/auth/admin.directory.user.readonly',
				'https://www.googleapis.com/auth/admin.directory.group.readonly',
			];
			Auth.tools.google.scopes(scopes).then(function(result){
				gapi.client.load('admin', 'directory_v1', function(){
					var directory = tools.load.directory();
					var groups = tools.load.groups();
					$q.all([directory, groups]).then(function(dir, grp){
						deferred.resolve(dir,grp)
					})
				});
			});
			$http.get('https://api.parse.com/1/classes/udEmail').success(function(data){
				$scope.udEmails = data.results;
			})
			return deferred.promise;
		},
		load: {
			cloud: function(){
				$http.post('https://api.parse.com/1/functions/GoogleApi')
			},
			general: function(cmd, params){
				var deferred = $q.defer();
				// var userDomain = $rootScope.user.profile.domain; //GEt the domain to load settings.
				var params = angular.extend({domain: config.domain}, params)
				var request = gapi.client.directory[cmd].list(params);
				request.execute(function(data) {
					deferred.resolve(data);
				});
				return deferred.promise;
			},
			directory: function(){
				var users = tools.load.general('users');
					users.then(function(data){
						$scope.directory = data.users
					})
					return users;
			},
			groups: function(){
				var groups = tools.load.general('groups')
				groups.then(function(data){
					$scope.groups = data.groups;
					for(var i=0; i<data.groups.length; i++)
						tools.load.members(data.groups[i]);
				})
				return groups;
			},
			members: function(group){
				var deferred = $q.defer();
				var request = gapi.client.directory.members.list({
					domain: config.domain,
					groupKey: group.id
				});
				
				request.execute(function(data) {
					group.members = data.members;
					deferred.resolve(data);
				});
				return deferred.promise;
			}
		},
		user: {
			new: function(user){
				$scope.udEmails.splice($scope.udEmails.indexOf(user), 1);
				user.account = user.account+'@'+config.domain;
				if(!user.firstname){
					user.firstname = user.name.split(' ')[0]
					user.lastname = user.name.split(' ')[1]
				}
				var insert = gapi.client.directory.users.insert;
				var data = {
					"domain":		config.domain,
					"primaryEmail": user.account,
					"name": {
						"givenName": user.firstname,
						"familyName": user.lastname
					},
					"suspended": false,
					"password": 'changeme',
					// "hashFunction": "SHA-1",
					"changePasswordAtNextLogin": true,
					"ipWhitelisted": false,
					"emails": [{
						"address": user.account,
						"type": "work",
						"customType": "",
						"primary": true
					}],
					"addresses": [{
						"type": "work",
						"customType": "",
						"streetAddress": "17 Ridge Rd.",
						"locality": "Silver City",
						"region": "NM",
						"postalCode": "88062"
					}],
					"externalIds": [{
						"value": user.employeeid,
						"type": "custom",
						"customType": "employee"
					}],
					"relations": [],
					"organizations": [{
						"name": "James Hamilton Construction Co.",
						"title": user.title,
						"primary": true,
						"type": "work",
						"description": user.description
					}],
					"phones": [],
					"orgUnitPath": "",
					"includeInGlobalAddressList": true
				}
				if(user.workphone)
					data.phones.push({
						"value": user.workphone,
						"type": "work"
					})
				if(user.cellphone)
					data.phones.push({
						"value": user.cellphone,
						"type": "mobile"
					})
					
					
				insert(data).then(function(r){
					console.log(r);
					it.r = r;
				})
			}
		}
	}
	
	it.WorkDirectoryCtrl = $scope;
});