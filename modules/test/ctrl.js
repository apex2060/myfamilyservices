app.lazy.controller('TestCtrl', function($rootScope, $scope, Dados){
    var testData = new Dados.connection('TestClass')
    
    testData.tools.item.list().then(function(l){
        $scope.list = l;
        it.l = l;
    })
    
	it.dado = Dados
	it.TestCtrl = $scope;
});