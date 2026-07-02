// Service Worker para notificaciones push en segundo plano (Firebase Cloud Messaging)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDi6V39CMqYSJJili7OdXJNgaX1-3tKk90",
  authDomain: "comercia-app-b1e9a.firebaseapp.com",
  projectId: "comercia-app-b1e9a",
  storageBucket: "comercia-app-b1e9a.firebasestorage.app",
  messagingSenderId: "619317924513",
  appId: "1:619317924513:web:8939e2c20f952e4738d6e0"
});

const messaging = firebase.messaging();

// Cuando llega una push y la app está cerrada / en segundo plano
messaging.onBackgroundMessage(function(payload) {
  const titulo = (payload.notification && payload.notification.title) || 'Comercia';
  const opciones = {
    body: (payload.notification && payload.notification.body) || 'Tenés una nueva consulta',
    icon: '/comercia/icon-192.png',
    badge: '/comercia/icon-192.png',
    tag: 'comercia-consulta',
    data: payload.data || {}
  };
  self.registration.showNotification(titulo, opciones);
});

// Al tocar la notificación, abrir/enfocar la app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(lista) {
      for (let i = 0; i < lista.length; i++) {
        if (lista[i].url.indexOf('comercia') >= 0 && 'focus' in lista[i]) return lista[i].focus();
      }
      if (clients.openWindow) return clients.openWindow('/comercia/');
    })
  );
});
