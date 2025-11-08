import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import Auth0Provider from 'next-auth/providers/auth0'

export const authOptions: NextAuthOptions = {
  providers: [
    // Conditionally include providers based on env presence
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHubProvider({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET })]
      : []),
    ...(process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET && process.env.AUTH0_DOMAIN
      ? [Auth0Provider({ clientId: process.env.AUTH0_CLIENT_ID, clientSecret: process.env.AUTH0_CLIENT_SECRET, issuer: `https://${process.env.AUTH0_DOMAIN}` })]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Ensure we always carry a stable id on the token
      // Prefer the default NextAuth subject, else provider account id
      if (user && (user as any).id) {
        token.sub = (user as any).id
      }
      if (account) {
        // GitHub provider often exposes providerAccountId
        const accId = (account as any).providerAccountId || (account as any).id
        if (accId && !token.id) token.id = accId
      }
      // RBAC: set role via env ADMIN_EMAILS or default to 'user'
      const adminsCsv = process.env.ADMIN_EMAILS || ''
      const admins = new Set(adminsCsv.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))
      const email = (token as any).email || (user as any)?.email
      ;(token as any).role = email && admins.has(String(email).toLowerCase()) ? 'admin' : ((token as any).role || 'user')
      return token
    },
    async session({ session, token }) {
      // Expose id on session for client usage
      if (session?.user) {
        ;(session.user as any).id = (token as any).sub || (token as any).id || (session.user as any).id || null
        ;(session.user as any).role = (token as any).role || 'user'
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
