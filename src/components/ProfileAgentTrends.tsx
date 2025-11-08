'use client'
import React from 'react'
import { groupRewardsByAgent } from '@/lib/routerProfiles/profileAnalytics'
import type { RewardRecord } from '@/lib/routerProfiles/profileTypes'
import ProfileTrend from './ProfileTrend'

export default function ProfileAgentTrends({ rewards }: { rewards: RewardRecord[] }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState<number>(220)
  const [hoverT, setHoverT] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    function measure() {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width > 0) setWidth(Math.floor(rect.width))
    }
    measure()
    const on = () => measure()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const grouped = groupRewardsByAgent(rewards || [])
  const agents = Object.keys(grouped)
  if (agents.length === 0) return null

  function onMove(e: React.MouseEvent) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pad = 4
    const t = (x - pad) / Math.max(1, width - pad * 2)
    const clamped = Math.max(0, Math.min(1, t))
    setHoverT(clamped)
  }

  return (
    <div
      ref={containerRef}
      className="mt-4 grid gap-2"
      onMouseMove={onMove}
      onMouseLeave={() => setHoverT(undefined)}
    >
      {agents.map((a) => {
        const arr = (grouped as any)[a] as RewardRecord[]
        const recent = arr.slice(-30)
        const n = arr.length
        const avg = n ? arr.reduce((s, r) => s + Number(r.delta || 0), 0) / n : 0
        const sign = avg >= 0 ? '+' : ''
        return (
          <div key={a}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-500">{a}</div>
              <div className={`text-[11px] ${avg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ?avg {sign}{avg.toFixed(2)} (n = {n})
              </div>
            </div>
            <ProfileTrend rewards={recent} height={30} width={width} hoverT={hoverT} />
          </div>
        )
      })}
    </div>
  )
}
