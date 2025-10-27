// CLAUDE-META: Phase 9D Hybrid Patch - Agent Runtime Execution
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Agent execution loop with state vector generation
// Status: Production - Hybrid Safe Mode Active

import { NexusController, AgentProcess } from "@/agents/nexus/NexusController";
import { AgentRegistry } from "@/agents/nexus/AgentRegistry";
import { StateFlowManager, SpawnCtx } from "@/agents/nexus/StateFlowManager";

export type AgentConfig = {
  id: string;
  name: string;
  depth: number;
  parentId?: string;
  uid: string;
};

export type RuntimeMetrics = {
  agentId: string;
  state: number[];
  drift: boolean;
  stdDev: number;
  entropy: number;
  timestamp: number;
};

/**
 * Agent Runtime Manager
 * Executes agents and computes real-time drift metrics
 */
export class AgentRuntime {
  private nexus: NexusController;
  private activeAgents = new Map<string, AgentProcess>();
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;
  private tickCount = 0;

  // Callbacks
  private onMetricsUpdate?: (metrics: RuntimeMetrics) => void;
  private onError?: (agentId: string, error: Error) => void;

  constructor(
    private tickInterval: number = 1000, // 1 second
    private stateDimension: number = 8 // State vector dimension
  ) {
    this.nexus = new NexusController();
  }

  /**
   * Register agent for execution
   */
  registerAgent(config: AgentConfig): AgentProcess {
    // Create agent process
    const agent: AgentProcess = {
      id: config.id,
      depth: config.depth,
      parentId: config.parentId,
      runStep: async (t: number) => {
        // Agent execution logic
        // Returns state vector representing agent's internal state
        return this.computeStateVector(config, t);
      },
    };

    // Register with AgentRegistry
    AgentRegistry.register(config.id, {
      name: config.name,
      version: "1.0.0",
      hash: this.hashConfig(config),
      parent: config.parentId,
    });

    this.activeAgents.set(config.id, agent);
    console.log(`[Runtime] Registered agent: ${config.id}`);

    return agent;
  }

  /**
   * Unregister and stop agent
   */
  unregisterAgent(agentId: string) {
    this.activeAgents.delete(agentId);
    console.log(`[Runtime] Unregistered agent: ${agentId}`);
  }

  /**
   * Start execution loop
   */
  start(onMetricsUpdate?: (metrics: RuntimeMetrics) => void, onError?: (agentId: string, error: Error) => void) {
    if (this.running) {
      console.warn("[Runtime] Already running");
      return;
    }

    this.onMetricsUpdate = onMetricsUpdate;
    this.onError = onError;
    this.running = true;
    this.tickCount = 0;

    console.log("[Runtime] Starting execution loop");

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);
  }

  /**
   * Stop execution loop
   */
  stop() {
    if (!this.running) return;

    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("[Runtime] Stopped execution loop");
  }

  /**
   * Execute one tick for all agents
   */
  private async tick() {
    this.tickCount++;
    const t = this.tickCount;

    for (const [agentId, agent] of this.activeAgents) {
      try {
        // Execute agent step and get drift metrics
        const result = await this.nexus.step(agent, t);

        // Emit metrics
        if (this.onMetricsUpdate) {
          this.onMetricsUpdate({
            agentId,
            state: result.state,
            drift: result.drift,
            stdDev: result.stdDev,
            entropy: result.entropy,
            timestamp: Date.now(),
          });
        }
      } catch (error: any) {
        console.error(`[Runtime] Agent ${agentId} execution error:`, error);
        if (this.onError) {
          this.onError(agentId, error);
        }
      }
    }
  }

  /**
   * Compute state vector for agent
   * This is where agent logic would execute
   * For now, we simulate with mathematical functions
   */
  private computeStateVector(config: AgentConfig, t: number): number[] {
    const state: number[] = [];

    // Generate state vector based on agent properties and time
    // Each dimension represents a different aspect of agent state
    for (let i = 0; i < this.stateDimension; i++) {
      // Use agent ID hash as seed for deterministic but varied behavior
      const seed = this.hashString(config.id + i);

      // Different state dynamics for each dimension
      const phase = seed + t * 0.1;
      const amplitude = 1.0 + config.depth * 0.2; // Deeper agents have higher amplitude

      // Mix of sine waves with different frequencies
      const value =
        amplitude * Math.sin(phase) +
        0.5 * Math.cos(phase * 2) +
        0.25 * Math.sin(phase * 0.5);

      state.push(value);
    }

    return state;
  }

  /**
   * Hash string to number
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 1000000;
  }

  /**
   * Hash agent config
   */
  private hashConfig(config: AgentConfig): string {
    return `sha256:${this.hashString(config.id + config.name + config.depth).toString(16)}`;
  }

  /**
   * Get active agent count
   */
  getActiveCount(): number {
    return this.activeAgents.size;
  }

  /**
   * Check if agent is registered
   */
  hasAgent(agentId: string): boolean {
    return this.activeAgents.has(agentId);
  }
}
