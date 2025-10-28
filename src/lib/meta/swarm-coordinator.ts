// CLAUDE-META: Phase 10 Leapfrog - Swarm Coordinator
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Multi-agent scheduler with budget & trust governance
// Status: Production - Hybrid Safe Mode Active

export type SwarmAgent = {
  id: string;
  type: string;
  trustScore: number; // 0-1 (Bayesian posterior)
  budget: number;
  tasksCompleted: number;
  active: boolean;
  // Phase 10D: Bayesian trust scoring
  successCount: number; // α - 1 (alpha pseudo-count)
  failureCount: number; // β - 1 (beta pseudo-count)
  driftHistory: number[]; // Recent drift scores for this agent
};

export type SwarmTask = {
  id: string;
  priority: number;
  requiredTrust: number;
  cost: number;
  assignedTo?: string;
  status: "pending" | "assigned" | "complete" | "failed";
};

/**
 * Swarm Coordinator
 * Lightweight multi-agent task scheduler
 */
export class SwarmCoordinator {
  private agents = new Map<string, SwarmAgent>();
  private tasks: SwarmTask[] = [];

  /**
   * Register agent
   */
  registerAgent(agent: SwarmAgent): void {
    // Phase 10D: Initialize Bayesian trust properties if not present
    if (agent.successCount === undefined) agent.successCount = 0;
    if (agent.failureCount === undefined) agent.failureCount = 0;
    if (agent.driftHistory === undefined) agent.driftHistory = [];

    this.agents.set(agent.id, agent);
    console.log(`[Swarm] Registered agent ${agent.id} with trust ${agent.trustScore.toFixed(2)}`);
  }

  /**
   * Add task
   */
  addTask(task: SwarmTask): void {
    this.tasks.push(task);
  }

  /**
   * Assign tasks to agents
   */
  assignTasks(): Map<string, string[]> {
    const assignments = new Map<string, string[]>();

    // Sort tasks by priority
    const pendingTasks = this.tasks.filter(t => t.status === "pending").sort((a, b) => b.priority - a.priority);

    for (const task of pendingTasks) {
      // Find suitable agent
      const agent = this.findSuitableAgent(task);

      if (agent && agent.budget >= task.cost) {
        task.assignedTo = agent.id;
        task.status = "assigned";
        agent.budget -= task.cost;

        if (!assignments.has(agent.id)) {
          assignments.set(agent.id, []);
        }
        assignments.get(agent.id)!.push(task.id);
      }
    }

    return assignments;
  }

  /**
   * Find suitable agent for task
   */
  private findSuitableAgent(task: SwarmTask): SwarmAgent | null {
    let bestAgent: SwarmAgent | null = null;
    let bestScore = -1;

    for (const agent of this.agents.values()) {
      if (!agent.active) continue;
      if (agent.trustScore < task.requiredTrust) continue;
      if (agent.budget < task.cost) continue;

      // Score = trust * budget / tasksCompleted
      const score = agent.trustScore * agent.budget / (agent.tasksCompleted + 1);

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Get swarm statistics
   */
  getStats() {
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.active).length,
      totalTasks: this.tasks.length,
      pendingTasks: this.tasks.filter(t => t.status === "pending").length,
      completedTasks: this.tasks.filter(t => t.status === "complete").length,
    };
  }

  /**
   * Phase 10D: Update agent trust using Bayesian inference
   * Uses Beta distribution: trust = α / (α + β)
   */
  updateTrustScore(agentId: string, taskSuccess: boolean, driftScore?: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn(`[Swarm] Agent ${agentId} not found for trust update`);
      return;
    }

    // Update success/failure counts
    if (taskSuccess) {
      agent.successCount++;
    } else {
      agent.failureCount++;
    }

    // Bayesian posterior using Beta distribution
    const alpha = agent.successCount + 1; // Prior pseudo-count
    const beta = agent.failureCount + 1;
    const bayesianTrust = alpha / (alpha + beta);

    // Incorporate drift penalty if provided
    let finalTrust = bayesianTrust;
    if (driftScore !== undefined) {
      agent.driftHistory.push(driftScore);

      // Keep only last 10 drift scores
      if (agent.driftHistory.length > 10) {
        agent.driftHistory.shift();
      }

      // Average drift penalty: higher drift = lower trust
      const avgDrift = agent.driftHistory.reduce((sum, d) => sum + d, 0) / agent.driftHistory.length;
      const driftPenalty = Math.min(avgDrift, 0.3); // Cap drift penalty at 0.3
      finalTrust = Math.max(0, bayesianTrust - driftPenalty);
    }

    // Update agent trust score
    const oldTrust = agent.trustScore;
    agent.trustScore = finalTrust;

    console.log(
      `[Swarm] Agent ${agentId} trust updated: ${oldTrust.toFixed(3)} → ${finalTrust.toFixed(3)} ` +
      `(${taskSuccess ? '✓' : '✗'} success, α=${alpha}, β=${beta}${driftScore ? `, drift=${driftScore.toFixed(3)}` : ''})`
    );
  }

  /**
   * Phase 10D: Mark task as complete or failed
   */
  completeTask(taskId: string, success: boolean): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn(`[Swarm] Task ${taskId} not found`);
      return;
    }

    task.status = success ? "complete" : "failed";

    if (task.assignedTo) {
      // Update agent stats
      const agent = this.agents.get(task.assignedTo);
      if (agent) {
        if (success) {
          agent.tasksCompleted++;
        }

        // Update Bayesian trust
        this.updateTrustScore(task.assignedTo, success);
      }
    }

    console.log(`[Swarm] Task ${taskId} ${success ? 'completed' : 'failed'} by ${task.assignedTo}`);
  }

  /**
   * Phase 10D: Record drift for an agent (from self-modifier)
   */
  recordAgentDrift(agentId: string, driftScore: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn(`[Swarm] Agent ${agentId} not found for drift recording`);
      return;
    }

    agent.driftHistory.push(driftScore);

    // Keep only last 10 drift scores
    if (agent.driftHistory.length > 10) {
      agent.driftHistory.shift();
    }

    // Recalculate trust with drift penalty
    const alpha = agent.successCount + 1;
    const beta = agent.failureCount + 1;
    const bayesianTrust = alpha / (alpha + beta);

    const avgDrift = agent.driftHistory.reduce((sum, d) => sum + d, 0) / agent.driftHistory.length;
    const driftPenalty = Math.min(avgDrift, 0.3);
    const newTrust = Math.max(0, bayesianTrust - driftPenalty);

    const oldTrust = agent.trustScore;
    agent.trustScore = newTrust;

    console.log(
      `[Swarm] Agent ${agentId} drift recorded: ${driftScore.toFixed(3)}, ` +
      `avg drift: ${avgDrift.toFixed(3)}, trust: ${oldTrust.toFixed(3)} → ${newTrust.toFixed(3)}`
    );
  }

  /**
   * Phase 10D: Get agent trust details
   */
  getAgentTrustDetails(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const alpha = agent.successCount + 1;
    const beta = agent.failureCount + 1;
    const totalAttempts = agent.successCount + agent.failureCount;
    const successRate = totalAttempts > 0 ? agent.successCount / totalAttempts : 0;
    const avgDrift = agent.driftHistory.length > 0
      ? agent.driftHistory.reduce((sum, d) => sum + d, 0) / agent.driftHistory.length
      : 0;

    return {
      agentId: agent.id,
      currentTrust: agent.trustScore,
      successCount: agent.successCount,
      failureCount: agent.failureCount,
      successRate,
      alpha,
      beta,
      avgDrift,
      driftHistory: [...agent.driftHistory],
    };
  }
}
