import * as React from 'react'
import type { GetServerSideProps } from 'next'
import type { Session } from 'next-auth'
import { requireAuth } from '@/lib/auth/ssr'

type Props = { session: Session }

export default function AdminPage({ session }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-2">Admin</h1>
      <div className="rounded border border-zinc-800 p-4 text-sm">
        <p className="mb-1">Welcome, Admin {session.user?.email ?? (session.user as any)?.id ?? 'unknown user'}</p>
        <p className="text-zinc-400">This page is protected by SSR gating.</p>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireAuth(ctx)
}

