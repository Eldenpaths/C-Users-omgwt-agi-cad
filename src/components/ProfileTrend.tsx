'use client'
import React from 'react'
import type { RewardRecord } from '@/lib/routerProfiles/profileTypes'

type Props = {
  rewards: RewardRecord[]
  width?: number
  height?: number
}

export default function ProfileTrend({ rewards, width = 220, height = 48 }: Props) {
  const pad = 4
  const w = width
  const h = height
  const values = (rewards || []).map((r) => Number(r.delta || 0))
  const n = values.length
  const min = Math.min(-1, ...values)
  const max = Math.max(1, ...values)
  const scaleX = (i: number) => (pad + (i * (w - pad * 2)) / Math.max(1, n - 1))
  const scaleY = (v: number) => {
    const t = (v - min) / Math.max(1e-6, max - min)
    return pad + (1 - t) * (h - pad * 2)
  }

  // Build path
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`)
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="reward sparkline">
      {/* zero line */}
      <line x1={pad} x2={w - pad} y1={scaleY(0)} y2={scaleY(0)} stroke="#e5e7eb" strokeDasharray="2,2" />
      {/* main path */}
      <path d={path} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
      {/* per-point dots colored by sign */}
      {values.map((v, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(v)} r={2}
          fill={v >= 0 ? '#10b981' : '#ef4444'} />
      ))}
    </svg>
  )
}

