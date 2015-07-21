// console.log("SW startup");

self.addEventListener('install', function(event) {
	// console.log("SW installed");
});

self.addEventListener('activate', function(event) {
	// console.log("SW activated");
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.open('v2').then(function(cache) {
			return cache.match(event.request).then(function(response) {
				return response || fetch(event.request).then(function(response) {
					cache.put(event.request, response.clone());
					return response;
				});
			});
		})
	);
});

// self.addEventListener('fetch', function(event) {
// 	event.respondWith(
// 		caches.match(event.request)
// 		.then(function(response) {
// 			if (response) {
// 				return response;
// 			}
// 			var fetchRequest = event.request.clone();
// 			return fetch(fetchRequest).then(
// 				function(response) {
// 					if (!response || response.status !== 200 || response.type !== 'basic') {
// 						return response;
// 					}
// 					var responseToCache = response.clone();
// 					caches.open('v2')
// 						.then(function(cache) {
// 							cache.put(event.request, responseToCache);
// 						});
// 					return response;
// 				}
// 			);
// 		})
// 	);
// });


self.addEventListener('push', function(event) {
	console.log('Received a push message', event);

	var title = 'Yay a message.';
	var body = 'We have received a push message.';
	var icon = '/images/icon-192x192.png';
	var tag = 'simple-push-demo-notification-tag';

	event.waitUntil(
		self.registration.showNotification(title, {
			body: body,
			icon: icon,
			tag: tag
		})
	);
});