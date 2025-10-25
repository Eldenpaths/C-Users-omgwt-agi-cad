import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZ5sphHrqdDj1x1pqt1XWPXMLfHv8dxnw",
  authDomain: "agi-cad-core.firebaseapp.com",
  projectId: "agi-cad-core",
  storageBucket: "agi-cad-core.firebasestorage.app",
  messagingSenderId: "350605063283",
  appId: "1:350605063283:web:9efe93e8bf8bb3e6d16606",
  measurementId: "G-60SHLR0VMF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence);

export const signInWithGoogle = async () => {
  await signInWithRedirect(auth, provider);
};

export const handleRedirectResult = async () => {
  const result = await getRedirectResult(auth);
  if (result) {
    console.log("✅ User signed in:", result.user.email);
    return result.user;
  }
  return null;
};
