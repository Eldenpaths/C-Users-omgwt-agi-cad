export type RewardRecord = {
  taskId: string
  agent: string
  delta: number
  timestamp: number
}

export type OperatorProfile = {
  uid: string
  weights: Record<string, any>
  rewards: RewardRecord[]
  meta: { lastUpdated: number; sessions: number; avgReward: number }
}

