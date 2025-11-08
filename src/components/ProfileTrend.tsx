'use client'
import React from 'react'
import type { RewardRecord } from '@/lib/routerProfiles/profileTypes'

type Props = {
  rewards: RewardRecord[]
  width?: number
  height?: number
  hoverT?: number
}

export default function ProfileTrend({ rewards, width = 220, height = 48 }: Props) {
  const pad = 4
  const w = width
  const h = height
  const values = (rewards || []).map((r) => Number(r.delta || 0))
  const n = values.length
  const min = Math.min(-1, ...values)
  const max = Math.max(1, ...values)
  const scaleX = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, n - 1)
  const scaleY = (v: number) => {
    const t = (v - min) / Math.max(1e-6, max - min)
    return pad + (1 - t) * (h - pad * 2)
  }

  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`).join(' ')

  const areaPath = (() => {
    if (values.length === 0) return ''
    const baseY = scaleY(0)
    const start = `M${scaleX(0)},${baseY}`
    const line = values.map((v, i) => `L${scaleX(i)},${scaleY(v)}`).join(' ')
    const close = `L${scaleX(values.length - 1)},${baseY} Z`
    return `${start} ${line} ${close}`
  })()

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="reward sparkline">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={w - pad} y1={scaleY(0)} y2={scaleY(0)} stroke="#e5e7eb" strokeDasharray="2,2" />
      {areaPath && <path d={areaPath} fill="url(#trendFill)" stroke="none" />}
      <path d={path} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
      {values.map((v, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(v)} r={2} fill={v >= 0 ? '#10b981' : '#ef4444'}>
          {i === values.length - 1 ? <title>{v.toFixed(3)}</title> : null}
        </circle>
      ))}
    </svg>
  )
}

