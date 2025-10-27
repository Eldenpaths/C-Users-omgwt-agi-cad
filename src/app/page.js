'use client';

import Link from 'next/link';
import { auth, signInWithGoogle } from '../lib/firebase';
import { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen forge-theme flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-serif tracking-widest mb-4 text-amber-200">
          AGI-CAD
        </h1>
        <p className="text-xl text-amber-300 mb-8">
          Knowledge Graph Integration
        </p>

        {user ? (
          <p className="text-amber-400 mb-8">
            Signed in as: {user.email}
          </p>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="mb-8 px-6 py-3 bg-amber-700 hover:bg-amber-600 rounded-lg transition"
          >
            Sign in with Google
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link href="/dashboard">
            <div className="forge-panel p-8 rounded-lg hover:forge-glow transition-all cursor-pointer">
              <h2 className="text-2xl font-serif mb-3">Dashboard</h2>
              <p className="text-amber-400">System overview and metrics</p>
            </div>
          </Link>

          <Link href="/forge">
            <div className="forge-panel p-8 rounded-lg hover:forge-glow transition-all cursor-pointer">
              <h2 className="text-2xl font-serif mb-3">Forge</h2>
              <p className="text-amber-400">Build visualization and control</p>
            </div>
          </Link>

          <Link href="/agenthub">
            <div className="forge-panel p-8 rounded-lg hover:forge-glow transition-all cursor-pointer">
              <h2 className="text-2xl font-serif mb-3">Agent Hub</h2>
              <p className="text-amber-400">AI agent orchestration</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
