"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { handleRedirectResult } from "../lib/firebase.js";
import { useAuth } from "../src/hooks/useAuth";
import Login from "../src/components/Login.jsx";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  useEffect(() => {
    // Handle redirect result when user returns from Google
    handleRedirectResult()
      .then(() => {
        setCheckingRedirect(false);
      })
      .catch((error) => {
        console.error("Redirect handling error:", error);
        setCheckingRedirect(false);
      });
  }, []);

  useEffect(() => {
    // Redirect to dashboard if user is logged in
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || checkingRedirect) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#0a1929",
        color: "white"
      }}>
        Loading...
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return <Login />;
}

