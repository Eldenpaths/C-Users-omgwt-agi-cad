/**
 * Auth Context
 * Provides Firebase authentication state to the entire app
 *
 * Phase 19-FINAL: Fixed race condition and added better error handling
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, getRedirectResult } from 'firebase/auth';
import { getAuthInstance, signInWithGoogle as firebaseSignInWithGoogle } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let auth;

    try {
      auth = getAuthInstance();
    } catch (err) {
      console.error('Auth initialization failed:', err);
      setError('Firebase authentication could not be initialized');
      setLoading(false);
      return;
    }

    // Check for redirect result (in case popup was blocked)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('✅ Signed in via redirect:', result.user.email);
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', error);
        setError(error.message);
      });

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);

        if (user) {
          console.log('✅ Auth state: Signed in as', user.email);
        } else {
          console.log('🔓 Auth state: Signed out');
        }
      },
      (error) => {
        console.error('Auth state error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await firebaseSignInWithGoogle();
      return result;
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const auth = getAuthInstance();
      await firebaseSignOut(auth);
      console.log('✅ Signed out successfully');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
