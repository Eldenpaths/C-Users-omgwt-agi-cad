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

// ============================================================================
// AGENT DEFINITIONS FOR INTELLIGENCE ROUTER
// ============================================================================

const AGENTS = [
  {
    id: 'fractal-forge',
    type: 'DESIGNER',
    name: 'FractalForge',
    status: 'IDLE',
    capabilities: ['fractal_generation', 'pattern_analysis', 'recursive_design'],
    currentLoad: 0,
    maxLoad: 1,
    lastActive: Date.now(),
    metadata: {}
  },
  {
    id: 'buildsmith',
    type: 'SYNTHESIZER',
    name: 'Buildsmith',
    status: 'IDLE',
    capabilities: ['code_generation', 'code_modification', 'dependency_management'],
    currentLoad: 0,
    maxLoad: 1,
    lastActive: Date.now(),
    metadata: {}
  },
  {
    id: 'canon-sentinel',
    type: 'VALIDATOR',
    name: 'CanonSentinel',
    status: 'IDLE',
    capabilities: ['architectural_validation', 'security_scanning', 'code_quality_analysis'],
    currentLoad: 0,
    maxLoad: 1,
    lastActive: Date.now(),
    metadata: {}
  }
];

/**
 * Initialize agents with Intelligence Router
 * Called by API route on startup
 */
export function registerAgents(): void {
  console.log('🔄 Starting agent registration...');
  
  let registeredCount = 0;
  
  for (const agent of AGENTS) {
    try {
      // Register with legacy AgentRegistry for fingerprinting
      if (!AgentRegistry.has(agent.id)) {
        AgentRegistry.register(agent.id, {
          name: agent.name,
          version: '1.0.0',
          hash: agent.id
        });
      }
      registeredCount++;
      console.log(`   ✅ Registered: ${agent.name} (${agent.id})`);
    } catch (error) {
      console.error(`   ❌ Failed to register ${agent.name}:`, error);
    }
  }
  
  console.log(`🎉 Registered ${registeredCount}/${AGENTS.length} agents`);
}

/**
 * Get all available agents for Intelligence Router
 * Called by API route for /api/router?action=agents
 */
export function getAllAgents() {
  console.log('📡 getAllAgents() called, returning', AGENTS.length, 'agents');
  return [...AGENTS];
}

/**
 * Get single agent by ID
 */
export function getAgent(agentId: string) {
  return AGENTS.find(agent => agent.id === agentId);
}
