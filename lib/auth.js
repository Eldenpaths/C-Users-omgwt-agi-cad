// lib/auth.js
import { auth } from "@/lib/firebase.js";

import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// Launch Google Sign-In popup
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Signed in:", result.user.displayName);
    return result.user;
  } catch (err) {
    console.error("❌ Sign-in error:", err);
  }
}

// Sign user out
export async function signOutUser() {
  try {
    await signOut(auth);
    console.log("👋 Signed out");
  } catch (err) {
    console.error("❌ Sign-out error:", err);
  }
}

// Watch for auth changes (login/logout)
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}


