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
        '[firebase-messaging-sw.js] Received background message (Firebase displays it automatically)',
        payload
    );
});
