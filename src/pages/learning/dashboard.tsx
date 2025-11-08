import dynamic from 'next/dynamic'
import React from 'react'
import type { GetServerSideProps } from 'next'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import DashboardHeader from '@/components/learning/DashboardHeader'

// Load client component dynamically (to avoid SSR issues)
const LearningMetricsPanel = dynamic(() => import('@/components/learning/LearningMetricsPanel'), { ssr: false })

/**
 * Learning Dashboard — real-time metrics.
 * Renders high-level KPIs and per-lab breakdown using client-side snapshots.
 */
export default function LearningDashboard(_props: { session: Session }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <DashboardHeader />
      <LearningMetricsPanel />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    }
  }
  return { props: { session } }
}
