"use client"
import { signInWithGoogle } from "../lib/firebase.js"

export default function Login() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">AGI-CAD Login</h1>
        <button
          onClick={signInWithGoogle}
          className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
