import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { env, assertEnv } from "@/lib/env";

let appInstance: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  const e = typeof window !== "undefined" ? assertEnv() : env;
  const apps = getApps();
  if (apps.length > 0) {
    appInstance = apps[0] as FirebaseApp;
    return appInstance;
  }
  appInstance = initializeApp({
    apiKey: e.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: e.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: e.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: e.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: e.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: e.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return appInstance;
}

export const app = getFirebaseApp();

export function getFirebaseAuth(): Auth {
  const auth = getAuth(app);
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    } catch {
      // Emulator already connected or not available
    }
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  const db = getFirestore(app);
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
    try {
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    } catch {
      // Emulator already connected or not available
    }
  }
  return db;
}
