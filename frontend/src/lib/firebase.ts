import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import api from '../api/axios';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase safely (prevents app crash if Vercel env keys are missing)
let app: any = null;
try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
    } else {
        console.warn("Firebase API key missing. Push notifications disabled.");
    }
} catch (e) {
    console.error("Firebase init error", e);
}

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = async () => {
    if (!app) return null;
    const supported = await isSupported();
    if (supported) {
        return getMessaging(app);
    }
    return null;
}

export const requestForToken = async () => {
    try {
        const msg = await messaging();
        if (!msg) {
            console.log("Firebase Messaging not supported in this browser.");
            return null;
        }

        const currentToken = await getToken(msg, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        if (currentToken) {
            console.log('Firebase registration token:', currentToken);
            // Send token to our Django backend
            await api.post('/auth/fcm-token/', {
                token: currentToken,
                device_type: 'web'
            });
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = async () => {
    const msg = await messaging();
    if (!msg) return new Promise(() => { });

    return new Promise((resolve) => {
        onMessage(msg, (payload) => {
            resolve(payload);
        });
    });
};
