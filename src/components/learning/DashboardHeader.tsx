'use client'
import * as React from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function DashboardHeader() {
  const { data: session, status } = useSession()
  const loading = status === 'loading'

  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold">Learning Dashboard</h2>
      <div className="text-xs text-zinc-400 flex items-center gap-3">
        {loading ? 'Checking session…' : session ? (
          <>
            <span>Signed in as {session.user?.email || (session.user as any)?.id || 'unknown'}</span>
            <button
              className="px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-300"
              onClick={() => signOut()}
            >Sign Out</button>
          </>
        ) : (
          <span>Not signed in</span>
        )}
      </div>
    </div>
  )
}
