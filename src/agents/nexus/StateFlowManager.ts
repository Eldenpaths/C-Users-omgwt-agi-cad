// CLAUDE-META: Phase 9A Hybrid Patch - Safe Recursion Controller
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Recursion depth limiting and spawn context management
// Status: Production - Hybrid Safe Mode Active

export type SpawnCtx = {
  depth: number;
  parentId?: string;
  lineageRoot?: string;
};

export class StateFlowManager {
  static MAX_RECURSION_DEPTH = 5;
  static MAX_CHILDREN_PER_AGENT = 3;

  static validateDepth(depth: number) {
    if (depth > StateFlowManager.MAX_RECURSION_DEPTH) {
      throw new Error(`Recursion depth ${depth} exceeds safe limit`);
    }
  }

  static nextSpawnCtx(prev: SpawnCtx, parentId: string): SpawnCtx {
    const root = prev.lineageRoot ?? parentId;
    const next = { depth: prev.depth + 1, parentId, lineageRoot: root };
    StateFlowManager.validateDepth(next.depth);
    return next;
  }
}
