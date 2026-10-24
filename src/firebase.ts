import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

/**
 * Firebase web config. These values are not secrets (they identify the project
 * to Google's servers); access is controlled by Auth + firestore.rules.
 * They are read from VITE_FIREBASE_* variables so each environment can point at
 * its own project. See .env.example.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

/** True when the app has enough config to talk to Firebase. Demo mode works without it. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId) || useEmulators;

// Placeholders keep the SDK from throwing at startup when no config is present
// (e.g. a fresh checkout). Only demo mode is usable in that case.
const app = initializeApp({
  ...config,
  apiKey: config.apiKey || "not-configured",
  projectId: config.projectId || "demo-taskmate",
});

export const auth = getAuth(app);

// Offline cache: the app keeps working on flaky connections and syncs when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
