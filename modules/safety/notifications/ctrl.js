app.lazy.controller('SafetyNotificationsCtrl', function($rootScope, $scope, $routeParams, $http, $q, config, SpreadSheet, Auth){
		var data = $scope.data = {};
		if($routeParams.id)
			$scope.spreadsheetId = $routeParams.id;
		else
			$scope.spreadsheetId = '1gR1iV7gjCysZqk0wJk6ptSLE-M1rgaXvcpkD2QpPkfs';
		var notificationSheet = new SpreadSheet();
		
		var tools = $scope.tools = {
			init: function(){
				tools.spreadSheet.load($scope.spreadsheetId)
			},
			drive: {
				files: function(access_token) {
					var config = {
						params: {
							'alt': 'json'
						},
						headers: {
							'Authorization': 'Bearer ' + access_token,
							'GData-Version': '3.0'
						}
					};
					return $http.get('https://www.googleapis.com/drive/v2/files', config)
				}
			},
			spreadSheet: {
				load: function(id){
					notificationSheet.load(id).then(function(ss){
						$scope.columns 	= notificationSheet.columns();
						$scope.table 	= notificationSheet.toTable();
						$scope.json 	= notificationSheet.toJson();
					})
				}
			},
			notifications: {
				run: function(){
					var table = $scope.json;
					for(var i=0; i<table.length; i++){
						var row 			= table[i];
						var expires 		= row[data.expires];
						var notifyBefore	= row[data.notifyBefore];
						var expDate 		= moment(expires);
						var future 			= moment().add(notifyBefore, 'days');
						var today 			= moment();
						var hr 				= moment(expires).fromNow(); 
						var a 				= expDate.diff(today, 'days');
						if (a == notifyBefore) //a < 14 && a > 0
							alert('PS.  You need to renew: ' + row.license + ' in: ' + hr + '!')
					}
				},
				setCols: function(col){
					if($scope.data.expires && !$scope.data.notifyBefore)
						$scope.data.notifyBefore = col;
					else
						$scope.data.expires = col;
				},
				colClass: function(col){
					if(col == $scope.data.expires)
						return 'info';
					else if(col == $scope.data.notifyBefore)
						return 'warning';
				},
			},
			row: {
				focus: function(index){
					$scope.current = notificationSheet.toJson(index)
				},
				notifyIn: function(index){
					if($scope.json){
						var row 			= $scope.json[index];
						var expires 		= row[data.expires];
						var notifyBefore	= row[data.notifyBefore];
						var expDate 		= moment(expires);
						var today 			= moment();
						var a 				= expDate.diff(today, 'days');
						return a;
					}
				},
				eminate: function(index){
					if($scope.json){
						var row 			= $scope.json[index];
						var expires 		= row[data.expires];
						var notifyBefore	= row[data.notifyBefore];
						var expDate 		= moment(expires);
						var today 			= moment();
						var a 				= expDate.diff(today, 'days');
						if(a > 0 && a < 7)
							return 'danger';
					}
				}
			},
			runNotifications: function(spreadsheetId){
				$http.post('https://api.parse.com/1/classes/NotifyTableId', {
					spreadsheetId: spreadsheetId
				}).then(function(response) {
					$scope.response = response;
				})
				tools.uploadNotifications($scope.table)
			},
			uploadNotifications: function(table){
				for(var i=0; i<table.length; i++){
					var n = table[i];
					var notification = {
						expirationdate: n[0],
						license: n[1],
						link: n[2],
						renewedon: n[3],
						responsibleparty: n[4]
					}
					$http.post('https://api.parse.com/1/classes/Notifications', notification).then(function(response) {
						$scope.response = response;
					})
				}
			}
		}
		
		// Auth.tools.google.scopes('https://www.googleapis.com/auth/drive').then(function(gAuth) {
		// 	tools.drive.files(gAuth.access_token).success(function(result) {
		// 		$scope.files = result.items;
		// 	})
		// })
		
		tools.init();
	
		it.SafetyNotificationsCtrl = $scope;
});