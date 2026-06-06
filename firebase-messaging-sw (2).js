importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDummyKeyForServiceWorker",
  authDomain: "qoraner-varb-200-3367a.firebaseapp.com",
  projectId: "qoraner-varb-200-3367a",
  storageBucket: "qoraner-varb-200-3367a.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Background message received:', payload);
  const notificationTitle = payload.notification.title || 'RGB শিক্ষা';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: payload.data
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
