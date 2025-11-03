/**
 * Phase 19: Routing Engine
 * Intelligent agent selection and task routing
 */

import {
  Task,
  Agent,
  RoutingDecision,
  RoutingStrategy,
  RoutingMetrics,
  AgentStatus,
  TaskStatus,
  canHandleTask,
  isAgentAvailable,
  calculateTaskDuration,
  calculateWaitTime,
} from './taskTypes';

// ============================================================================
// Routing Strategies
// ============================================================================

export const ROUTING_STRATEGIES: Record<string, RoutingStrategy> = {
  ROUND_ROBIN: {
    name: 'Round Robin',
    description: 'Distributes tasks evenly across all available agents',
    priority: 1,
    evaluate: (task, agents) => {
      const available = agents.filter(isAgentAvailable).filter((a) => canHandleTask(a, task));

      if (available.length === 0) return null;

      // Select agent with lowest task count
      const selected = available.reduce((prev, curr) =>
        prev.currentLoad < curr.currentLoad ? prev : curr
      );

      return {
        taskId: task.id,
        selectedAgent: selected,
        confidence: 0.7,
        reasoning: 'Round-robin selection based on current load',
        alternativeAgents: available.filter((a) => a.id !== selected.id).slice(0, 3),
      };
    },
  },

  LOAD_BASED: {
    name: 'Load Based',
    description: 'Routes tasks to agents with lowest current load',
    priority: 2,
    evaluate: (task, agents) => {
      const capable = agents.filter((a) => canHandleTask(a, task));

      if (capable.length === 0) return null;

      // Calculate load scores
      const scored = capable.map((agent) => ({
        agent,
        score: calculateLoadScore(agent),
      }));

      // Sort by score (lower is better)
      scored.sort((a, b) => a.score - b.score);

      const selected = scored[0].agent;

      return {
        taskId: task.id,
        selectedAgent: selected,
        confidence: 0.85,
        reasoning: `Selected agent with load score ${scored[0].score.toFixed(2)}`,
        alternativeAgents: scored.slice(1, 4).map((s) => s.agent),
        estimatedDuration: task.estimatedDuration,
      };
    },
  },

  CAPABILITY_MATCH: {
    name: 'Capability Match',
    description: 'Matches tasks to agents based on capability alignment',
    priority: 3,
    evaluate: (task, agents) => {
      const capable = agents.filter((a) => canHandleTask(a, task));

      if (capable.length === 0) return null;

      // Calculate capability match scores
      const scored = capable.map((agent) => ({
        agent,
        score: calculateCapabilityScore(agent, task),
      }));

      // Sort by score (higher is better)
      scored.sort((a, b) => b.score - a.score);

      const selected = scored[0].agent;

      return {
        taskId: task.id,
        selectedAgent: selected,
        confidence: scored[0].score,
        reasoning: `Best capability match with score ${scored[0].score.toFixed(2)}`,
        alternativeAgents: scored.slice(1, 4).map((s) => s.agent),
        estimatedDuration: task.estimatedDuration,
      };
    },
  },

  PRIORITY_AWARE: {
    name: 'Priority Aware',
    description: 'Considers task priority when routing',
    priority: 4,
    evaluate: (task, agents) => {
      const capable = agents.filter((a) => canHandleTask(a, task));

      if (capable.length === 0) return null;

      // For high priority tasks, prefer agents with lower load
      // For low priority tasks, accept higher loads
      const priorityThreshold = task.priority >= 2 ? 0.5 : 0.8;

      const suitable = capable.filter((a) => a.currentLoad < priorityThreshold);

      if (suitable.length === 0) {
        // Fallback to any capable agent
        const fallback = capable[0];
        return {
          taskId: task.id,
          selectedAgent: fallback,
          confidence: 0.5,
          reasoning: 'No agents below priority threshold, using fallback',
        };
      }

      const selected = suitable.reduce((prev, curr) =>
        prev.currentLoad < curr.currentLoad ? prev : curr
      );

      return {
        taskId: task.id,
        selectedAgent: selected,
        confidence: 0.9,
        reasoning: `Priority-aware selection for priority ${task.priority}`,
        alternativeAgents: suitable.filter((a) => a.id !== selected.id).slice(0, 3),
      };
    },
  },

  SPECIALIZATION: {
    name: 'Specialization',
    description: 'Routes tasks to specialized agents when available',
    priority: 5,
    evaluate: (task, agents) => {
      const capable = agents.filter((a) => canHandleTask(a, task));

      if (capable.length === 0) return null;

      // Look for specialists for this task type
      const specialists = capable.filter((a) => {
        const taskTypeCapability = `task_${task.type.toLowerCase()}`;
        return a.capabilities.includes(taskTypeCapability);
      });

      const pool = specialists.length > 0 ? specialists : capable;

      const selected = pool.reduce((prev, curr) => {
        const prevScore = calculateSpecializationScore(prev, task);
        const currScore = calculateSpecializationScore(curr, task);
        return currScore > prevScore ? curr : prev;
      });

      return {
        taskId: task.id,
        selectedAgent: selected,
        confidence: specialists.length > 0 ? 0.95 : 0.75,
        reasoning: specialists.length > 0 ? 'Matched to specialist agent' : 'Using generalist agent',
        alternativeAgents: pool.filter((a) => a.id !== selected.id).slice(0, 3),
      };
    },
  },
};

// ============================================================================
// Routing Engine Class
// ============================================================================

export class RoutingEngine {
  private agents: Map<string, Agent>;
  private metrics: RoutingMetrics;
  private activeStrategy: string;

  constructor(initialAgents: Agent[] = [], strategy: string = 'LOAD_BASED') {
    this.agents = new Map(initialAgents.map((a) => [a.id, a]));
    this.activeStrategy = strategy;
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgCompletionTime: 0,
      avgWaitTime: 0,
      agentUtilization: {},
      successRate: 0,
    };
  }

  // ========================================================================
  // Agent Management
  // ========================================================================

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    console.log(`✅ Agent registered: ${agent.id} (${agent.type})`);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    console.log(`❌ Agent unregistered: ${agentId}`);
  }

  updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActive = Date.now();
    }
  }

  updateAgentLoad(agentId: string, load: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.currentLoad = Math.max(0, Math.min(1, load));
    }
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAvailableAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(isAgentAvailable);
  }

  // ========================================================================
  // Routing Operations
  // ========================================================================

  route(task: Task): RoutingDecision | null {
    const strategy = ROUTING_STRATEGIES[this.activeStrategy];

    if (!strategy) {
      console.error(`❌ Unknown routing strategy: ${this.activeStrategy}`);
      return null;
    }

    const agents = this.getAllAgents();
    const decision = strategy.evaluate(task, agents);

    if (decision) {
      console.log(
        `🎯 Task ${task.id} routed to agent ${decision.selectedAgent.id} (confidence: ${decision.confidence.toFixed(2)})`
      );
      this.metrics.totalTasks++;
    } else {
      console.warn(`⚠️ No suitable agent found for task ${task.id}`);
    }

    return decision;
  }

  tryMultipleStrategies(task: Task, strategyNames: string[]): RoutingDecision | null {
    for (const strategyName of strategyNames) {
      const strategy = ROUTING_STRATEGIES[strategyName];
      if (strategy) {
        const decision = strategy.evaluate(task, this.getAllAgents());
        if (decision) {
          console.log(`✅ Task routed using strategy: ${strategyName}`);
          return decision;
        }
      }
    }

    console.warn(`⚠️ All routing strategies failed for task ${task.id}`);
    return null;
  }

  setStrategy(strategyName: string): void {
    if (ROUTING_STRATEGIES[strategyName]) {
      this.activeStrategy = strategyName;
      console.log(`🔄 Routing strategy changed to: ${strategyName}`);
    } else {
      console.error(`❌ Unknown routing strategy: ${strategyName}`);
    }
  }

  // ========================================================================
  // Metrics Operations
  // ========================================================================

  recordTaskCompletion(task: Task, success: boolean): void {
    if (success) {
      this.metrics.completedTasks++;
    } else {
      this.metrics.failedTasks++;
    }

    // Update average completion time
    const duration = calculateTaskDuration(task);
    const totalCompleted = this.metrics.completedTasks + this.metrics.failedTasks;
    this.metrics.avgCompletionTime =
      (this.metrics.avgCompletionTime * (totalCompleted - 1) + duration) / totalCompleted;

    // Update average wait time
    const waitTime = calculateWaitTime(task);
    this.metrics.avgWaitTime =
      (this.metrics.avgWaitTime * (totalCompleted - 1) + waitTime) / totalCompleted;

    // Update success rate
    this.metrics.successRate = this.metrics.completedTasks / totalCompleted;

    // Update agent utilization
    if (task.assignedAgent) {
      const agent = this.agents.get(task.assignedAgent);
      if (agent) {
        this.metrics.agentUtilization[agent.id] =
          (this.metrics.agentUtilization[agent.id] || 0) + 1;
      }
    }
  }

  getMetrics(): RoutingMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgCompletionTime: 0,
      avgWaitTime: 0,
      agentUtilization: {},
      successRate: 0,
    };
  }

  // ========================================================================
  // Analytics Operations
  // ========================================================================

  getAgentUtilizationReport(): Record<string, number> {
    const report: Record<string, number> = {};

    this.agents.forEach((agent) => {
      report[agent.id] = agent.currentLoad;
    });

    return report;
  }

  getBottlenecks(): Agent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.currentLoad > 0.8);
  }

  getUnderutilizedAgents(): Agent[] {
    return Array.from(this.agents.values())
      .filter((agent) => agent.status === AgentStatus.IDLE && agent.currentLoad < 0.3);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateLoadScore(agent: Agent): number {
  // Lower score is better
  let score = agent.currentLoad;

  // Penalize offline or error agents heavily
  if (agent.status === AgentStatus.OFFLINE) score += 10;
  if (agent.status === AgentStatus.ERROR) score += 5;

  // Factor in last active time (prefer recently active agents)
  const timeSinceActive = Date.now() - agent.lastActive;
  const hoursSinceActive = timeSinceActive / (1000 * 60 * 60);
  score += hoursSinceActive * 0.1;

  return score;
}

function calculateCapabilityScore(agent: Agent, task: Task): number {
  // Higher score is better
  let score = 0;

  // Check required capabilities
  if (task.requirements.capabilities) {
    const matchedCapabilities = task.requirements.capabilities.filter((cap) =>
      agent.capabilities.includes(cap)
    );
    score += matchedCapabilities.length / task.requirements.capabilities.length;
  }

  // Bonus for having more capabilities
  score += agent.capabilities.length * 0.01;

  // Bonus for low load
  score += (1 - agent.currentLoad) * 0.3;

  return Math.min(1, score);
}

function calculateSpecializationScore(agent: Agent, task: Task): number {
  let score = 0;

  // Check for task-specific capability
  const taskTypeCapability = `task_${task.type.toLowerCase()}`;
  if (agent.capabilities.includes(taskTypeCapability)) {
    score += 0.5;
  }

  // Check for lab type match
  if (task.requirements.labTypes && agent.labTypes) {
    const matches = task.requirements.labTypes.filter((lt) => agent.labTypes!.includes(lt));
    score += (matches.length / task.requirements.labTypes.length) * 0.3;
  }

  // Bonus for low load
  score += (1 - agent.currentLoad) * 0.2;

  return score;
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const routingEngine = new RoutingEngine();

// ============================================================================
// Convenience Functions
// ============================================================================

export function routeTask(task: Task): RoutingDecision | null {
  return routingEngine.route(task);
}

export function registerAgent(agent: Agent): void {
  routingEngine.registerAgent(agent);
}

export function getRoutingMetrics(): RoutingMetrics {
  return routingEngine.getMetrics();
}
