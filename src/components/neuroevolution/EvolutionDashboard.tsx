'use client'
import * as React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { subscribeTaskMetrics } from '@/lib/neuroevolution/metricsClient'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function EvolutionDashboard({ agentId }: { agentId: string }) {
  const [rows, setRows] = React.useState<any[]>([])
  React.useEffect(() => {
    if (!agentId) return
    const unsub = subscribeTaskMetrics(agentId, setRows)
    return () => unsub()
  }, [agentId])

  const labels = rows.slice(0, 50).reverse().map((r) => `G${r.generation}`)
  const fitness = rows.slice(0, 50).reverse().map((r) => Number(r.fitness))
  const speed = rows.slice(0, 50).reverse().map((r) => Number(r.speed))
  const accuracy = rows.slice(0, 50).reverse().map((r) => Number(r.accuracy))
  const efficiency = rows.slice(0, 50).reverse().map((r) => Number(r.efficiency))

  const data = {
    labels,
    datasets: [
      { label: 'Fitness', data: fitness, borderColor: 'rgba(16,185,129,1)', tension: 0.25, pointRadius: 0 },
      { label: 'Speed', data: speed, borderColor: 'rgba(59,130,246,1)', tension: 0.25, pointRadius: 0 },
      { label: 'Accuracy', data: accuracy, borderColor: 'rgba(245,158,11,1)', tension: 0.25, pointRadius: 0 },
      { label: 'Efficiency', data: efficiency, borderColor: 'rgba(139,92,246,1)', tension: 0.25, pointRadius: 0 },
    ],
  }

  const options = { responsive: true, maintainAspectRatio: false } as const

  return (
    <div className="rounded-md border border-zinc-800 p-4">
      <div className="text-sm font-semibold mb-2">Evolution — Real-time Metrics</div>
      <div style={{ height: 240 }}>
        <Line data={data as any} options={options as any} />
      </div>
      <div className="mt-3 text-xs text-zinc-400">Live trends for agent {agentId}</div>
    </div>
  )
}

