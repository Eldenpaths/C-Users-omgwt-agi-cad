export type PolicyMode = 'balanced' | 'risk-seeking' | 'conservative'

export interface PolicyConfig {
  mode: PolicyMode
  window: number
  rebiasRate: number
  lastAutoTune?: number
}
