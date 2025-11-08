import { getToken, decode } from 'next-auth/jwt'
import type { IncomingMessage } from 'http'

export type WsAuthResult = {
  ok: boolean
  reason?: string
  token?: any
}

/**
 * Verify WS auth from cookies or signed token in query (?token=...).
 */
export async function verifyWsAuth(req: IncomingMessage): Promise<WsAuthResult> {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) return { ok: false, reason: 'missing-secret' }
    // Try cookie-based token first
    // @ts-ignore - getToken accepts any req-like with headers/cookies
    let token = await getToken({ req, secret })
    // Fallback: token provided via query param (?token=...)
    if (!token) {
      const url = new URL(req.url || '', 'http://localhost')
      const raw = url.searchParams.get('token') || undefined
      if (raw) {
        try {
          // decode from next-auth/jwt (verifies signature)
          token = await decode({ token: raw, secret })
        } catch (_) {}
      }
    }
    if (!token) return { ok: false, reason: 'no-token' }
    return { ok: true, token }
  } catch (e) {
    return { ok: false, reason: 'auth-error' }
  }
}

export function canAccessTopic(token: any, topic: string): boolean {
  // Topics like: agent/{agentId}/metrics or task/{type}/metrics
  if (!token) return false
  if (typeof topic !== 'string' || topic.length === 0) return false
  const parts = topic.split('/')
  if (parts[0] === 'agent' && parts[2] === 'metrics') {
    const agentId = parts[1]
    // Allow if token.sub matches agentId; admins (role==='admin') can access all
    if ((token as any).role === 'admin') return true
    return String(token.sub || '') === String(agentId)
  }
  if ((token as any).role === 'admin') return true
  return false
}
