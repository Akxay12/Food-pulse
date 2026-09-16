import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Read configuration from Vite environment variables (.env) or Node process.env
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (process.env as any) || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

// Check if valid Firebase configuration is provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

// External AI Vision API key check
export const AI_API_KEY = env.VITE_AI_API_KEY || env.AI_API_KEY || env.VITE_GEMINI_API_KEY || '';
export const isAIConfigured = Boolean(
  AI_API_KEY &&
  AI_API_KEY.trim() !== '' &&
  AI_API_KEY !== 'MY_AI_API_KEY'
);

// External Google Maps API key check
export const MAPS_API_KEY = env.VITE_MAPS_API_KEY || env.MAPS_API_KEY || '';
export const isMapsConfigured = Boolean(
  MAPS_API_KEY &&
  MAPS_API_KEY.trim() !== '' &&
  MAPS_API_KEY !== 'MY_MAPS_API_KEY'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.info('[FoodCheck] Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[FoodCheck] Failed to initialize live Firebase, falling back to local mode:', error);
  }
} else {
  console.info('[FoodCheck] Running with local simulated backend. Paste Firebase credentials in .env to connect to live Cloud Firestore.');
}

export { app, auth, db };
