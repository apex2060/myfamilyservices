app.factory('config', function ($http, $q) {
	var config = {
		domain:			'myfamily.services',
		tempUrl: 		'https://myfamilyservices.parseapp.com',
		secureUrl: 		'https://myfamilyservices.parseapp.com',
		devUrl: 		'https://myfamilyservices.parseapp.com',
		parse: {
			root: 		'https://api.parse.com/1',
			appId: 		'vxsoFHjXk7YzoTEB4gKH44SzmlLpWNtyyWFUy2vw',
			jsKey: 		'Z6VFkCC3xQaJvk13w23Iig6fS1BT8Qhtq9582hJX',
			restKey: 	'NmyKb44TnpMCsFnlB7tI6xaw0fGsJrjmhKUxvbmN'
		},
		firebase: 'https://myfamilyservices.firebaseio.com/',
		google: {
			"client_id": "1013030056445-q1d8qrnm4ilspgj71u7cg841g2i0b7fh.apps.googleusercontent.com",
			"auth_uri": "https://accounts.google.com/o/oauth2/auth",
			"token_uri": "https://accounts.google.com/o/oauth2/token",
			"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
			"client_secret": "PgFDvgo1vsmrCXK_yjHsT0YA",
			"redirect_uris": ["https://myfamilyservices-apex2060.c9.io", "http://myfamily.services", "https://familyservices.parseapp.com"],
			"javascript_origins": ["https://myfamilyservices-apex2060.c9.io", "http://myfamily.services", "https://familyservices.parseapp.com"]
		}
	}
	
	Parse.initialize(config.parse.appId, config.parse.jsKey);
	$http.defaults.headers.common['X-Parse-Application-Id'] = config.parse.appId;
	$http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parse.restKey;
	$http.defaults.headers.common['Content-Type'] = 'application/json';
	
	return config;
});