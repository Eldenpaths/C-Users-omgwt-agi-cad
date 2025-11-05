import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

interface FirebaseInstance {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/**
 * Get initialized Firebase instance (client-side only)
 * Returns null if called on server-side (type-cast for build safety)
 */
export function getFirebase(): FirebaseInstance {
  // ⛔ Skip during server-side rendering
  if (typeof window === "undefined") {
    // Return null instead of throwing to allow builds to succeed
    console.warn('getFirebase() called on server-side, returning null');
    return null as any; // Type-cast to avoid breaking consumers
  }

  if (!app) {
    const existingApp = getApps()[0];

    if (existingApp) {
      app = existingApp;
    } else {
      // Validate environment variables
      const requiredEnvVars = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Check for missing env vars
      const missing = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
      }

      app = initializeApp(requiredEnvVars);
    }

    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase initialized:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  }

  return { app: app!, auth: auth!, db: db! };
}

// Initialize immediately if on client side
if (typeof window !== "undefined") {
  try {
    getFirebase();
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
}

/**
 * Get auth instance safely
 */
export function getAuthInstance(): Auth {
  const firebase = getFirebase();
  if (!firebase) return null as any; // Return null during SSR/build, type-cast to avoid breaking consumers
  return firebase.auth;
}

/**
 * Get Firestore instance safely
 */
export function getDbInstance(): Firestore {
  const firebase = getFirebase();
  if (!firebase) return null as any; // Return null during SSR/build, type-cast to avoid breaking consumers
  return firebase.db;
}

// Export getters for backward compatibility
export { db, auth };

/**
 * Google sign-in with popup blocked fallback
 */
export async function signInWithGoogle() {
  const auth = getAuthInstance();
  const provider = new GoogleAuthProvider();

  // Add extra scopes if needed
  provider.addScope('profile');
  provider.addScope('email');

  try {
    // Try popup first
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Signed in via popup:', result.user.email);
    return result;
  } catch (error: any) {
    console.warn('Popup sign-in failed:', error.code);

    // If popup was blocked, try redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      console.log('🔄 Falling back to redirect sign-in...');
      await signInWithRedirect(auth, provider);
      // Redirect will handle the rest
      return null;
    }

    // Re-throw other errors
    throw error;
  }
}
