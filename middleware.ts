import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Auth middleware (Edge runtime safe).
 * Uses next-auth JWT to gate protected routes before rendering.
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const url = new URL('/api/auth/signin', req.url)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

// Protect these routes. Add more as needed.
export const config = {
  matcher: ['/protected/:path*', '/admin', '/settings'],
}

