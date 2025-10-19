"use client";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../src/hooks/useAuth";
import Layout from "../src/components/Layout";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        Loading...
      </div>
    );

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">AGI-CAD Dashboard</h1>
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <span>{user.displayName || user.email}</span>
            <button
              onClick={handleSignOut}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="border border-gray-800 p-8 rounded-xl bg-gray-900">
          <h2 className="text-xl font-semibold mb-2">Welcome to AGI-CAD</h2>
          <p className="text-gray-400 mb-4">
            Your symbolic operating system for AI agents is ready.
          </p>
          <div className="text-blue-400">
            ✅ Authentication working  
            ✅ Firebase connected  
            🎯 Dashboard UI active
          </div>
        </div>
      </div>
    </Layout>
  );
}
