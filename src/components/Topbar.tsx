'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { signInWithGoogle, signOut } from '@/lib/firebase';
import { Menu, LogOut, BookOpenText } from 'lucide-react';


export interface TopbarProps {
  toggleSidebar?: () => void
}


export default function Topbar({ toggleSidebar }: TopbarProps) {
  const { user, loading } = useAuth();

  const renderAuthButton = () => {
    if (loading) {
      return (
        <button disabled className="opacity-50 flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
          <span className="text-sm">Loading...</span>
        </button>
      );
    }

    if (user) {
      return (
        <button
          onClick={async () => {
            await signOut();
            window.location.reload(); // Force reload after sign out
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      );
    }

    return (
      <button
        onClick={async () => {
          await signInWithGoogle();
        }}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
      >
        <span className="text-sm">Sign in with Google</span>
      </button>
    );
  }

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      <button onClick={toggleSidebar} className="p-2 hover:bg-gray-800 rounded-lg">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          <span className="text-sm">Dashboard</span>
        </button>
        <button
          onClick={() => (window.location.href = '/dashboard#policy')}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          <span className="text-sm">⚙ Policy</span>
        </button>
        <button
          onClick={() => window.open('/docs/Operator-Manual-Phase24D.md', '_blank')}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition mr-2"
        >
          <BookOpenText className="w-4 h-4" />
          <span className="text-sm">24D Manual</span>
        </button>
      </div>
      {renderAuthButton()}
    </header>
  )
}
