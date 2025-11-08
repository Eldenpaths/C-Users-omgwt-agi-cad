import type { GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export async function getServerSideSession(ctx: GetServerSidePropsContext) {
  return getServerSession(ctx.req, ctx.res, authOptions)
}

export async function requireAuth(ctx: GetServerSidePropsContext) {
  const session = await getServerSideSession(ctx)
  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    } as const
  }
  return { props: { session } } as const
}

