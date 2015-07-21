app.factory('config', function ($http, $q) {
	var config = {
		domain:			'dignpave.com',
		tempUrl: 		'https://main-jhcc-admin.c9.io',
		secureUrl: 		'https://secure.jhcc.info',
		devUrl: 		'https://main-jhcc-admin.c9.io',
		parse: {
			root: 		'https://api.parse.com/1',
			appId: 		'pzlNsaEz6hNmIntH42OOwiFfDBNZAB1YNL1oj3fV',
			clientKey: 	'raoVn5WYl8kCpESadsvT8n90N1ku35REJ91b5c2x',
			jsKey: 		'AQVLXlKYohvDPF4FJVyAPXpaUbh3YT2MwhRwYBaI',
			netKey: 	'VRlbE0t7hxyLZvG2xSUT8X3D9Fnf5wMe1KuOXk2f',
			restKey: 	'ty6cmbnYjF72IIzQXzlgB548vuCh8NOdCVUJVGmz'
		},
		firebase: 'https://jhcc-main.firebaseio.com/',
		google: {
			auth_uri: "https://accounts.google.com/o/oauth2/auth",
			client_secret: "JkoAr146jvywyeurbVLU2XtH",
			token_uri: "https://accounts.google.com/o/oauth2/token",
			client_email: "693915073881-8lq8g0q78rhabgmmhf86prf34gcaeeff@developer.gserviceaccount.com",
			redirect_uris: ["https://safety-jhcc-admin.c9.io/oauth2callback"],
			client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/693915073881-8lq8g0q78rhabgmmhf86prf34gcaeeff@developer.gserviceaccount.com",
			client_id: "693915073881-8lq8g0q78rhabgmmhf86prf34gcaeeff.apps.googleusercontent.com",
			auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
			javascript_origins: ["https://safety-jhcc-admin.c9.io"]
		},
		weather: {
			url: 	'http://api.openweathermap.org/data/2.5/weather', //?q=cityName
			apiKey: '0e9d9bb347f90f73048aa7ae74c8ed44',
		},
		dash: {
			// client_id: 	'YjEzNGNlNWUtZmFkYy00NDk2LWE3NWEtZGI4NjYzOTE4NTJj'
			client_id: 		'ZWYwZmE5YjgtYzg0My00YmE2LThmNDctYzBiNTU1ODE0OTA1'
		},
		kimono: {
			api_key: 		'dGHEKwCxK00Q4ybXVx8i4tx1cDdj2pto'
		},
		company: {
			name: 		'James Hamilton Construction Co.',
			address1: 	'PO Box 1287',
			address2: 	'Silver City, NM 88062',
			phone: 		'575-388-1546'
		}
	}
	
	Parse.initialize(config.parse.appId, config.parse.jsKey);
	$http.defaults.headers.common['X-Parse-Application-Id'] = config.parse.appId;
	$http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parse.restKey;
	$http.defaults.headers.common['Content-Type'] = 'application/json';
	
	return config;
});