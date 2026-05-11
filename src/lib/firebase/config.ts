import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Read each `NEXT_PUBLIC_*` as a direct `process.env.…` expression so Next.js
 * can inline values into the client bundle (dynamic lookups stay empty).
 */
/** Firebase is on whenever the web app API key is set (dev and production). Use demo on /login without filling keys. */
export function isFirebaseConfigured(): boolean {
  const k = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return typeof k === "string" && k.trim().length > 0;
}

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Missing Firebase env vars. Copy .env.local.example to .env.local.");
  }
  if (!app) {
    app =
      getApps().length > 0
        ? getApps()[0]!
        : initializeApp({
            apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "").trim(),
            authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "").trim(),
            projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "").trim(),
            storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim(),
            messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "").trim(),
            appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "").trim(),
          });
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
