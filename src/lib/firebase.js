// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app = null;
let auth = null;
let db = null;

export function getFirebase() {
  // ⛔ Skip during server-side rendering
  if (typeof window === "undefined") return { app: null, auth: null, db: null };

  if (!app) {
    app =
      getApps()[0] ||
      initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });

    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase client initialized:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  }

  return { app, auth, db };
}

// Initialize immediately if on client side
if (typeof window !== "undefined") {
  getFirebase();
}

// Export individual values for direct imports
export { app, auth, db };

// Helper function for Google sign-in
export async function signInWithGoogle() {
  const { auth } = getFirebase();
  if (!auth) throw new Error("Firebase not initialized");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// ✅ NEW: Safe Firestore access for Node/Agent scripts
export function getFirestoreInstance() {
  if (!db) {
    const activeApp = getApps()[0] || initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
    db = getFirestore(activeApp);
  }
  return db;
}
