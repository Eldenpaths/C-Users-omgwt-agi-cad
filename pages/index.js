import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signInWithGoogle, handleRedirectResult } from "../lib/firebase";
import useAuth from "../src/hooks/useAuth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    handleRedirectResult().finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!loading && !checking && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, checking, router]);

  if (loading || checking) {
    return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  if (user) return null;

  return (
    <main className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl font-semibold mb-4">AGI-CAD Login</h1>
      <button onClick={signInWithGoogle} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
        Sign in with Google
      </button>
    </main>
  );
}
