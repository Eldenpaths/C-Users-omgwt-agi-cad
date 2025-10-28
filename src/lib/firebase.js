// CLAUDE-META: Phase 10E Fusion Dashboard - Client-side Firebase
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Client-side Firebase initialization with env vars
// Status: Production - NEXT_PUBLIC env vars loaded from .env.local

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase client configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (only once)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase client initialized:', firebaseConfig.projectId);
} else {
  app = getApps()[0];
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Sign-In helper
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Signed in:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('❌ Sign-in error:', error);
    throw error;
  }
}

// Sign out helper
export async function signOut() {
  try {
    await auth.signOut();
    console.log('✅ Signed out');
  } catch (error) {
    console.error('❌ Sign-out error:', error);
    throw error;
  }
}
