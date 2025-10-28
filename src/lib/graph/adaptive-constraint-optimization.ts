// CLAUDE-META: Phase 10 Leapfrog - Adaptive Constraint Optimization (ACO)
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Dynamic utility-driven pruning of recursion tree
// Status: Production - Hybrid Safe Mode Active

export type Constraint = {
  id: string;
  type: "depth" | "resource" | "time" | "quality" | "custom";
  priority: number; // 0-1, higher = more important
  threshold: number;
  currentValue: number;
  satisfied: boolean;
  utility: number; // 0-1, benefit of satisfying this constraint
};

export type ConstraintNode = {
  agentId: string;
  depth: number;
  constraints: Constraint[];
  children: string[];
  utilityScore: number;
  pruned: boolean;
};

/**
 * Adaptive Constraint Optimization
 * Dynamically prunes recursion tree based on utility scores
 */
export class AdaptiveConstraintOptimizer {
  private nodes = new Map<string, ConstraintNode>();
  private constraintQueue: Constraint[] = [];

  /**
   * Register agent node with constraints
   */
  registerNode(agentId: string, depth: number, constraints: Constraint[]): void {
    const utilityScore = this.computeUtility(constraints);

    const node: ConstraintNode = {
      agentId,
      depth,
      constraints,
      children: [],
      utilityScore,
      pruned: false,
    };

    this.nodes.set(agentId, node);
    console.log(`[ACO] Registered node ${agentId} with utility ${utilityScore.toFixed(3)}`);
  }

  /**
   * Add child relationship
   */
  addChild(parentId: string, childId: string): void {
    const parent = this.nodes.get(parentId);
    if (parent) {
      parent.children.push(childId);
    }
  }

  /**
   * Compute utility score for constraints
   */
  private computeUtility(constraints: Constraint[]): number {
    if (constraints.length === 0) return 0;

    let totalUtility = 0;
    let totalWeight = 0;

    for (const c of constraints) {
      const weight = c.priority;
      const satisfaction = c.satisfied ? 1 : (1 - Math.abs(c.currentValue - c.threshold) / c.threshold);
      const utility = c.utility * satisfaction;

      totalUtility += utility * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalUtility / totalWeight : 0;
  }

  /**
   * Evaluate whether to prune a node
   */
  shouldPrune(agentId: string, minUtility: number = 0.3): boolean {
    const node = this.nodes.get(agentId);
    if (!node) return false;

    // Don't prune if utility is above threshold
    if (node.utilityScore >= minUtility) {
      return false;
    }

    // Check if any constraints are critical violations
    const hasCriticalViolation = node.constraints.some(
      c => c.priority > 0.8 && !c.satisfied
    );

    if (hasCriticalViolation) {
      console.warn(`[ACO] Pruning node ${agentId}: critical constraint violation`);
      return true;
    }

    // Prune low-utility deep nodes
    if (node.depth > 3 && node.utilityScore < minUtility) {
      console.warn(`[ACO] Pruning node ${agentId}: low utility at depth ${node.depth}`);
      return true;
    }

    return false;
  }

  /**
   * Prune node and its subtree
   */
  pruneNode(agentId: string): string[] {
    const node = this.nodes.get(agentId);
    if (!node) return [];

    const pruned: string[] = [agentId];
    node.pruned = true;

    // Recursively prune children
    for (const childId of node.children) {
      pruned.push(...this.pruneNode(childId));
    }

    console.log(`[ACO] Pruned ${pruned.length} nodes starting from ${agentId}`);
    return pruned;
  }

  /**
   * Optimize entire tree
   */
  optimizeTree(minUtility: number = 0.3): string[] {
    const prunedNodes: string[] = [];

    for (const [agentId, node] of this.nodes) {
      if (!node.pruned && this.shouldPrune(agentId, minUtility)) {
        prunedNodes.push(...this.pruneNode(agentId));
      }
    }

    return prunedNodes;
  }

  /**
   * Get node utility score
   */
  getUtility(agentId: string): number {
    return this.nodes.get(agentId)?.utilityScore ?? 0;
  }

  /**
   * Get constraint queue
   */
  getConstraintQueue(): Constraint[] {
    return [...this.constraintQueue];
  }

  /**
   * Add constraint to queue
   */
  queueConstraint(constraint: Constraint): void {
    this.constraintQueue.push(constraint);
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.nodes.size;
    const pruned = Array.from(this.nodes.values()).filter(n => n.pruned).length;
    const avgUtility = total > 0
      ? Array.from(this.nodes.values()).reduce((sum, n) => sum + n.utilityScore, 0) / total
      : 0;

    return {
      total,
      active: total - pruned,
      pruned,
      avgUtility,
    };
  }
}
