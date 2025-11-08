import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { encode } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ ok: false, error: 'Unauthorized' })
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) return res.status(500).json({ ok: false, error: 'Missing secret' })
    const claims: any = {
      sub: (session.user as any)?.id,
      email: session.user?.email,
      role: (session.user as any)?.role || 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 10, // 10 min
    }
    const token = await encode({ token: claims, secret })
    return res.status(200).json({ ok: true, token })
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
}

