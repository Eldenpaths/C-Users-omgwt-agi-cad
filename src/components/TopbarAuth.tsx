'use client'
import React from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function TopbarAuth() {
  const { data: session, status } = useSession()
  const loading = status === 'loading'

  if (loading) {
    return <div className="text-xs text-gray-400">Auth…</div>
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <button
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => signIn('google')}
        >Sign in with Google</button>
        <button
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => signIn('github')}
        >Sign in with GitHub</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 truncate max-w-[120px]">{session.user?.name || session.user?.email}</span>
      <button
        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
        onClick={() => signOut()}
      >Sign Out</button>
    </div>
  )
}
