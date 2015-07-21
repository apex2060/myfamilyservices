// console.log("SW startup");
var cacheVersion = 'v11';

self.addEventListener('install', function(event) {
	console.log("SW installed");
});

this.addEventListener('activate', function(event) {
	var cacheWhitelist = [cacheVersion];
	event.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				var i = cacheWhitelist.indexOf(key)
				if(i === -1) {
					return caches.delete(keyList[i]);
				}
			}));
		})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.open(cacheVersion).then(function(cache) {
			return cache.match(event.request).then(function(response) {
				return response || fetch(event.request).then(function(response) {
					cache.put(event.request, response.clone());
					return response;
				});
			});
		})
	);
});