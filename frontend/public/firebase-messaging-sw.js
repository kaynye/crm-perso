importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// IMPORTANT: these values must be hardcoded here normally, or injected via build process
// because Service Workers don't have access to import.meta.env
// For this project, we hardcode the config you provided.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
