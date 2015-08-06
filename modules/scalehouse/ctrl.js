app.lazy.controller('ScaleCtrl', function($rootScope, $scope, $routeParams, $http, $q, $timeout, $interval, config, Easy, FileService, Data, Auth){
	$scope.temp = {};
	$scope.rp = $routeParams;
	$scope.contractTypes = ['External','Internal'];//['External', 'Internal', 'Pos'];
	$scope.permissions 	= ['ScaleMaster'];
	$scope.weighmasterId = '233';
	it.user = Auth;
	
	var Companies 		= Data('ScaleCompanies');
	var Contracts 		= Data('ScaleContracts');
	var Tickets 		= Data({
			className: 	'ScaleTickets',
			query: 		'?order=-createdAt',
			fireRef:	'ScaleTickets'
		}); //There will eventually be thousands of tickets: this call will not be sufficient...
			//Also, we need to work in multiple locations.
		Tickets.byVehicle = function(vehicleId){
			var deferred = $q.defer();
			this.tools.list().then(function(list){
				var table = []
				for(var i=0; i<list.length; i++)
					if(list[i].vehicle == vehicleId)
						table.push(list[i])
				deferred.resolve(table)
			})
			return deferred.promise;
		}
	var Materials 		= Data('ScaleMaterials');
	var Vehicles 		= Data('ScaleVehicles');

	$scope.$on(Companies.listener, function(e, companies) {
		$scope.companies = companies;
	});
	$scope.$on(Contracts.listener, function(e, contracts) {
		$scope.contracts = contracts;
	});
	$scope.$on(Tickets.listener, function(e, tickets) {
		$scope.tickets = tickets;
	});
	$scope.$on(Materials.listener, function(e, materials) {
		$scope.materials = materials;
	});
	$scope.$on(Vehicles.listener, function(e, vehicles) {
		tools.ticket.listVehicles();
	});


	var tools = $scope.tools = {
		url: function(){
			if(!Auth.tools.isOr($scope.permissions)){
				return '/static/auth.html';
			}else{
				if($scope.receipt && !$routeParams.id)
					return '/modules/scalehouse/receipt'+$scope.receipt.contract.type+'.html';
				else if(!$routeParams.view)
					return '/modules/scalehouse/default.html'	
				else
					return '/modules/scalehouse/'+$routeParams.view+'.html'
			}
		},
		init: function(){
			var deferred = $q.defer();
			Auth.init().then(function(user){
				$q.all([Companies.tools.list(), Contracts.tools.list(), Tickets.tools.list(), Materials.tools.list(), Vehicles.tools.list()]).then(function(data){
					$scope.companies = data[0];
					$scope.contracts = data[1];
					$scope.tickets = data[2];
					$scope.materials = data[3];
					$scope.vehicles = data[4];
					deferred.resolve(data);
				})
			})
			return deferred.promise;
		},
		reports: {
			init: function(){
				tools.reports.materialChart();
				tools.reports.ticketChart();
			},
			materialChart: function(){
				renderMaterials();
				$scope.$on(Materials.listener, function(e, materials) {
					renderMaterials();
				});
				function renderMaterials(){
					Materials.tools.list().then(function(materials){
						var produced = [['Name','Quantity']];
						var available = [['Name','Quantity']];
						for(var i=0; i<materials.length; i++){
							produced.push([
								materials[i].name,
								materials[i].produced
							])
							available.push([
								materials[i].name,
								materials[i].available
							])
						}
							
						var produced = google.visualization.arrayToDataTable(produced)
						var available = google.visualization.arrayToDataTable(available)
						
						// var data = google.visualization.arrayToDataTable(table);
						var options = {
							title: 'Material Distribution',
							legend: 'none'
						};
						// var chart = new google.visualization.PieChart(document.getElementById('piechart'));
						var chart = new google.visualization.ColumnChart(document.getElementById('materialChart'));
						
						var diffData = chart.computeDiff(produced, available);
							chart.draw(diffData, options);
		
						// chart.draw(data, options);
					})
				}
			},
			ticketChart: function(){
				renderCompanyMaterials();
				$scope.$on(Tickets.listener, function(e, tickets) {
					renderCompanyMaterials();
				});
				function renderCompanyMaterials(){
					tools.init().then(function(){
						var companies 	= angular.copy($scope.companies);
						var contracts 	= angular.copy($scope.contracts);
						var tickets 	= angular.copy($scope.tickets);
						var materials 	= angular.copy($scope.materials);
						var vehicles 	= angular.copy($scope.vehicles);
						
						//Shorten date
						for(var i=0; i<tickets.length; i++)
							tickets[i].day = tickets[i].createdAt.substr(0, 10)
							
						function uniqueFilter(table, cols, uniqueCol, uniqueVal){
							var list = {cols: cols}
							for(var i=0; i<list.cols.length; i++){
								var key = list.cols[i];
								list[key] = [];
								for(var ii=0; ii<table.length; ii++)
									if(!uniqueCol || !uniqueVal)
										list[key].push(table[ii][key])
									else
										if(table[ii][uniqueCol] == uniqueVal)
											list[key].push(table[ii][key])
								list[key] = list[key].getUnique();
							}
							return list;
						}
						
						var cols = ['contract', 'company', 'material', 'vehicle', 'day'];
						var list = uniqueFilter(tickets, cols);

						
						var header = ['Company'];
							for(var i=0; i<list.material.length; i++){
								var mn = 'NOT FOUND'
								for(var ii=0; ii<materials.length; ii++){
									if(materials[ii].objectId == list.material[i])
										mn = materials[ii].name
								}
								header.push(mn)
							}
						var table = [header];
							for(var i=0; i<list.company.length; i++){
								var company = {
									objectId: list.company[i],
									profile: companies.filter(function(company){
										return company.objectId == list.company[i];
									})[0],
									tickets: tickets.filter(function(ticket){
										return ticket.company == list.company[i];
									})
								}
								var cn = 'NOT FOUND'
								if(company.profile)
									cn = company.profile.name;
								var row = [cn];
								for(var lmi=0; lmi<list.material.length; lmi++){
									var mTons = 0;
									for(var cti=0; cti<company.tickets.length; cti++){
										if(company.tickets[cti].material == list.material[lmi])
											mTons+=company.tickets[cti].summary.tons;
									}
									row.push(mTons)
								}
								table.push(row)
							}

						var data = google.visualization.arrayToDataTable(table);
						var options = {
							title: 'Distribution By Trucking Co.',
							vAxis: {
								title: "Tons"
							},
							hAxis: {
								title: "Materials"
							},
							seriesType: "bars",
							series: {
								5: {
									type: "line"
								}
							}
						};
						
						var chart = new google.visualization.ComboChart(document.getElementById('ticketChart'));
							chart.draw(data, options);
					});
				}
			},
			contractChart: function(type){
				Contracts.tools.list().then(function(contracts){
					for(var i=0; i<contracts.length; i++)
						for(var ii=0; ii<contracts[i].materials.length; ii++)
							options[type](contracts[i], contracts[i].materials[ii])
				})
				$scope.contractCharts = true;
				var options = {
					guage: function(contract, material){
						var conversion = 100/material.quantity;
						var table = [['Label', 'Value']]
							table.push([Materials.tools.liveId(material.ref).name, Math.round(material.delivered*conversion)])
						 var data = google.visualization.arrayToDataTable(table);
						 var options = {
						 	width: 400,
						 	height: 120,
						 	redFrom: material.quantity*conversion-10*conversion,
						 	redTo: 100,
						 	yellowFrom: material.quantity*conversion-30*conversion,
						 	yellowTo: material.quantity*conversion-10*conversion,
						 	minorTicks: 5
						 };
						 $timeout(function(){
						 	var element = document.getElementById(contract.objectId+'-'+material.ref);
						 		console.log(element)
							 var chart = new google.visualization.Gauge(element);
							 chart.draw(data, options);
						 }, 1000)
					},
					pie: function(contract, material){
						var conversion = 100/material.quantity;
						var table = [['Label', 'Value']]
							table.push(['Available', Math.round(material.remaining)])
							table.push(['Distributed', Math.round(material.delivered)])
						var data = google.visualization.arrayToDataTable(table);
						var options = {
							title: Materials.tools.liveId(material.ref).name,
							pieHole: 0.4,
						};
						$timeout(function(){
							var element = document.getElementById(contract.objectId+'-'+material.ref);
								console.log(element)
							var chart = new google.visualization.PieChart(element);
							chart.draw(data, options);
						}, 1000)
					}
				}
			},
			updateMaterial: function(){
				Materials.tools.broadcast();
			}
		},
		history: {
			contractMaterial: function(ticket){
				var contract = Contracts.tools.liveId(ticket.contract);
				for(var i=0; i<contract.materials.length; i++){
					if(contract.materials[i].ref == ticket.material){
						var m = {
							price: 		contract.materials[i].price,
							haulPrice: 	contract.materials[i].haulPrice
						}
						if(!m.price)
							m.price = 		0
						if(!m.haulPrice)
							m.haulPrice = 	0
							
							m.totalPrice = 	m.price + m.haulPrice
						ticket.m = m
					}
				}
			}
		},
		ticket: {
			init: function(){
				$scope.ticket = {
					vehicle: {},
					summary: {
						postDate: 		new moment(),
						driverOnScale: true
					}
				};
				$scope.temp.retare 		= false;
				$scope.ticketCompanies 	= [];
				$scope.ticketContracts 	= [];
				$scope.ticketMaterials 	= [];
				tools.ticket.listVehicles();
				$scope.ticketCache = null;
				try{
					$scope.ticketCache = angular.fromJson(localStorage.getItem('ticketCache'));
					if(!$scope.ticketCache)
						$scope.ticketCache = [];
				}catch(error){
					$scope.ticketCache = [];
				}
			},
			localSave: function(ticket){
				angular.copy(ticket);
				var localTickets = null;
				try{
					localTickets = angular.fromJson(localStorage.getItem('localScaleTickets'));
					if(!localTickets)
						localTickets = [];
				}catch(error){
					localTickets = [];
				}

				localTickets.push(ticket);
				localTickets = JSON.stringify(localTickets);
				localStorage.setItem('localScaleTickets', localTickets)
			},
			localSync: function(){
				var localTickets = 	localStorage.getItem('localScaleTickets');
				if(!localTickets)
					localTickets = [];
				else
					localTickets = angular.fromJson(localTickets);
					var payload = {
						localTickets: localTickets
					}
				
				$http.post('https://api.parse.com/1/classes/ScaleLocalSync', payload).success(function(){
					tools.init().then(function(){
						alert('Sync Report Completed Successfully!');
						tools.ticket.localClear();
					})
				})
			},
			localClear: function(){
				localStorage.removeItem('localScaleTickets');
				localStorage.removeItem('lastScaleTicket');
			},
			cacheUp: function(){
				var promises = [];
				
				var cache = $scope.ticketCache;
				$scope.ticketSync = [];
				for(var i=0; i<cache.length; i++){
					promises.push((function(ticket){
						var deferred = $q.defer();
						Tickets.tools.save(ticket).then(function(result){
							var i = cache.indexOf(ticket);
							$scope.ticketSync.push(result);
							cache.splice(i, 1);
							deferred.resolve({status:'success', ticket:result});
						}, function(e){
							var i = cache.indexOf(ticket);
							try{
								var error = angular.fromJson(e.error);
								if(error.code=='409'){
									$scope.ticketSync.push(ticket);
									cache.splice(i, 1);
									deferred.resolve({status:'success', ticket:ticket});
								}else
									deferred.resolve({status:'error', ticket:ticket});
							}catch(e){
								deferred.resolve({status:'error', ticket:ticket});
							}
						});
						return deferred.promise;
					})(cache[i]))
				}
				$q.all(promises).then(function(results){
					localStorage.setItem('ticketCache', angular.toJson(cache));
					Contracts.tools.broadcast();
				});
			},
			save: function(ticket){
				//Do a bunch of formating
				ticket.reference = Math.floor((Math.abs(Math.sin(moment().format('x')) * 2000000000000)) % 2000000000000).toString(36);
				Contracts.tools.byId($scope.ticket.contract.objectId).then(function(contract){
					ticket.contract = contract;
					if(!ticket.contract.ticketsIssued)
						ticket.contract.ticketsIssued = 0;
					ticket.number = ++ticket.contract.ticketsIssued
					ticket.sequence = ticket.contract.number+'.'+ticket.number;

					var receipt = $scope.receipt = angular.copy(ticket);
					angular.extend(ticket.summary, {
						number: 		receipt.number,
						sequence: 		receipt.sequence,
						vehicle: 		receipt.vehicle.vId,
						driver: 		receipt.vehicle.driver,
						material: 		receipt.material.name,
						company: 		receipt.contract.company,
						contract: 		receipt.contract.name,
						contractNum: 	ticket.contract.number
					})
					ticket.contract = ticket.contract.objectId;
					if(ticket.company)
						ticket.company = ticket.company.objectId;
					ticket.material = ticket.material.objectId;
					ticket.vehicle 	= ticket.vehicle.objectId;
					tools.ticket.localSave(ticket);
					
					
					//Save to the cache and then combine on complete
					$scope.ticketCache.push(ticket);
					localStorage.setItem('ticketCache', angular.toJson($scope.ticketCache));
				});
			},
			automate: function(vehicleId){
				Tickets.byVehicle(vehicleId).then(function(tickets){
					var ticket = tickets[0];
					if(ticket){
						Companies.tools.byId(ticket.company).then(function(company){
							$scope.ticket.company = company;
							tools.ticket.listContracts(ticket.company);
						})
						Contracts.tools.byId(ticket.contract).then(function(contract){
							$scope.ticket.contract = contract;
							tools.ticket.listMaterials(ticket.contract).then(function(materialList){
								for(var i=0; i<materialList.length; i++){
									if(materialList[i].objectId == ticket.material){
										$scope.ticket.material = materialList[i];
									}
								}
							})
						})
					}
				})
			},
			setVehicle: function(vehicle){
				tools.ticket.init();
				$scope.ticket.vehicle = vehicle;
				tools.ticket.automate(vehicle.objectId);
			},
			change: function(func, id){
				tools.ticket[func](id).then(function(result){
					tools.ticket.total();
				})
			},
			addVehicle: function(vehicle){
				tools.vehicle.tare(vehicle).then(function(response){
					$rootScope.tools.alert.add('success', 'Vehicle Created.', 5);
					$scope.ticket.vehicle = angular.extend(response, vehicle)
				}).catch(function(error){
					$rootScope.tools.alert.add('error', error, 10);
				})
			},
			listVehicles: function(){
				Vehicles.tools.list().then(function(vehicles){
					var promises = [];
					var vehicles = angular.copy(vehicles);
					for(var i=0; i<vehicles.length; i++)
						promises.push(tools.vehicle.haulData(vehicles[i]))
					
					$q.all(promises).then(function(){
						if(!$scope.ticket || $scope.ticket.vehicle.vId == 'all')
							vehicles;
						else if($scope.ticket.vehicle.vId)
							vehicles = vehicles.filter(function(vehicle){
								return vehicle.vId.toLowerCase().indexOf($scope.ticket.vehicle.vId.toLowerCase()) != -1;
							})
						else
							vehicles = vehicles.filter(function(vehicle){
								if(!vehicle.haul.next)
									return true;
								return vehicle.haul.next > -120;
							})
						$scope.ticketVehicles = vehicles;
					})
				})
			},
			listContracts: function(companyId){
				//Use company to query and list associated contracts.
				var deferred = $q.defer();
				$scope.ticketContracts = [];
				$scope.ticketMaterials = [];
				$scope.ticket.material = null;
				
				Contracts.tools.list().then(function(contracts){
					for(var i=0; i<contracts.length; i++)
						if(contracts[i].companyId == companyId)
							$scope.ticketContracts.push(contracts[i]);
					deferred.resolve($scope.ticketContracts);
				})
				return deferred.promise;
			},
			listMaterials: function(contractId){
				//Use contract to list all available materials.
				var deferred = $q.defer();
				$scope.ticketMaterials=[];
				Contracts.tools.byId(contractId).then(function(contract){
					var materials = [];
					for(var i=0; i<contract.materials.length; i++)
						materials.push((function(cm){
							var deferred = $q.defer();
							Materials.tools.byId(contract.materials[i].ref).then(function(material){
								material.contract = cm;
								$scope.ticketMaterials.push(material);
								deferred.resolve(material);
							})
							return deferred.promise;
						})(contract.materials[i]))
						$q.all(materials).then(function(materialList){
							deferred.resolve(materialList);
						})
				})
				return deferred.promise;
			},
			total: function(){
				if($scope.ticket.material){
					var tare 	= $scope.ticket.vehicle.tare;
					var gross 	= $scope.ticket.weight;
					var net 	= gross - tare;
					var tons 	= Math.round(net/20)/100;
					var price 	= Math.round(ttlTon*tons * 100)/100;
					var ttlTon 	= $scope.ticket.material.contract.price|0 + $scope.ticket.material.contract.haulPrice|0;
					
					delete $scope.ticket.summary.error;
					angular.extend($scope.ticket.summary, {
						gross: 			gross,
						tare: 			tare,
						net: 			net,
						tons: 			tons,
						pricePerTon:	$scope.ticket.material.contract.price,
						haulPerTon:		$scope.ticket.material.contract.haulPrice,
						totalPerTon:	ttlTon,
						contractTotal: 	Math.round((ttlTon * tons) * 100)/100,
						scaleDeputy: 	$scope.user.profile.displayName,
						signature: 		$scope.user.profile.signature.src,
						price: 			price
					})
					
					if(tons <= 0)
						$scope.ticket.summary.error = 'The tare weight is: '+$scope.ticket.vehicle.tare+'. (Which is greator than or equal to the current weight entered).';
					else if(tons > 50)
						$scope.ticket.summary.error = 'Wowa!  '+tons+' tons seems a little high.';
					else if(net < 15000)
						$scope.ticket.summary.warning = 'The load seems light, double check the numbers.';
					else if($scope.ticket.weight > 84000)
						$scope.ticket.summary.warning = 'This vehicle may be over weight.';
				}else{
					$scope.ticket.summary.error = 'No material selected.';
				}
			},
			clear: function(){
				$scope.ticket = {};
			}
		},
		receipt: {
			init: function(){
				if(!$scope.receipt){
					tools.init().then(function(data){
						Tickets.tools.byId($routeParams.id).then(function(ticket){
							$scope.receipt = angular.copy(ticket);
							Companies.tools.byId(ticket.company).then(function(company){
								$scope.receipt.company = company
							})
							Contracts.tools.byId(ticket.contract).then(function(contract){
								$scope.receipt.contract = contract
							})
							Materials.tools.byId(ticket.material).then(function(material){
								$scope.receipt.material = material
							})
							Vehicles.tools.byId(ticket.vehicle).then(function(vehicle){
								$scope.receipt.vehicle = vehicle
							})
							$scope.receipt.summary.postDate = new moment($scope.receipt.summary.postDate)
						})
					})
				}
			},
			clear: function(){
				$scope.receipt = null;
			}
		},
		company: {
			init: function(){
				
			},
			create: function(){
				$scope.company = {
					vehicles: []
				}
			},
			set: function(company){
				company = angular.copy(company);
				$scope.company = company;
				if(company.vehicles)
					Vehicles.tools.byIds(company.vehicles).then(function(vehicles){
						company.vehicles = vehicles;
					})
			},
			save: function(company){
				var validVehicles = true;
				for(var i=0; i<company.vehicles.length; i++)
					if(!company.vehicles[i].objectId)
						validVehicles = false;
					
				
				if(!validVehicles)
					alert('Some vehicles were not found, you need to create these vehicles before continuing.')
				else{
					for(var i=0; i<company.vehicles.length; i++)
						company.vehicles[i] = company.vehicles[i].objectId;
						
					Companies.tools.save(company).then(function(response){
						//Re-list everything.
						// tools.init();
						$scope.company = null;
					}).catch(function(error){
						console.error('company save error', error)
					})
				}
			},
			remove: function(company){
				Companies.tools.delete(company).then(function(){
					//
				})
			},
			blurVehicle: function(vehicle){
				var i = $scope.company.vehicles.indexOf(vehicle)
				$timeout(function(){
					var v = $scope.company.vehicles[i]
					if(v && v.vId && !v.objectId){
						if(confirm('The vehicle: '+v.vId+' could not be found, would you like to create it now?')){
							if(confirm('Would you like to enter a tare weight now?')){
								v.tare 		= Number(prompt('Current Tare Weight:'))
								v.tareDate 	= new Date();
								Vehicles.tools.save(v);
							}else{
								Vehicles.tools.save(v);
							}
						}
					}
				}, 1000)
			},
			addVehicle: function(){
				$scope.company.vehicles.push({});
			},
			removeVehicle: function(vehicle){
				var i = $scope.company.vehicles.indexOf(vehicle)
				$scope.company.vehicles.splice(i, 1)
			},
			setVehicle: function(vehicle, v){
				var i = $scope.company.vehicles.indexOf(vehicle)
				$scope.company.vehicles.splice(i, 1, v)
			},
			byVehicle: function(vehicleId){
				var deferred = $q.defer();
				Companies.tools.list().then(function(companies){
					for(var c=0; c<companies.length; c++)
						for(var l=0; l<companies[c].vIds.length; l++)
							if(companies[c].vIds[l] = vId)
								deferred.resolve(companies[c]);
				})
				return deferred.promise;
			}
		},
		contract: {
			init: function(){
				tools.init().then(function(data){
					if($routeParams.id)
						for(var i=0; i<$scope.contracts.length; i++)
							if($scope.contracts[i].objectId == $routeParams.id)
								tools.contract.set($scope.contracts[i])
				})
			},
			create: function(){
				$scope.contract = {
					materials: [{}]
				}
			},
			set: function(contract){
				contract = angular.copy(contract);
				contract.serverSave = false;
				function setSub(materials, ref, i){
					Materials.tools.byId(ref).then(function(sub){
						materials[i].ref = sub;
					})
				}
				for(var i=0; i<contract.materials.length; i++)
					setSub(contract.materials, contract.materials[i].ref, i);
				$scope.contract = contract;
			},
			save: function(contract){
				for(var i=0; i<contract.materials.length; i++)
					if(contract.materials[i].ref)
						contract.materials[i].ref = contract.materials[i].ref.objectId;
				
				Contracts.tools.save(contract).then(function(response){
					$scope.contract = null;
					tools.init();
				}).catch(function(error){
					console.error('contract save error', error)
				})
			},
			remove: Contracts.tools.delete,
			setCompany: function(companyId){
				Companies.tools.byId(companyId).then(function(company){
					angular.extend($scope.contract, {
						phone: 		company.phone,
						email: 		company.email,
						address: 	company.address
					})
				})
			},
			addMaterial: function(){
				$scope.contract.materials.push({});
			},
			removeMaterial: function(material){
				if(!material.delivered){
					var materials = $scope.contract.materials;
					materials.splice(materials.indexOf(material), 1);
				}
			},
			byCompany: function(companyId){
				var deferred = $q.defer();
				Contracts.tools.list().then(function(contracts){
					var companyContracts = [];
					for(var i=0; i<contracts.length; i++)
						if(contracts[i].companyId == companyId)
							companyContracts.push(contracts[i]);
					deferred.resolve(companyContracts)
				})
				return deferred.promise;
			},
			calculate: function(material){
				if(!material.price)
					material.price = material.ref.price;
			}
		},
		material: {
			init: function(){
				
			},
			new: function(){
				return {
					mix: 			[],
					produced: 		0,
					distributed: 	0,
					promised: 		0,
					available: 		0
				}
			},
			create: function(){
				$scope.material = tools.material.new();
			},
			set: function(material){
				material = angular.extend(tools.material.new(), material);
				//We set all mix refrences to the actual object once so we don't have to do this multiple times in calculating...
				//This could have been eliminated and then the mix select could refrence objectId... but then this logic would have to be added to calculate.
				function setSub(material, ref, i){
					Materials.tools.byId(ref).then(function(sub){
						material.mix[i].ref = sub;
					})
					material.mix[i]
				}
				for(var i=0; i<material.mix.length; i++)
					setSub(material, material.mix[i].ref, i);
				
				$scope.material = material;
			},
			save: function(material){
				material.available = material.produced - material.distributed - material.promised;
				for(var i=0; i<material.mix.length; i++)
					material.mix[i].ref = material.mix[i].ref.objectId;
				Materials.tools.save(material).then(function(response){
					console.log('material saved', response);
					$scope.material = false;
				}).catch(function(error){
					console.error('material save error', error)
				})
			},
			remove: Materials.tools.delete,
			addMix: function(){
				$scope.material.mix.push({});
			},
			calculate: function(material){
				var qty = material.mix.length;
				if(qty>0){
					var royalties = 0;
					var price = 0;
					var tons = 0;
					for(var i=0; i<qty; i++){
						royalties += material.mix[i].ref.royalties * material.mix[i].percent/100;
						price += material.mix[i].ref.price * material.mix[i].percent/100;
					}
					if(!material.royalties)
						material.royalties = Math.round(royalties*100)/100;
					if(!material.price)
						material.price = price;
				}
			},
			setPic: function(data){
				var material = data.parent;
				if(!material.img)
					material.img = {};
				
				$timeout(function(){ 
					material.img = {
						temp: true,
						status: 'uploading',
						class: 'gray',
						title: 'Image Uploading...',
						src: data.src
					}
				});
	
				FileService.upload(data.attr,data.src).then(function(data){
					material.img = {
						title: data.name(),
						src: data.url()
					}
				});
			}
		},
		vehicle: {
			init: function(){
				$scope.vehicle = {};
			},
			create: function(vId){
				$scope.vehicle = {
					vId: vId,
					tareDate: new Date()
				};
			},
			set: function(vehicle){
				$scope.vehicle = vehicle;
			},
			tare: function(vehicle){
				$scope.temp.retare = false;
				vehicle.tareDate = new Date();
				return tools.vehicle.save(vehicle);
			},
			delete: function(vehicle){
				Vehicles.tools.delete(vehicle);
			},
			save: function(vehicle){
				var deferred = $q.defer();
				Vehicles.tools.by('vId', vehicle.vId).then(function(list){
					if(vehicle.vId)
						if(vehicle.objectId)
							Vehicles.tools.save(vehicle).then(function(response){
								deferred.resolve(response);
							})
						else if(list.length > 0){
							deferred.reject('This vehicle already exists');
						}else
							Vehicles.tools.save(vehicle).then(function(response){
								deferred.resolve(response);
							})
					else
						deferred.reject('You must enter a vehicle ID before saving.');
				})
				return deferred.promise;
			},
			retare: function(){
				$scope.temp.retare = true;
			},
			needsTare: function(vehicle){
				if(!vehicle)
					return false
				if(!vehicle.tareDate)
					return true;
				if($scope.temp.retare)
					return true;
				
				var now = new moment();
				var tare = new moment(vehicle.tareDate);
				var duration = moment.duration(now.diff(tare));
				var days = duration.asDays();
				return Math.round(days) > 0;
			},
			haulData: function(vehicle){
				console.log('hauldata')
				var deferred = $q.defer();
				Tickets.byVehicle(vehicle.objectId).then(function(tickets){
					var haul = {};
					if(tickets.length > 0)
						haul.last = moment(tickets[0].createdAt);
						
					var diffArr = [];
					if(tickets.length > 1){
						for(var i=tickets.length-1; i>0; i--){
							var diffMinutes = moment(tickets[i-1].createdAt).diff(tickets[i].createdAt, 'minutes');
							if(diffMinutes<60*12)
								diffArr.push(diffMinutes);
						}
						// console.log(vehicle, tickets, diffArr)
						haul.durations 	= diffArr;
						haul.average 	= moment.duration(diffArr.average(), 'minutes');
						haul.duration 	= moment.duration(diffArr[diffArr.length-1], 'minutes');
						haul.next 		= Math.round(haul.duration.asMinutes() - moment.duration(moment().diff(haul.last)).asMinutes());
					}
					vehicle.haul 		= haul;
					deferred.resolve(haul);
				});
				return deferred.promise;
			},
			clear: function(){
				$scope.vehicle = {};
			},
		},
		crusher: {
			init: function(){
				
			},
			url: function(crushAction){
				if(crushAction)
					$scope.crushAction = crushAction;
				if($scope.crushAction)
					return '/modules/scalehouse/logs/'+$scope.crushAction+'.html'
			}
		},
		pushN: {
			init: function(){
				$scope.pushNotifications = {
					available: false,
					enabled: false,
					status: 'Waiting...'
				};
				navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
					console.log('service worker ready')
					it.s = serviceWorkerRegistration
					serviceWorkerRegistration.pushManager.subscribe()
						.then(function(subscription) {
							// The subscription was successful  
							$scope.pushNotifications = {
								available: true,
								enabled: true,
								status: 'Push notifications enabled.'
							};
							it.s = subscription
							// TODO: Send the subscription.subscriptionId and   
							// subscription.endpoint to your server  
							// and save it to send a push message at a later date   
							// return sendSubscriptionToServer(subscription);
						})
						.catch(function(e) {
							if (Notification.permission === 'denied') {
								$scope.pushNotifications = {
									available: false,
									enabled: false,
									status: 'Push notification permission denied.'
								};
							}
							else {
								// A problem occurred with the subscription; common reasons  
								// include network errors, and lacking gcm_sender_id and/or  
								// gcm_user_visible_only in the manifest.  
								$scope.pushNotifications = {
									available: true,
									enabled: false,
									status: 'Push notifications disabled.'
								};
							}
						});
				});
			}
		}
	}

	if(!it.vehicleTimer)
		it.vehicleTimer = $interval(tools.ticket.listVehicles, 60000);

	tools.init();
	it.ScaleCtrl = $scope;
});