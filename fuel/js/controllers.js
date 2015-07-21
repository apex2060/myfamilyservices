app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $http, $timeout, $q, config, ParseData){
	$scope.rp = $routeParams;
	$scope.config = config;
	$scope.tickets = [];
	var fuelSteps 	= ['employeeId', 'employeePin', 'equipmentNumber', 'equipmentUsage', 'preReading', 'postReading', 'gallons', 'newCombo'];
	var stringEnteries = ['employeeId', 'employeePin', 'equipmentNumber', 'newCombo']
	var Employees = ParseData('HrEmployees');
	var Equipment = ParseData({
			method: 	'get',
			query: 		'/classes/Equipment?include=category',
			table:		'Equipment',
		});

	$scope.currentCombo = localStorage.getItem('fuelCombo') || '0000';
	
	var tools = $scope.tools = {
		init: function(){
			tools.offline.install();
			tools.station.init();
			tools.data.init();
		},
		alert: function(title, message){
			$rootScope.alert = {
				title: title,
				message: message
			}
			$('#alert').modal('show')
		},
		fuel: {
			init: function(){
				tools.fuel.save();
				$scope.fuelTicket = {
					step: 0,
					gen: {},
					notices: []
				}
				navigator.geolocation.getCurrentPosition(function(position){
					$scope.fuelTicket.geo = tools.fun.geo(position.coords);
				});
			},
			keypad: function(char){
				navigator.vibrate(100);
				var s = $scope.fuelTicket.step;
				var cv = $scope.fuelTicket[fuelSteps[s]] || ''
					cv = cv.toString();
					
				if(char == 'delete')
					if(cv.length)
						cv = cv.substring(0, cv.length-1)
					else
						cv = cv
				else
					cv = ("" + cv + char)
					
				if(stringEnteries.indexOf(fuelSteps[s]) == -1)
					$scope.fuelTicket[fuelSteps[s]] = Number(cv);
				else
					$scope.fuelTicket[fuelSteps[s]] = cv;
			},
			prevStep: function(){
				if($scope.fuelTicket.step > 0)
					$scope.fuelTicket.step--;	
			},
			step: function(){
				console.log($scope.fuelTicket)
				var s = $scope.fuelTicket.step;
				localStorage.setItem('fuelTicket', angular.toJson($scope.fuelTicket));
				
				if(fuelSteps[s])
					tools.fuel.steps[fuelSteps[s]]($scope.fuelTicket).then(function(fuelTicket){
						$scope.fuelTicket = fuelTicket;
						$scope.fuelTicket.step++;
					}).catch(function(e){
						navigator.vibrate(200)
						tools.alert('Oops!', e)
					})
				else
					$scope.fuelTicket.step++;
			},
			steps: {
				employeeId: function(ticket){
					console.log('Lookup Employee')
					var deferred = $q.defer();
						Employees.then(function(data){
							console.log('got list')
							var list = data.results;
							for(var i=0; i<list.length; i++)
								if(list[i].number == ticket.employeeId)
									ticket.gen.employee = list[i]
							if(ticket.gen.employee)
								deferred.resolve(ticket);
							else
								deferred.reject('Sorry, the entered employee ID could not be found.')
						}, function(){
							alert('error')
						})
					
					return deferred.promise;
				},	//Lookup Employee
				employeePin: function(ticket){
					var deferred = $q.defer();
					if(hex_md5(ticket.employeePin) == ticket.gen.employee.pin){
						ticket.employeePin = hex_md5(ticket.employeePin);
						deferred.resolve(ticket);
					}else{
						deferred.reject('Your pin is incorrect.')
					}
					return deferred.promise;
				}, //Verify Pin
				equipmentNumber: function(ticket){
					var deferred = $q.defer();
					Equipment.then(function(data){
						var list = data.results;
						for(var i=0; i<list.length; i++)
							if(list[i].eId == ticket.equipmentNumber || list[i].eId == config.settings.equipmentPrefix+ticket.equipmentNumber)
								ticket.gen.equipment = list[i]
						if(ticket.gen.equipment){
							ticket.notices = ticket.notices.concat(ticket.gen.equipment.notices);
							ticket.notices.push('You need to bring your vehicle in for inspection.')
							deferred.resolve(ticket);
						}else{
							deferred.reject('Sorry, the entered equipment ID could not be found.')
						}
					})
					return deferred.promise;
				}, //Lookup Equipment
				equipmentUsage: function(ticket){
					var deferred = 		$q.defer();
					var equip 			= ticket.gen.equipment;
					var stepDiff 		= ticket.equipmentUsage - equip.lastStep;
					var usageDiff 		= ticket.equipmentUsage - equip.usage;
					
					if(stepDiff > equip.category.usageStep)
						ticket.notices.push('This vehicle needs a checkup!');
						
					if(usageDiff > 0)
						deferred.resolve(ticket);
					else
						deferred.reject('Your last usage reading was: '+equip.usage+' which is higher than what you just entered.');
						
					return deferred.promise;
				},
				preReading: function(ticket){
					var deferred = $q.defer();
					tools.alert('The current combination is', $scope.currentCombo)
					deferred.resolve(ticket);
					return deferred.promise;
				},
				postReading: function(ticket){
					var deferred = $q.defer();
					if(ticket.preReading > ticket.postReading)
						deferred.reject('Your current reading is less than your pre-reading number.')
					else
						deferred.resolve(ticket);
					return deferred.promise;
				},
				gallons: function(ticket){
					var deferred = $q.defer();
					if(ticket.postReading-ticket.preReading != ticket.gallons)
						ticket.notices.push('Your gallons did not match the pre-post reading amount')
					
					deferred.resolve(ticket);
					return deferred.promise;
				},
				newCombo: function(ticket){
					var deferred = $q.defer();
					$scope.currentCombo = ticket.newCombo;
					localStorage.setItem('fuelCombo', ticket.newCombo);
					deferred.resolve(ticket);
					return deferred.promise;
				},
				submit: function(ticket){
					var deferred = $q.defer();
					deferred.resolve(ticket);
					return deferred.promise;
				}
			},
			save: function(){
				var fuelTicket = localStorage.getItem('fuelTicket');
				if(fuelTicket){
					fuelTicket = angular.fromJson(fuelTicket);
					fuelTicket.station = tools.fun.pointer('FuelStations', $scope.station.objectId);
					if(fuelTicket.step == fuelSteps.length-1)
						var local = 'fuelTicketsComplete'
					else
						var local = 'fuelTicketsDiscarded'
						
					var tickets = localStorage.getItem(local);
					if(!tickets)
						tickets = '[]';
					tickets = angular.fromJson(tickets)
					tickets.push(fuelTicket);
					localStorage.setItem(local, angular.toJson(tickets))
					delete localStorage.fuelTicket;
					$scope.tempDiscard = false;
				}
			},
			discard: function(){
				var fuelTicket = angular.copy($scope.fuelTicket);
					fuelTicket.discarded = true;
				localStorage.setItem('fuelTicket', angular.toJson(fuelTicket));
				if(confirm('Are you sure you want to discard this entry?')){
					tools.fuel.init();
					$scope.tempDiscard = true;
				}
			},
			undoDiscard: function(){
				var fuelTicketsDiscarded = localStorage.getItem('fuelTicketsDiscarded') || '[]';
					fuelTicketsDiscarded = angular.fromJson(fuelTicketsDiscarded);
				var lastTicket = fuelTicketsDiscarded.pop();
				if(prompt('What is your employee pin?') == lastTicket.gen.employee.pin){
					$scope.tempDiscard = false;
					$scope.fuelTicket = lastTicket;
					localStorage.setItem('fuelTicket', angular.toJson(lastTicket));
					localStorage.setItem('fuelTicketsDiscarded', angular.toJson(fuelTicketsDiscarded));
				}else{
					alert('Sorry that pin did not match the last discarded ticket.');
				}
			},
		},
		admin: {
			init: function(){
				var fuelTicketsComplete 	= localStorage.getItem('fuelTicketsComplete')	|| '[]';
					fuelTicketsComplete 	= angular.fromJson(fuelTicketsComplete);
				var fuelTicketsDiscarded 	= localStorage.getItem('fuelTicketsDiscarded') 	|| '[]';
					fuelTicketsDiscarded 	= angular.fromJson(fuelTicketsDiscarded);
					$scope.tickets = {
						complete: 	fuelTicketsComplete,
						discarded: 	fuelTicketsDiscarded
					}
			},
			sync: function(){
				tools.fuel.init();
				var fuelTicketsComplete 	= localStorage.getItem('fuelTicketsComplete')	|| '[]';
					fuelTicketsComplete 	= angular.fromJson(fuelTicketsComplete);
				var fuelTicketsDiscarded 	= localStorage.getItem('fuelTicketsDiscarded') 	|| '[]';
					fuelTicketsDiscarded 	= angular.fromJson(fuelTicketsDiscarded);
				var fuelSyncStatus = $scope.fuelSyncStatus = [];
				
				var promises = $scope.syncPromises = [];
				for(var i=0; i<fuelTicketsComplete.length; i++){
					(function(ticket){
						var p = $http.post(config.parse.root+'/classes/FuelTickets', ticket);
						p.success(function(data){
							fuelSyncStatus.push(angular.extend(ticket, data))
						})
						promises.push(p);
					})(fuelTicketsComplete[i])
				}
				for(var i=0; i<fuelTicketsDiscarded.length; i++){
					(function(ticket){
						var p = $http.post(config.parse.root+'/classes/FuelTickets', ticket);
						p.success(function(data){
							fuelSyncStatus.push(angular.extend(ticket, data))
						})
						promises.push(p);
					})(fuelTicketsDiscarded[i])
				}
				
				$q.all(promises).then(function(synced){
					$scope.syncSuccess = 'Sync successful!';
					delete localStorage.fuelTicketsComplete;
					delete localStorage.fuelTicketsDiscarded;
				}, function(error){
					$scope.syncError = error;
				})
			}
		},
		station: {
			init: function(){
				$scope.station = localStorage.getItem('station') || '{}';
				$scope.station = angular.fromJson($scope.station);
			},
			setGeo: function(){
				navigator.geolocation.getCurrentPosition(function(position){
					$scope.station.geo = tools.fun.geo(position.coords);
				});
			},
			load: function(){
				$http.get(config.parse.root+'/classes/FuelStations').success(function(data){
					$scope.stations = data.results;
				});
			},
			clearList: function(){
				$scope.stations = null;
			},
			set: function(s){
				$scope.station = s;
				tools.station.clearList();
			},
			clear: function(){
				if(confirm('Are you sure you want to clear this station information?'))
					$scope.station = {};
			},
			save: function(){
				localStorage.setItem('station', angular.toJson($scope.station))
			},
			sync: function(){
				var station = angular.copy($scope.station);
				if(station.objectId){
					delete station.objectId;
					delete station.createdAt;
					delete station.updatedAt;
					$http.put(config.parse.root+'/classes/FuelStations/'+$scope.station.objectId, station).success(function(result){
						$scope.station = angular.extend($scope.station, result);
						localStorage.setItem('station', angular.toJson($scope.station))
						alert('Sync Successful!')
					});
				}else{
					$http.post(config.parse.root+'/classes/FuelStations', station).success(function(result){
						$scope.station = angular.extend($scope.station, result);
						localStorage.setItem('station', angular.toJson($scope.station))
						alert('Sync Successful!')
					});
				}
			}
		},
		data: {
			init: function(){
				tools.data.pull();
			},
			pull: function(){
				Employees.then(function(data){
					$scope.employees = data.results;
				})
				Equipment.then(function(data){
					$scope.equipment = data.results;
				})
			},
			push: function(){
				// Equipment.then(function(data){
				// 	var list = data.results;
				// 	for(var i=0; i<list.length; i++){
				// 		var equipment = list[i];
				// 			delete equipment.objectId;
				// 			delete equipment.createdAt;
				// 			delete equipment.updatedAt;
				// 			equipment.usage 		= 0;
				// 			equipment.maintenance 	= 0;
				// 			equipment.notices 		= ['Your equipment sequence was: '+i]
				// 		$http.post(config.parse.root+'/classes/Equipment', equipment)
				// 	}
				// })
			}
		},
		fun: {
			geo: function(coord){
				return {
					__type: 	'GeoPoint',
					latitude: 	coord.latitude,
					longitude: 	coord.longitude,
				}
			},
			pointer: function(table, objectId){
				return {
					__type: 	'Pointer',
					className: 	table,
					objectId: 	objectId
				}
			}
		},
		offline: {
			install: function(){
				// navigator.serviceWorker.register('/fuel/worker.js', {
				// 	scope: '/fuel/'
				// }).then(function(reg) {
				// 	console.log('◕‿◕', reg);
				// }, function(err) {
				// 	console.log('ಠ_ಠ', err);
				// });
			}
		}
	}
	
	it.MainCtrl = $scope;
});