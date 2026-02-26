importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// IMPORTANT: these values must be hardcoded here normally, or injected via build process
// because Service Workers don't have access to import.meta.env
// For this project, we hardcode the config you provided.
const firebaseConfig = {
    apiKey: "AIzaSyDHh4eiQh-5eZAdmCEBFKyXqQgaDntx-xY",
    authDomain: "crm-perso-350db.firebaseapp.com",
    projectId: "crm-perso-350db",
    storageBucket: "crm-perso-350db.firebasestorage.app",
    messagingSenderId: "594640965083",
    appId: "1:594640965083:web:a8a0b50c02443b2b31abfe"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
    );

    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/vite.svg', // Default icon for PWA
        data: payload.data // Contains our custom URL data like link: /tasks
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Add click event listener to open the app when the notification is clicked
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // This looks to see if the current is already open and
    // focuses if it is
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes(targetUrl) && 'focus' in client)
                    return client.focus();
            }
            if (clients.openWindow)
                return clients.openWindow(targetUrl);
        })
    );
});
