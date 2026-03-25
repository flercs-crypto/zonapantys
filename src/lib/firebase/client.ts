import { browser } from '$app/environment';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET
} from '$env/static/public';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const authPersistenceReady = browser
	? setPersistence(auth, browserLocalPersistence).catch(() => undefined)
	: Promise.resolve();

export { app, auth, authPersistenceReady };
