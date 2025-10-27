// CLAUDE-META: Phase 9A Hybrid Patch - Nexus Controller
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Safe agent spawning with lineage tracking and drift monitoring
// Status: Production - Hybrid Safe Mode Active

import { StateFlowManager, SpawnCtx } from "./StateFlowManager";
import { DriftMonitor } from "./DriftMonitor";
import { AgentRegistry } from "./AgentRegistry";

export type AgentProcess = {
  id: string;
  depth: number;
  parentId?: string;
  runStep: (t: number) => Promise<number[]>; // returns state vector
};

export class NexusController {
  private childrenByParent = new Map<string, number>();
  private drift = new DriftMonitor();

  canSpawn(parentId: string) {
    const used = this.childrenByParent.get(parentId) ?? 0;
    return used < StateFlowManager.MAX_CHILDREN_PER_AGENT;
  }

  recordSpawn(parentId: string) {
    this.childrenByParent.set(parentId, (this.childrenByParent.get(parentId) ?? 0) + 1);
  }

  async safeSpawn(parent: AgentProcess, makeChild: (ctx: SpawnCtx)=>AgentProcess) {
    const ctx = StateFlowManager.nextSpawnCtx(
      { depth: parent.depth, parentId: parent.id, lineageRoot: parent.id },
      parent.id
    );
    if (!this.canSpawn(parent.id)) {
      throw new Error(`Spawn budget exceeded for ${parent.id}`);
    }
    this.recordSpawn(parent.id);
    const child = makeChild(ctx);
    if (!AgentRegistry.has(child.id)) throw new Error(`Unregistered child agent ${child.id}`);
    return child;
  }

  async step(proc: AgentProcess, t: number) {
    const state = await proc.runStep(t);
    this.drift.push({ t, state });
    const { drift, stdDev, entropy } = this.drift.assess();
    return { state, drift, stdDev, entropy };
  }
}
