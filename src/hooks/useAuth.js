import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, handleRedirectResult } from "../../lib/firebase.js";

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = not yet checked
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1️⃣ Handle Google redirect result once
    handleRedirectResult()
      .then((resultUser) => {
        if (resultUser) {
          console.log("✅ Redirect user restored:", resultUser.email);
          setUser(resultUser);
        }
      })
      .catch((err) => console.error("Redirect result error:", err))
      .finally(() => setLoading(false));

    // 2️⃣ Subscribe to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
