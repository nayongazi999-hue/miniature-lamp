var CACHE_NAME = 'rgb-shikkha-v2';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

// Push Notification handler
self.addEventListener('push', function(e) {
  var data = {};
  if(e.data) {
    try { data = e.data.json(); } catch(err) { data = { title: 'RGB শিক্ষা', body: e.data.text() }; }
  }
  var options = {
    body: data.body || 'নতুন বার্তা আছে!',
    icon: 'https://via.placeholder.com/192x192/00ffff/000000?text=RGB',
    badge: 'https://via.placeholder.com/72x72/00ffff/000000?text=R',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'খুলুন' },
      { action: 'close', title: 'বন্ধ করুন' }
    ]
  };
  e.waitUntil(self.registration.showNotification(data.title || 'RGB শিক্ষা', options));
});

// Notification click handler
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  if(e.action === 'open' || !e.action) {
    e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
  }
});
