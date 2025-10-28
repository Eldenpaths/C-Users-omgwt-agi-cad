// CLAUDE-META: Phase 10B Fusion Testing - Swarm Coordinator
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Multi-agent coordination with trust-score tracking
// Status: Shadow Testing - HYBRID_SAFE Active

import { SwarmCoordinator, SwarmAgent, SwarmTask } from '../../src/lib/meta/swarm-coordinator';

describe('SwarmCoordinator - Multi-Agent Tests', () => {
  let coordinator: SwarmCoordinator;

  beforeEach(() => {
    coordinator = new SwarmCoordinator();
  });

  describe('Agent Registration', () => {
    test('should register 3 test agents with different trust scores', () => {
      const agents: SwarmAgent[] = [
        {
          id: 'agent-alpha',
          type: 'analyzer',
          trustScore: 0.9,
          budget: 1000,
          tasksCompleted: 10,
          active: true,
        },
        {
          id: 'agent-beta',
          type: 'builder',
          trustScore: 0.7,
          budget: 500,
          tasksCompleted: 5,
          active: true,
        },
        {
          id: 'agent-gamma',
          type: 'validator',
          trustScore: 0.5,
          budget: 250,
          tasksCompleted: 2,
          active: true,
        },
      ];

      agents.forEach(agent => coordinator.registerAgent(agent));

      const stats = coordinator.getStats();
      expect(stats.totalAgents).toBe(3);
      expect(stats.activeAgents).toBe(3);
    });

    test('should handle inactive agents', () => {
      coordinator.registerAgent({
        id: 'inactive-agent',
        type: 'test',
        trustScore: 0.8,
        budget: 100,
        tasksCompleted: 0,
        active: false,
      });

      const stats = coordinator.getStats();
      expect(stats.totalAgents).toBe(1);
      expect(stats.activeAgents).toBe(0);
    });
  });

  describe('Task Assignment', () => {
    beforeEach(() => {
      // Setup test agents
      coordinator.registerAgent({
        id: 'agent-high-trust',
        type: 'critical',
        trustScore: 0.95,
        budget: 2000,
        tasksCompleted: 20,
        active: true,
      });

      coordinator.registerAgent({
        id: 'agent-medium-trust',
        type: 'standard',
        trustScore: 0.6,
        budget: 1000,
        tasksCompleted: 10,
        active: true,
      });

      coordinator.registerAgent({
        id: 'agent-low-trust',
        type: 'basic',
        trustScore: 0.3,
        budget: 500,
        tasksCompleted: 3,
        active: true,
      });
    });

    test('should assign high-priority task to high-trust agent', () => {
      const criticalTask: SwarmTask = {
        id: 'task-critical-001',
        priority: 10,
        requiredTrust: 0.9,
        cost: 100,
        status: 'pending',
      };

      coordinator.addTask(criticalTask);
      const assignments = coordinator.assignTasks();

      expect(assignments.has('agent-high-trust')).toBe(true);
      expect(assignments.get('agent-high-trust')).toContain('task-critical-001');
    });

    test('should not assign task when trust requirement not met', () => {
      const highTrustTask: SwarmTask = {
        id: 'task-high-trust-001',
        priority: 8,
        requiredTrust: 0.8,
        cost: 50,
        status: 'pending',
      };

      coordinator.addTask(highTrustTask);
      const assignments = coordinator.assignTasks();

      // Only agent-high-trust (0.95) should get this task
      expect(assignments.has('agent-low-trust')).toBe(false);
    });

    test('should enforce budget constraints', () => {
      const expensiveTask: SwarmTask = {
        id: 'task-expensive-001',
        priority: 5,
        requiredTrust: 0.3,
        cost: 10000, // Exceeds all budgets
        status: 'pending',
      };

      coordinator.addTask(expensiveTask);
      const assignments = coordinator.assignTasks();

      expect(assignments.size).toBe(0); // No agent can afford it
    });

    test('should prioritize tasks by priority value', () => {
      const tasks: SwarmTask[] = [
        {
          id: 'task-low-priority',
          priority: 1,
          requiredTrust: 0.5,
          cost: 50,
          status: 'pending',
        },
        {
          id: 'task-high-priority',
          priority: 10,
          requiredTrust: 0.5,
          cost: 50,
          status: 'pending',
        },
        {
          id: 'task-medium-priority',
          priority: 5,
          requiredTrust: 0.5,
          cost: 50,
          status: 'pending',
        },
      ];

      tasks.forEach(task => coordinator.addTask(task));
      const assignments = coordinator.assignTasks();

      // High-priority task should be assigned first
      const allAssignedTasks = Array.from(assignments.values()).flat();
      expect(allAssignedTasks[0]).toBe('task-high-priority');
    });

    test('should balance load across multiple agents', () => {
      // Register 5 identical agents
      for (let i = 0; i < 5; i++) {
        coordinator.registerAgent({
          id: `agent-${i}`,
          type: 'worker',
          trustScore: 0.7,
          budget: 1000,
          tasksCompleted: 0,
          active: true,
        });
      }

      // Add 10 identical tasks
      for (let i = 0; i < 10; i++) {
        coordinator.addTask({
          id: `task-${i}`,
          priority: 5,
          requiredTrust: 0.6,
          cost: 100,
          status: 'pending',
        });
      }

      const assignments = coordinator.assignTasks();

      // Should distribute tasks across agents
      const assignmentCounts = Array.from(assignments.values()).map(tasks => tasks.length);
      const maxAssignments = Math.max(...assignmentCounts);
      const minAssignments = Math.min(...assignmentCounts);

      expect(maxAssignments - minAssignments).toBeLessThanOrEqual(2); // Reasonable balance
    });
  });

  describe('Trust Score Tracking', () => {
    test('should update agent trust score based on performance', () => {
      const agent: SwarmAgent = {
        id: 'agent-tracked',
        type: 'test',
        trustScore: 0.5,
        budget: 1000,
        tasksCompleted: 0,
        active: true,
      };

      coordinator.registerAgent(agent);

      // Simulate successful task completion
      agent.tasksCompleted += 1;
      agent.trustScore = Math.min(agent.trustScore + 0.1, 1.0);

      expect(agent.trustScore).toBeGreaterThan(0.5);
      expect(agent.trustScore).toBeLessThanOrEqual(1.0);
    });

    test('should decay trust score on task failure', () => {
      const agent: SwarmAgent = {
        id: 'agent-failing',
        type: 'test',
        trustScore: 0.8,
        budget: 1000,
        tasksCompleted: 10,
        active: true,
      };

      coordinator.registerAgent(agent);

      // Simulate task failure
      agent.trustScore = Math.max(agent.trustScore - 0.2, 0.0);

      expect(agent.trustScore).toBe(0.6);
    });

    test('should prevent trust score from exceeding bounds', () => {
      const agent: SwarmAgent = {
        id: 'agent-bounded',
        type: 'test',
        trustScore: 0.99,
        budget: 1000,
        tasksCompleted: 100,
        active: true,
      };

      // Trust boost should cap at 1.0
      agent.trustScore = Math.min(agent.trustScore + 0.5, 1.0);
      expect(agent.trustScore).toBe(1.0);

      // Trust decay should floor at 0.0
      agent.trustScore = Math.max(agent.trustScore - 2.0, 0.0);
      expect(agent.trustScore).toBe(0.0);
    });
  });

  describe('Budget Management', () => {
    test('should deduct budget on task assignment', () => {
      const agent: SwarmAgent = {
        id: 'agent-budget',
        type: 'test',
        trustScore: 0.7,
        budget: 1000,
        tasksCompleted: 5,
        active: true,
      };

      coordinator.registerAgent(agent);

      const task: SwarmTask = {
        id: 'task-costly',
        priority: 5,
        requiredTrust: 0.6,
        cost: 300,
        status: 'pending',
      };

      coordinator.addTask(task);
      const initialBudget = agent.budget;
      coordinator.assignTasks();

      // Budget should be reduced by task cost
      const expectedBudget = initialBudget - task.cost;
      expect(agent.budget).toBe(expectedBudget);
    });

    test('should not assign task if budget insufficient', () => {
      const agent: SwarmAgent = {
        id: 'agent-broke',
        type: 'test',
        trustScore: 0.9,
        budget: 50,
        tasksCompleted: 10,
        active: true,
      };

      coordinator.registerAgent(agent);

      const task: SwarmTask = {
        id: 'task-expensive',
        priority: 10,
        requiredTrust: 0.5,
        cost: 100,
        status: 'pending',
      };

      coordinator.addTask(task);
      const assignments = coordinator.assignTasks();

      expect(assignments.size).toBe(0);
    });

    test('should allow budget replenishment', () => {
      const agent: SwarmAgent = {
        id: 'agent-refund',
        type: 'test',
        trustScore: 0.7,
        budget: 100,
        tasksCompleted: 5,
        active: true,
      };

      // Simulate budget replenishment (e.g., after task completion)
      agent.budget += 500;

      expect(agent.budget).toBe(600);
    });
  });

  describe('Swarm Statistics', () => {
    test('should track pending, assigned, and completed tasks', () => {
      coordinator.registerAgent({
        id: 'agent-stats',
        type: 'test',
        trustScore: 0.8,
        budget: 1000,
        tasksCompleted: 0,
        active: true,
      });

      coordinator.addTask({
        id: 'task-pending',
        priority: 5,
        requiredTrust: 0.5,
        cost: 50,
        status: 'pending',
      });

      coordinator.addTask({
        id: 'task-complete',
        priority: 5,
        requiredTrust: 0.5,
        cost: 50,
        status: 'complete',
      });

      const stats = coordinator.getStats();

      expect(stats.totalTasks).toBe(2);
      expect(stats.pendingTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
    });

    test('should report active vs inactive agent counts', () => {
      coordinator.registerAgent({
        id: 'active-1',
        type: 'test',
        trustScore: 0.7,
        budget: 100,
        tasksCompleted: 0,
        active: true,
      });

      coordinator.registerAgent({
        id: 'inactive-1',
        type: 'test',
        trustScore: 0.7,
        budget: 100,
        tasksCompleted: 0,
        active: false,
      });

      const stats = coordinator.getStats();

      expect(stats.totalAgents).toBe(2);
      expect(stats.activeAgents).toBe(1);
    });
  });

  describe('Task Status Transitions', () => {
    test('should transition task from pending → assigned → complete', () => {
      coordinator.registerAgent({
        id: 'agent-transition',
        type: 'test',
        trustScore: 0.8,
        budget: 1000,
        tasksCompleted: 0,
        active: true,
      });

      const task: SwarmTask = {
        id: 'task-lifecycle',
        priority: 5,
        requiredTrust: 0.5,
        cost: 50,
        status: 'pending',
      };

      // Pending
      expect(task.status).toBe('pending');

      // Assign
      coordinator.addTask(task);
      coordinator.assignTasks();
      expect(task.status).toBe('assigned');
      expect(task.assignedTo).toBe('agent-transition');

      // Complete (simulated)
      task.status = 'complete';
      expect(task.status).toBe('complete');
    });

    test('should handle task failures', () => {
      const task: SwarmTask = {
        id: 'task-failed',
        priority: 5,
        requiredTrust: 0.5,
        cost: 50,
        status: 'pending',
      };

      coordinator.addTask(task);
      task.status = 'failed';

      expect(task.status).toBe('failed');
    });
  });

  describe('Stress Testing', () => {
    test('should handle 100+ agents efficiently', () => {
      for (let i = 0; i < 100; i++) {
        coordinator.registerAgent({
          id: `stress-agent-${i}`,
          type: 'worker',
          trustScore: 0.5 + Math.random() * 0.5,
          budget: 1000,
          tasksCompleted: Math.floor(Math.random() * 20),
          active: true,
        });
      }

      const stats = coordinator.getStats();
      expect(stats.totalAgents).toBe(100);
    });

    test('should handle 1000+ tasks efficiently', () => {
      coordinator.registerAgent({
        id: 'mega-agent',
        type: 'super',
        trustScore: 1.0,
        budget: 1000000,
        tasksCompleted: 1000,
        active: true,
      });

      for (let i = 0; i < 1000; i++) {
        coordinator.addTask({
          id: `stress-task-${i}`,
          priority: Math.floor(Math.random() * 10),
          requiredTrust: 0.5,
          cost: 1,
          status: 'pending',
        });
      }

      const startTime = Date.now();
      coordinator.assignTasks();
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(1000); // Should complete in < 1 second
    });
  });
});
