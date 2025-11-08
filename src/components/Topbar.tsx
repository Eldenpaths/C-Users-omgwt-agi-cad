'use client'

import React from 'react'
import { Menu, LogOut, BookOpenText } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export interface TopbarProps {
  toggleSidebar?: () => void
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (e) {
      console.error('Sign out failed', e)
    }
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
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm">Sign Out</span>
      </button>
    </header>
  )
}
