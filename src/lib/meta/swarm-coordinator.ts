// CLAUDE-META: Phase 10 Leapfrog - Swarm Coordinator
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Multi-agent scheduler with budget & trust governance
// Status: Production - Hybrid Safe Mode Active

export type SwarmAgent = {
  id: string;
  type: string;
  trustScore: number; // 0-1
  budget: number;
  tasksCompleted: number;
  active: boolean;
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
}
