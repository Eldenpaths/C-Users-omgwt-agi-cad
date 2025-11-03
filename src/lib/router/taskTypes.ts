/**
 * Phase 19: Task Routing Types
 * Multi-agent task coordination and routing interfaces
 */

import { LabType } from '../glyph/schema';

// ============================================================================
// Agent Types
// ============================================================================

export enum AgentType {
  DESIGNER = 'DESIGNER',
  ANALYZER = 'ANALYZER',
  OPTIMIZER = 'OPTIMIZER',
  VALIDATOR = 'VALIDATOR',
  SYNTHESIZER = 'SYNTHESIZER',
  ARCHIVIST = 'ARCHIVIST',
  ORCHESTRATOR = 'ORCHESTRATOR',
  SPECIALIST = 'SPECIALIST',
}

export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  status: AgentStatus;
  capabilities: string[];
  labTypes?: LabType[];
  currentLoad: number; // 0-1
  maxLoad: number;
  lastActive: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Task Types
// ============================================================================

export enum TaskType {
  DESIGN = 'DESIGN',
  ANALYSIS = 'ANALYSIS',
  OPTIMIZATION = 'OPTIMIZATION',
  VALIDATION = 'VALIDATION',
  SYNTHESIS = 'SYNTHESIS',
  RECOVERY = 'RECOVERY',
  COMPUTATION = 'COMPUTATION',
  CUSTOM = 'CUSTOM',
}

export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum TaskStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  description: string;
  input: TaskInput;
  output?: TaskOutput;
  requirements: TaskRequirements;
  assignedAgent?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface TaskInput {
  type: string;
  data: any;
  format?: string;
  schema?: any;
}

export interface TaskOutput {
  type: string;
  data: any;
  format?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface TaskRequirements {
  agentType?: AgentType | AgentType[];
  capabilities?: string[];
  labTypes?: LabType[];
  minMemory?: number;
  minCPU?: number;
  timeout?: number;
  retryLimit?: number;
}

// ============================================================================
// Routing Types
// ============================================================================

export interface RoutingDecision {
  taskId: string;
  selectedAgent: Agent;
  confidence: number; // 0-1
  reasoning: string;
  alternativeAgents?: Agent[];
  estimatedDuration?: number;
}

export interface RoutingStrategy {
  name: string;
  description: string;
  evaluate: (task: Task, agents: Agent[]) => RoutingDecision | null;
  priority: number;
}

export interface RoutingMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgCompletionTime: number;
  avgWaitTime: number;
  agentUtilization: Record<string, number>;
  successRate: number;
}

// ============================================================================
// Queue Types
// ============================================================================

export interface TaskQueue {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  maxSize: number;
  priority: TaskPriority;
  processingStrategy: 'FIFO' | 'LIFO' | 'PRIORITY' | 'DEADLINE';
}

export interface QueueStatistics {
  queueId: string;
  size: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  failedCount: number;
  avgWaitTime: number;
  avgProcessingTime: number;
}

// ============================================================================
// Event Types
// ============================================================================

export enum TaskEventType {
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  STARTED = 'STARTED',
  PROGRESS = 'PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRY = 'RETRY',
}

export interface TaskEvent {
  id: string;
  taskId: string;
  type: TaskEventType;
  timestamp: number;
  agentId?: string;
  data?: any;
  error?: string;
}

// ============================================================================
// Workflow Types
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: WorkflowTask[];
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
}

export interface WorkflowTask {
  taskId: string;
  dependencies: string[];
  parallel: boolean;
  optional: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
}

// ============================================================================
// Load Balancing Types
// ============================================================================

export interface LoadBalancingStrategy {
  name: string;
  selectAgent: (agents: Agent[], task: Task) => Agent | null;
}

export interface AgentLoad {
  agentId: string;
  currentTasks: number;
  cpuUsage: number;
  memoryUsage: number;
  queueLength: number;
  responsiveness: number; // 0-1
}

// ============================================================================
// Monitoring Types
// ============================================================================

export interface TaskMonitor {
  taskId: string;
  startTime: number;
  checkpoints: TaskCheckpoint[];
  metrics: TaskMetrics;
}

export interface TaskCheckpoint {
  timestamp: number;
  progress: number; // 0-1
  status: TaskStatus;
  message?: string;
  data?: any;
}

export interface TaskMetrics {
  cpuTime: number;
  memoryPeak: number;
  ioOperations: number;
  networkCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

// ============================================================================
// Coordination Types
// ============================================================================

export interface TaskCoordinator {
  id: string;
  name: string;
  activeTasks: Map<string, Task>;
  agents: Map<string, Agent>;
  queues: Map<string, TaskQueue>;
}

export interface CoordinationEvent {
  type: 'TASK_REASSIGNED' | 'AGENT_FAILED' | 'QUEUE_OVERFLOW' | 'DEADLOCK_DETECTED';
  timestamp: number;
  data: any;
}

// ============================================================================
// Error Types
// ============================================================================

export interface TaskError {
  taskId: string;
  code: string;
  message: string;
  stack?: string;
  timestamp: number;
  recoverable: boolean;
  retryCount: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface RouterConfig {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  defaultRetryLimit: number;
  queueCapacity: number;
  loadBalancingStrategy: string;
  routingStrategy: string;
  enableMetrics: boolean;
  enableLogging: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isTaskComplete(task: Task): boolean {
  return task.status === TaskStatus.COMPLETED;
}

export function isTaskFailed(task: Task): boolean {
  return task.status === TaskStatus.FAILED;
}

export function isTaskActive(task: Task): boolean {
  return (
    task.status === TaskStatus.IN_PROGRESS ||
    task.status === TaskStatus.ASSIGNED ||
    task.status === TaskStatus.QUEUED
  );
}

export function isAgentAvailable(agent: Agent): boolean {
  return (
    agent.status === AgentStatus.IDLE &&
    agent.currentLoad < agent.maxLoad
  );
}

export function canHandleTask(agent: Agent, task: Task): boolean {
  // Check agent type
  if (task.requirements.agentType) {
    const requiredTypes = Array.isArray(task.requirements.agentType)
      ? task.requirements.agentType
      : [task.requirements.agentType];

    if (!requiredTypes.includes(agent.type)) {
      return false;
    }
  }

  // Check capabilities
  if (task.requirements.capabilities && task.requirements.capabilities.length > 0) {
    const hasAllCapabilities = task.requirements.capabilities.every((cap) =>
      agent.capabilities.includes(cap)
    );

    if (!hasAllCapabilities) {
      return false;
    }
  }

  // Check lab types
  if (task.requirements.labTypes && task.requirements.labTypes.length > 0 && agent.labTypes) {
    const hasLabType = task.requirements.labTypes.some((labType) =>
      agent.labTypes!.includes(labType)
    );

    if (!hasLabType) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function calculateTaskDuration(task: Task): number {
  if (task.completedAt && task.startedAt) {
    return task.completedAt - task.startedAt;
  }
  if (task.startedAt) {
    return Date.now() - task.startedAt;
  }
  return 0;
}

export function calculateWaitTime(task: Task): number {
  if (task.startedAt) {
    return task.startedAt - task.createdAt;
  }
  return Date.now() - task.createdAt;
}

export function getTaskProgress(task: Task, monitor?: TaskMonitor): number {
  if (isTaskComplete(task)) return 1.0;
  if (isTaskFailed(task)) return 0.0;

  if (monitor && monitor.checkpoints.length > 0) {
    return monitor.checkpoints[monitor.checkpoints.length - 1].progress;
  }

  if (task.status === TaskStatus.IN_PROGRESS) {
    // Estimate based on elapsed time
    const elapsed = calculateTaskDuration(task);
    const estimated = task.estimatedDuration || 60000; // Default 1 minute
    return Math.min(0.9, elapsed / estimated);
  }

  return 0.0;
}
