/**
 * Login Page
 * Simple Google authentication
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { signInWithGoogle } from '@/lib/firebase/client';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/labs');
    }
  }, [user, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/labs');
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-purple-600/20 rounded-2xl border border-purple-500/30 mb-6">
            <Zap className="w-16 h-16 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AGI-CAD Labs</h1>
          <p className="text-gray-400">AI-Powered Science Simulation Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-700/30 p-8">
          <h2 className="text-2xl font-bold text-purple-300 mb-2">Sign In</h2>
          <p className="text-gray-400 text-sm mb-6">
            Access the Science Labs platform
          </p>

          <button
            onClick={handleSignIn}
            className="w-full px-6 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-medium transition duration-150 flex items-center justify-center space-x-3 shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>By signing in, you agree to our Terms of Service</p>
            <p className="mt-1">and Privacy Policy</p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-4">What you'll get access to:</p>
          <div className="grid grid-cols-1 gap-3">
            <div className="text-left px-4 py-3 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-sm text-white font-medium">Science Labs</p>
              <p className="text-xs text-gray-500">Plasma physics, spectral analysis, and more</p>
            </div>
            <div className="text-left px-4 py-3 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-sm text-white font-medium">AI Agent Control</p>
              <p className="text-xs text-gray-500">Command labs with natural language</p>
            </div>
            <div className="text-left px-4 py-3 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-sm text-white font-medium">Real-Time Telemetry</p>
              <p className="text-xs text-gray-500">Monitor experiments at 30 FPS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
