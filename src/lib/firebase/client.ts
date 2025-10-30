import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

interface FirebaseInstance {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

export function getFirebase(): FirebaseInstance {
  // ⛔ Skip during server-side rendering
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null };
  }

  if (!app) {
    const existingApp = getApps()[0];

    if (existingApp) {
      app = existingApp;
    } else {
      app = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
    }

    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase client initialized:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
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
  if (!auth) {
    throw new Error('Firebase not initialized - must be called from client side');
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}
