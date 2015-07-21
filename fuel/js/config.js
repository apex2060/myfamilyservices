app.factory('config', function ($http, $q) {
	var config = {
		secureUrl: 		'https://secure.jhcc.info/fuel',
		parse: {
			root: 		'https://api.parse.com/1',
			appId: 		'pzlNsaEz6hNmIntH42OOwiFfDBNZAB1YNL1oj3fV',
			restKey: 	'ty6cmbnYjF72IIzQXzlgB548vuCh8NOdCVUJVGmz',
		},
		company: {
			name: 		'James Hamilton Construction Co.',
			logo: 		'JHCC',
			address1: 	'PO Box 1287',
			address2: 	'Silver City, NM 88062',
			phone: 		'575-388-1546'
		},
		settings: {
			equipmentPrefix: 'JH'
		}
	}
	
	$http.defaults.headers.common['X-Parse-Application-Id'] = config.parse.appId;
	$http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parse.restKey;
	$http.defaults.headers.common['Content-Type'] = 'application/json';
	
	return config;
});