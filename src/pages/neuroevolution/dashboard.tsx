import * as React from 'react'
import type { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/auth/ssr'
import EvolutionDashboard from '@/components/neuroevolution/EvolutionDashboard'
import TaskSpace3D from '@/components/neuroevolution/TaskSpace3D'
import TaskControls from '@/components/neuroevolution/TaskControls'

export default function NeuroDashboard() {
  // In a real app, pull agentId from session or query.
  const agentId = 'demo-agent'
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid gap-4">
      <h1 className="text-xl font-semibold">Neuroevolution — Live Monitor</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TaskControls type="time" />
        <TaskControls type="resource" />
        <TaskControls type="accuracy" />
      </div>
      <EvolutionDashboard agentId={agentId} />
      <TaskSpace3D />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => requireAuth(ctx)
