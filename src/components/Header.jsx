
// src/components/Login.jsx
import { signInWithGoogle } from '../lib/firebase.js';

export default function Login() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      color: "white",
      backgroundColor: "#0a1929"
    }}>
      <h1 style={{ marginBottom: "20px" }}>AGI-CAD Login</h1>
      <button
        onClick={signInWithGoogle}
        style={{
          backgroundColor: "#4a90e2",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          color: "white",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
