// ============================================================
// RGB শিক্ষা — Firebase Cloud Messaging Service Worker
// এই ফাইলটি GitHub repo এর ROOT এ রাখতে হবে
// ফাইলের নাম: firebase-messaging-sw.js
// ============================================================

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyB6Ff_tfdoy3SX7-KRMurDBDsC8AzcTRK4",
  authDomain: "qoraner-varb-200-3367a.firebaseapp.com",
  projectId: "qoraner-varb-200-3367a",
  storageBucket: "qoraner-varb-200-3367a.firebasestorage.app",
  messagingSenderId: "26016266391",
  appId: "1:26016266391:web:39c2c833060a83047551d2"
});

const messaging = firebase.messaging();

// অ্যাপ বন্ধ থাকলেও এই ফাংশন Background এ কাজ করবে
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message:', payload);

  var title = (payload.notification && payload.notification.title) || 'RGB শিক্ষা 📚';
  var body  = (payload.notification && payload.notification.body)  || 'নতুন আপডেট আছে!';

  return self.registration.showNotification(title, {
    body: body,
    icon: 'https://via.placeholder.com/192x192/00ffff/000000?text=RGB',
    badge: 'https://via.placeholder.com/72x72/00ffff/000000?text=R',
    vibrate: [200, 100, 200],
    tag: 'rgb-notif',
    data: { url: 'https://nayongazi999-hue.github.io/miniature-lamp/index.html' }
  });
});

// নোটিফিকেশনে ক্লিক করলে সাইট খুলবে
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url)
    || 'https://nayongazi999-hue.github.io/miniature-lamp/index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus();
      }
      return clients.openWindow(url);
    })
  );
});
