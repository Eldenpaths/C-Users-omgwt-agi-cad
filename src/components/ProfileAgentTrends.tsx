'use client'
import React from 'react'
import { groupRewardsByAgent } from '@/lib/routerProfiles/profileAnalytics'
import type { RewardRecord } from '@/lib/routerProfiles/profileTypes'
import ProfileTrend from './ProfileTrend'

export default function ProfileAgentTrends({ rewards }: { rewards: RewardRecord[] }) {
  const grouped = groupRewardsByAgent(rewards || [])
  const agents = Object.keys(grouped)
  if (agents.length === 0) return null
  return (
    <div className="mt-4 grid gap-2">
      {agents.map((a) => (
        <div key={a}>
          <div className="text-xs text-gray-500 mb-1">{a}</div>
          <ProfileTrend rewards={(grouped as any)[a].slice(-30)} height={30} />
        </div>
      ))}
    </div>
  )
}

