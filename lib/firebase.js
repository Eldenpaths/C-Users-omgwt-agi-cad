import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";

// 🔍 ENV DIAGNOSTIC LOGS
console.log("--- FIREBASE ENV DIAGNOSTICS ---");
console.log(
  "API Key Status:",
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "LOADED" : "MISSING"
);
console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("-------------------------------");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Set persistence on initialization
setPersistence(auth, browserLocalPersistence).catch((err) =>
  console.error("Persistence setup failed:", err)
);

// Sign in with Google (redirect flow)
export const signInWithGoogle = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithRedirect(auth, provider);
  } catch (err) {
    console.error("Google Sign-In Redirect Error:", err);
  }
};

// Handle redirect result when user returns from Google
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("✅ User signed in:", result.user.email);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("❌ Redirect result error:", error);
    throw error;
  }
};

// Subscribe to auth state changes
export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback);

