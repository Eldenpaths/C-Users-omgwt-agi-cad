'use client'
import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function TrendChart({ title, points, color = 'rgba(16,185,129,1)' }: { title: string; points: number[]; color?: string }) {
  const data = React.useMemo(() => ({
    labels: points.map((_, i) => String(i + 1)),
    datasets: [{
      label: title,
      data: points,
      fill: false,
      borderColor: color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.25,
    }],
  }), [points, title, color])

  const options = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { x: { display: false }, y: { display: false } },
  }), [])

  return (
    <div style={{ height: 64 }}>
      <Line data={data} options={options as any} />
    </div>
  )
}

