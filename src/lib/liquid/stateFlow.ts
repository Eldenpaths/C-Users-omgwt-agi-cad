// CLAUDE-META: Phase 9A Liquid AGI Substrate
// Directive: Meta-Architecture v2.0 - Fluid Intelligence System
// Purpose: Enable dynamic knowledge/memory/control flow between modules
// Status: Scaffold - Awaiting Phase 9A Manifest for implementation

/**
 * Liquid AGI Substrate
 *
 * Concept: Treat AGI-CAD as a fluid intelligence system where:
 * - Knowledge flows between agents dynamically
 * - Memory channels are shared via Vault
 * - Control adapts based on viscosity and surface tension
 *
 * Key Metrics:
 * - Viscosity: Resistance to change (0 = instant, 1 = frozen)
 * - Surface Tension: Autonomy boundary (0 = fully shared, 1 = isolated)
 * - Flow Rate: Information transfer speed
 */

// ────────────────────────────────────────────
// TYPE DEFINITIONS
// ────────────────────────────────────────────

export type FluidState = {
  id: string;
  type: 'knowledge' | 'memory' | 'control' | 'observation';
  data: any;
  viscosity: number;      // 0-1: adaptation speed
  surfaceTension: number; // 0-1: boundary strength
  timestamp: number;
  source: string;         // Source agent ID
  targets?: string[];     // Target agent IDs
};

export type VaultChannel = {
  id: string;
  name: string;
  type: 'broadcast' | 'directed' | 'pooled';
  states: FluidState[];
  capacity: number;
  flowRate: number;
};

export type LiquidMetrics = {
  totalFlowVolume: number;
  avgViscosity: number;
  avgSurfaceTension: number;
  channelCount: number;
  activeAgents: number;
};

// ────────────────────────────────────────────
// LIQUID STATE MANAGER
// ────────────────────────────────────────────

class LiquidStateManager {
  private channels: Map<string, VaultChannel>;
  private states: Map<string, FluidState>;
  private flowHistory: FluidState[];
  private metrics: LiquidMetrics;

  constructor() {
    this.channels = new Map();
    this.states = new Map();
    this.flowHistory = [];
    this.metrics = {
      totalFlowVolume: 0,
      avgViscosity: 0.5,
      avgSurfaceTension: 0.5,
      channelCount: 0,
      activeAgents: 0
    };

    // Initialize default channels
    this._initDefaultChannels();
  }

  /**
   * Create a new Vault channel
   */
  createChannel(config: Partial<VaultChannel>): VaultChannel {
    const channel: VaultChannel = {
      id: config.id || `channel-${Date.now()}`,
      name: config.name || 'unnamed',
      type: config.type || 'pooled',
      states: [],
      capacity: config.capacity || 1000,
      flowRate: config.flowRate || 1.0
    };

    this.channels.set(channel.id, channel);
    this.metrics.channelCount = this.channels.size;

    return channel;
  }

  /**
   * Push state into a channel (fluid intelligence flow)
   */
  pushState(channelId: string, state: Omit<FluidState, 'timestamp'>): FluidState {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const fluidState: FluidState = {
      ...state,
      timestamp: Date.now()
    };

    // Apply viscosity-based delay (simulated)
    const delay = this._calculateFlowDelay(fluidState.viscosity, channel.flowRate);

    // Add to channel
    channel.states.push(fluidState);
    this.states.set(fluidState.id, fluidState);
    this.flowHistory.push(fluidState);

    // Evict old states if over capacity
    if (channel.states.length > channel.capacity) {
      const removed = channel.states.shift();
      if (removed) this.states.delete(removed.id);
    }

    // Update metrics
    this._updateMetrics();

    return fluidState;
  }

  /**
   * Pull states from channel (filtered by agent)
   */
  pullStates(
    channelId: string,
    agentId: string,
    options: {
      type?: FluidState['type'];
      since?: number;
      limit?: number;
    } = {}
  ): FluidState[] {
    const channel = this.channels.get(channelId);
    if (!channel) return [];

    let states = channel.states;

    // Filter by target (if directed channel)
    if (channel.type === 'directed') {
      states = states.filter(s =>
        !s.targets || s.targets.includes(agentId)
      );
    }

    // Filter by type
    if (options.type) {
      states = states.filter(s => s.type === options.type);
    }

    // Filter by timestamp
    if (options.since) {
      states = states.filter(s => s.timestamp > options.since);
    }

    // Limit results
    if (options.limit) {
      states = states.slice(-options.limit);
    }

    return states;
  }

  /**
   * Calculate effective viscosity between two agents
   */
  calculateEffectiveViscosity(
    sourceViscosity: number,
    targetSurfaceTension: number
  ): number {
    // Higher surface tension increases effective viscosity
    // Formula: v_eff = v_source * (1 + st_target)
    return Math.min(1, sourceViscosity * (1 + targetSurfaceTension));
  }

  /**
   * Get current liquid metrics
   */
  getMetrics(): LiquidMetrics {
    return { ...this.metrics };
  }

  /**
   * Get channel info
   */
  getChannel(channelId: string): VaultChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * List all channels
   */
  listChannels(): VaultChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Initialize default Vault channels
   * @private
   */
  private _initDefaultChannels(): void {
    // Knowledge broadcast channel (all agents can read)
    this.createChannel({
      id: 'knowledge-broadcast',
      name: 'Knowledge Broadcast',
      type: 'broadcast',
      capacity: 5000,
      flowRate: 1.0
    });

    // Memory pool (shared persistent memory)
    this.createChannel({
      id: 'memory-pool',
      name: 'Memory Pool',
      type: 'pooled',
      capacity: 10000,
      flowRate: 0.8
    });

    // Control signals (directed agent commands)
    this.createChannel({
      id: 'control-signals',
      name: 'Control Signals',
      type: 'directed',
      capacity: 1000,
      flowRate: 1.0
    });

    // Observation stream (meta-agent observations)
    this.createChannel({
      id: 'observation-stream',
      name: 'Observation Stream',
      type: 'broadcast',
      capacity: 2000,
      flowRate: 0.9
    });
  }

  /**
   * Calculate flow delay based on viscosity
   * @private
   */
  private _calculateFlowDelay(viscosity: number, flowRate: number): number {
    // Delay in ms = (viscosity * 1000) / flowRate
    return (viscosity * 1000) / flowRate;
  }

  /**
   * Update system metrics
   * @private
   */
  private _updateMetrics(): void {
    const allStates = Array.from(this.states.values());

    if (allStates.length > 0) {
      const totalViscosity = allStates.reduce((sum, s) => sum + s.viscosity, 0);
      const totalSurfaceTension = allStates.reduce((sum, s) => sum + s.surfaceTension, 0);

      this.metrics.avgViscosity = totalViscosity / allStates.length;
      this.metrics.avgSurfaceTension = totalSurfaceTension / allStates.length;
    }

    this.metrics.totalFlowVolume = this.flowHistory.length;
    this.metrics.channelCount = this.channels.size;

    // Count unique agents
    const uniqueAgents = new Set(allStates.map(s => s.source));
    this.metrics.activeAgents = uniqueAgents.size;
  }
}

// ────────────────────────────────────────────
// SINGLETON INSTANCE
// ────────────────────────────────────────────

let liquidManager: LiquidStateManager | null = null;

export function getLiquidManager(): LiquidStateManager {
  if (!liquidManager) {
    liquidManager = new LiquidStateManager();
  }
  return liquidManager;
}

// ────────────────────────────────────────────
// UTILITY FUNCTIONS
// ────────────────────────────────────────────

/**
 * Helper: Create and push a knowledge state
 */
export function shareKnowledge(
  source: string,
  data: any,
  viscosity: number = 0.5
): FluidState {
  const manager = getLiquidManager();
  return manager.pushState('knowledge-broadcast', {
    id: `knowledge-${Date.now()}`,
    type: 'knowledge',
    data,
    viscosity,
    surfaceTension: 0.3, // Knowledge flows easily
    source
  });
}

/**
 * Helper: Store memory in pool
 */
export function storeMemory(
  source: string,
  data: any,
  viscosity: number = 0.7
): FluidState {
  const manager = getLiquidManager();
  return manager.pushState('memory-pool', {
    id: `memory-${Date.now()}`,
    type: 'memory',
    data,
    viscosity,
    surfaceTension: 0.6, // Memory persists
    source
  });
}

/**
 * Helper: Send control signal
 */
export function sendControl(
  source: string,
  targets: string[],
  data: any
): FluidState {
  const manager = getLiquidManager();
  return manager.pushState('control-signals', {
    id: `control-${Date.now()}`,
    type: 'control',
    data,
    viscosity: 0.1, // Control flows fast
    surfaceTension: 0.9, // Highly directed
    source,
    targets
  });
}

// Export singleton
export default getLiquidManager;
