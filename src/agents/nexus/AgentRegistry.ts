// CLAUDE-META: Phase 9A Hybrid Patch - Safe Recursion + Registry
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Agent registration with lineage tracking and spoof prevention
// Status: Production - Hybrid Safe Mode Active

export type AgentId = string;

export interface AgentFingerprint {
  name: string;          // "Buildsmith", "Corewright", etc.
  version: string;       // "1.2.0"
  hash: string;          // sha256 of code signature (future)
  parent?: AgentId;      // lineage parent
}

const registry = new Map<AgentId, AgentFingerprint>();

export const AgentRegistry = {
  register(id: AgentId, fp: AgentFingerprint) {
    if (registry.has(id)) throw new Error(`Agent ${id} already registered`);
    registry.set(id, fp);
  },
  get(id: AgentId) { return registry.get(id); },
  has(id: AgentId) { return registry.has(id); }
};
