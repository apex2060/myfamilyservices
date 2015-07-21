app.lazy.controller('EquipmentCtrl', function($rootScope, $scope, $routeParams, $q, $timeout, config, Data, Auth){
	$scope.temp = {};
	$scope.rp = $routeParams;
	// var EasyElement = new Easy.elements();
	
	var Categories = Data('EquipCategories');
	var Equipment = Data('Equipment');
	
	$scope.$on(Categories.listener, function(e, categories) {
		tools.category.init(categories);
	});
	$scope.$on(Equipment.listener, function(e, equipment) {
		$scope.equipment = equipment;
	});
	
	
	var tools = $scope.tools = {
		url: function(){
			var view = $routeParams.view
			if(!view)
				view = 'default'
			return 'modules/equipment/'+view+'.html';	
		},
		init: function(){
			var deferred = $q.defer();
			Auth.init().then(function(){
				$q.all([Categories.tools.list(), Equipment.tools.list()]).then(function(data){
					$scope.equipment = data[1];
					tools.category.init(data[0]);
					deferred.resolve(data);
				})
			}).catch(function(e){
				alert(e)
			})
			return deferred.promise;
		},
		category: {
			init: function(categories){
				$scope.categories = categories;
				for (var i = 0; i < categories.length; i++) {
					categories[i].equipment = [];
					categories[i].equipment = tools.equipment.byCategory(categories[i]);
				}
			},
			add: function(category){
				var category = {
					name: category
				}
				Categories.tools.save(category).then(function(resp){
					console.log(resp)
				})
			},
			focus: function(category){
				$scope.category = angular.copy(category);
				Equipment.tools.list().then(function(){
					$scope.category.equipment = tools.equipment.byCategory(category);
				})
			}
		},
		equipment: {
			init: function(){
				var equipId = $routeParams.id;
				Equipment.tools.byId(equipId).then(function(equip){
					$scope.equip = angular.copy(equip);
				})
			},
			add: function(){
				if(!$scope.category)
					return;
					
				var item = {
					vId: $scope.temp.vId,
					category: Categories.tools.ref($scope.category)
				}
				Equipment.tools.save(item).then(function(resp){
					console.log(resp);
					$scope.temp.vId = null;
					$timeout(function(){
						$scope.tools.category.focus($scope.category)
					}, 1000)
				})
			},
			addEvent: function(type){
				if(!$scope.equip.history)
					$scope.equip.history = [];
				$scope.equip.history.push({
					type: type,
					date: new Date(),
					edit: true
				})
			},
			removeEvent: function(event){
				console.log(event)
				if(confirm('Are you sure you want to remove this event from the equipment history?')){
					var i = $scope.equip.history.indexOf(event)
						$scope.equip.history.splice(i, 1);
				}
			},
			save: function(equipment){
				Equipment.tools.save(equipment).then(function(){
					alert('Equipment Saved!')
				})
			},
			byCategory: function(categoryId){
				if(!categoryId)
					return
				if(typeof(categoryId) != 'string')
					categoryId = categoryId.objectId;
					
				var equipment = Equipment.list;
				var list = [];
				for(var i=0; i<equipment.length; i++)
					if(equipment[i].category && equipment[i].category.objectId == categoryId)
						list.push(equipment[i])
				return list;
			}
		}
	}
	
	tools.init();
	it.EquipmentCtrl = $scope;
});