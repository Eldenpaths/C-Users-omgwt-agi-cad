import React from "react";
import { signInWithGoogle } from "../../lib/firebase.js";

export default function Login() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#0a1929"
    }}>
      <button
        onClick={signInWithGoogle}
        style={{
          backgroundColor: "#4285F4",
          color: "white",
          padding: "10px 20px",
          borderRadius: "5px",
          fontSize: "16px",
          cursor: "pointer",
          border: "none"
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
