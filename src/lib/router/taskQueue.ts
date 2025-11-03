/**
 * Phase 19: Task Queue
 * Priority queue and task management system
 */

import {
  Task,
  TaskQueue,
  TaskStatus,
  TaskPriority,
  TaskEvent,
  TaskEventType,
  QueueStatistics,
  isTaskActive,
  isTaskComplete,
  isTaskFailed,
  calculateWaitTime,
  calculateTaskDuration,
} from './taskTypes';

// ============================================================================
// Task Queue Manager
// ============================================================================

export class TaskQueueManager {
  private queues: Map<string, TaskQueue>;
  private tasks: Map<string, Task>;
  private events: TaskEvent[];
  private maxEventHistory: number;

  constructor() {
    this.queues = new Map();
    this.tasks = new Map();
    this.events = [];
    this.maxEventHistory = 1000;

    // Create default queue
    this.createQueue('default', 'Default Queue', 'PRIORITY');
  }

  // ========================================================================
  // Queue Management
  // ========================================================================

  createQueue(
    id: string,
    name: string,
    strategy: 'FIFO' | 'LIFO' | 'PRIORITY' | 'DEADLINE' = 'PRIORITY',
    maxSize: number = 1000
  ): TaskQueue {
    const queue: TaskQueue = {
      id,
      name,
      description: `Queue using ${strategy} strategy`,
      tasks: [],
      maxSize,
      priority: TaskPriority.NORMAL,
      processingStrategy: strategy,
    };

    this.queues.set(id, queue);
    console.log(`✅ Queue created: ${id} (${strategy})`);
    return queue;
  }

  getQueue(queueId: string): TaskQueue | undefined {
    return this.queues.get(queueId);
  }

  deleteQueue(queueId: string): boolean {
    return this.queues.delete(queueId);
  }

  // ========================================================================
  // Task Operations
  // ========================================================================

  enqueue(task: Task, queueId: string = 'default'): boolean {
    const queue = this.queues.get(queueId);

    if (!queue) {
      console.error(`❌ Queue not found: ${queueId}`);
      return false;
    }

    if (queue.tasks.length >= queue.maxSize) {
      console.error(`❌ Queue full: ${queueId}`);
      return false;
    }

    // Update task status
    task.status = TaskStatus.QUEUED;

    // Add to queue
    queue.tasks.push(task);
    this.tasks.set(task.id, task);

    // Sort queue based on strategy
    this.sortQueue(queue);

    // Log event
    this.logEvent({
      id: this.generateEventId(),
      taskId: task.id,
      type: TaskEventType.QUEUED,
      timestamp: Date.now(),
      data: { queueId },
    });

    console.log(`📥 Task ${task.id} enqueued to ${queueId}`);
    return true;
  }

  dequeue(queueId: string = 'default'): Task | null {
    const queue = this.queues.get(queueId);

    if (!queue || queue.tasks.length === 0) {
      return null;
    }

    const task = queue.tasks.shift()!;
    console.log(`📤 Task ${task.id} dequeued from ${queueId}`);
    return task;
  }

  peek(queueId: string = 'default'): Task | null {
    const queue = this.queues.get(queueId);
    return queue && queue.tasks.length > 0 ? queue.tasks[0] : null;
  }

  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);

    if (!task) {
      return false;
    }

    // Remove from all queues
    this.queues.forEach((queue) => {
      const index = queue.tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        queue.tasks.splice(index, 1);
      }
    });

    this.tasks.delete(taskId);
    console.log(`🗑️ Task ${taskId} removed from queue`);
    return true;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  // ========================================================================
  // Task Status Updates
  // ========================================================================

  updateTaskStatus(taskId: string, status: TaskStatus, agentId?: string): void {
    const task = this.tasks.get(taskId);

    if (!task) {
      console.error(`❌ Task not found: ${taskId}`);
      return;
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === TaskStatus.IN_PROGRESS) {
      task.startedAt = Date.now();
      task.assignedAgent = agentId;
    } else if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      task.completedAt = Date.now();
      task.actualDuration = calculateTaskDuration(task);
    }

    // Log event
    const eventType = this.getEventTypeFromStatus(status);
    this.logEvent({
      id: this.generateEventId(),
      taskId,
      type: eventType,
      timestamp: Date.now(),
      agentId,
      data: { oldStatus, newStatus: status },
    });

    console.log(`🔄 Task ${taskId}: ${oldStatus} → ${status}`);
  }

  completeTask(taskId: string, output: any): void {
    const task = this.tasks.get(taskId);

    if (!task) {
      return;
    }

    task.output = output;
    this.updateTaskStatus(taskId, TaskStatus.COMPLETED);
  }

  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);

    if (!task) {
      return;
    }

    task.metadata = {
      ...task.metadata,
      error,
    };

    this.updateTaskStatus(taskId, TaskStatus.FAILED);
  }

  // ========================================================================
  // Queue Operations
  // ========================================================================

  private sortQueue(queue: TaskQueue): void {
    switch (queue.processingStrategy) {
      case 'FIFO':
        // Natural order
        break;

      case 'LIFO':
        queue.tasks.reverse();
        break;

      case 'PRIORITY':
        queue.tasks.sort((a, b) => b.priority - a.priority);
        break;

      case 'DEADLINE':
        queue.tasks.sort((a, b) => {
          const deadlineA = a.metadata?.deadline || Infinity;
          const deadlineB = b.metadata?.deadline || Infinity;
          return deadlineA - deadlineB;
        });
        break;
    }
  }

  // ========================================================================
  // Statistics
  // ========================================================================

  getQueueStatistics(queueId: string): QueueStatistics | null {
    const queue = this.queues.get(queueId);

    if (!queue) {
      return null;
    }

    const pending = queue.tasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const inProgress = queue.tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = queue.tasks.filter(isTaskComplete).length;
    const failed = queue.tasks.filter(isTaskFailed).length;

    // Calculate averages
    const waitTimes = queue.tasks.filter((t) => t.startedAt).map(calculateWaitTime);
    const avgWaitTime =
      waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;

    const durations = queue.tasks.filter((t) => t.actualDuration).map((t) => t.actualDuration!);
    const avgProcessingTime =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      queueId,
      size: queue.tasks.length,
      pendingCount: pending,
      inProgressCount: inProgress,
      completedCount: completed,
      failedCount: failed,
      avgWaitTime,
      avgProcessingTime,
    };
  }

  getAllStatistics(): Record<string, QueueStatistics> {
    const stats: Record<string, QueueStatistics> = {};

    this.queues.forEach((queue) => {
      const queueStats = this.getQueueStatistics(queue.id);
      if (queueStats) {
        stats[queue.id] = queueStats;
      }
    });

    return stats;
  }

  // ========================================================================
  // Event Management
  // ========================================================================

  private logEvent(event: TaskEvent): void {
    this.events.push(event);

    // Trim event history
    if (this.events.length > this.maxEventHistory) {
      this.events = this.events.slice(-this.maxEventHistory);
    }
  }

  getEvents(taskId?: string, limit: number = 100): TaskEvent[] {
    let filtered = this.events;

    if (taskId) {
      filtered = this.events.filter((e) => e.taskId === taskId);
    }

    return filtered.slice(-limit);
  }

  private getEventTypeFromStatus(status: TaskStatus): TaskEventType {
    switch (status) {
      case TaskStatus.QUEUED:
        return TaskEventType.QUEUED;
      case TaskStatus.ASSIGNED:
        return TaskEventType.ASSIGNED;
      case TaskStatus.IN_PROGRESS:
        return TaskEventType.STARTED;
      case TaskStatus.COMPLETED:
        return TaskEventType.COMPLETED;
      case TaskStatus.FAILED:
        return TaskEventType.FAILED;
      case TaskStatus.CANCELLED:
        return TaskEventType.CANCELLED;
      default:
        return TaskEventType.PROGRESS;
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========================================================================
  // Cleanup Operations
  // ========================================================================

  cleanupCompleted(olderThan: number = 3600000): number {
    // Remove tasks completed more than 1 hour ago
    const cutoff = Date.now() - olderThan;
    let removed = 0;

    this.tasks.forEach((task, taskId) => {
      if (
        (isTaskComplete(task) || isTaskFailed(task)) &&
        task.completedAt &&
        task.completedAt < cutoff
      ) {
        this.removeTask(taskId);
        removed++;
      }
    });

    console.log(`🧹 Cleaned up ${removed} completed tasks`);
    return removed;
  }

  clear(): void {
    this.queues.clear();
    this.tasks.clear();
    this.events = [];
    this.createQueue('default', 'Default Queue', 'PRIORITY');
    console.log(`🧹 All queues cleared`);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const taskQueueManager = new TaskQueueManager();

// ============================================================================
// Convenience Functions
// ============================================================================

export function enqueueTask(task: Task, queueId?: string): boolean {
  return taskQueueManager.enqueue(task, queueId);
}

export function dequeueTask(queueId?: string): Task | null {
  return taskQueueManager.dequeue(queueId);
}

export function getTask(taskId: string): Task | undefined {
  return taskQueueManager.getTask(taskId);
}

export function updateTaskStatus(taskId: string, status: TaskStatus, agentId?: string): void {
  taskQueueManager.updateTaskStatus(taskId, status, agentId);
}

export function getQueueStats(queueId: string): QueueStatistics | null {
  return taskQueueManager.getQueueStatistics(queueId);
}
