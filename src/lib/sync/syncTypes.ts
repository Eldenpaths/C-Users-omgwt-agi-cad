/**
 * Phase 20: Sync Types
 * Real-time synchronization and WebSocket interfaces
 */

// ============================================================================
// WebSocket Message Types
// ============================================================================

export enum MessageType {
  // Connection
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  PING = 'PING',
  PONG = 'PONG',

  // State Sync
  STATE_UPDATE = 'STATE_UPDATE',
  STATE_REQUEST = 'STATE_REQUEST',
  STATE_SNAPSHOT = 'STATE_SNAPSHOT',

  // Glyph Events
  GLYPH_UPDATE = 'GLYPH_UPDATE',
  GLYPH_STATE_CHANGE = 'GLYPH_STATE_CHANGE',
  ETS_UPDATE = 'ETS_UPDATE',

  // Task Events
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',

  // Agent Events
  AGENT_REGISTERED = 'AGENT_REGISTERED',
  AGENT_STATUS_CHANGE = 'AGENT_STATUS_CHANGE',

  // Vault Events
  VAULT_ENTRY_CREATED = 'VAULT_ENTRY_CREATED',
  VAULT_ENTRY_UPDATED = 'VAULT_ENTRY_UPDATED',

  // Error
  ERROR = 'ERROR',
}

export interface WebSocketMessage {
  id: string;
  type: MessageType;
  timestamp: number;
  payload: any;
  userId?: string;
  sessionId?: string;
}

// ============================================================================
// Connection Types
// ============================================================================

export interface ClientInfo {
  id: string;
  userId?: string;
  sessionId: string;
  connectedAt: number;
  lastActivity: number;
  subscriptions: string[];
  metadata?: Record<string, any>;
}

export interface ConnectionState {
  isConnected: boolean;
  clientId?: string;
  sessionId?: string;
  reconnectAttempts: number;
  lastError?: string;
}

// ============================================================================
// Subscription Types
// ============================================================================

export enum SubscriptionChannel {
  GLYPHS = 'glyphs',
  TASKS = 'tasks',
  AGENTS = 'agents',
  VAULT = 'vault',
  METRICS = 'metrics',
  ALL = 'all',
}

export interface Subscription {
  channel: SubscriptionChannel;
  filter?: SubscriptionFilter;
  callback: (message: WebSocketMessage) => void;
}

export interface SubscriptionFilter {
  glyphIds?: string[];
  taskIds?: string[];
  agentIds?: string[];
  labTypes?: string[];
}

// ============================================================================
// Sync State Types
// ============================================================================

export interface SyncState {
  version: number;
  timestamp: number;
  glyphs: Record<string, any>;
  tasks: Record<string, any>;
  agents: Record<string, any>;
  checksum?: string;
}

export interface SyncDelta {
  version: number;
  timestamp: number;
  changes: SyncChange[];
}

export interface SyncChange {
  path: string;
  operation: 'add' | 'update' | 'delete';
  value?: any;
  previousValue?: any;
}

// ============================================================================
// Conflict Resolution Types
// ============================================================================

export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'LAST_WRITE_WINS',
  FIRST_WRITE_WINS = 'FIRST_WRITE_WINS',
  MANUAL = 'MANUAL',
  MERGE = 'MERGE',
}

export interface SyncConflict {
  id: string;
  path: string;
  clientVersion: any;
  serverVersion: any;
  timestamp: number;
  resolved: boolean;
  resolution?: any;
}

// ============================================================================
// Event Types
// ============================================================================

export interface GlyphUpdateEvent {
  glyphId: string;
  labType: string;
  metrics: Record<string, number>;
  state: string;
}

export interface TaskUpdateEvent {
  taskId: string;
  status: string;
  progress?: number;
  agentId?: string;
}

export interface AgentStatusEvent {
  agentId: string;
  status: string;
  load: number;
}

// ============================================================================
// Heartbeat Types
// ============================================================================

export interface HeartbeatConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
  maxMissed: number;
}

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  interval: 30000, // 30 seconds
  timeout: 10000, // 10 seconds
  maxMissed: 3,
};

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  maxMessagesPerMinute: number;
  maxBytesPerMinute: number;
  burstSize: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxMessagesPerMinute: 100,
  maxBytesPerMinute: 1024 * 1024, // 1MB
  burstSize: 20,
};

// ============================================================================
// Statistics Types
// ============================================================================

export interface SyncStatistics {
  totalConnections: number;
  activeConnections: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalBytesSent: number;
  totalBytesReceived: number;
  averageLatency: number;
  errorCount: number;
  lastError?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createMessage(
  type: MessageType,
  payload: any,
  userId?: string,
  sessionId?: string
): WebSocketMessage {
  return {
    id: generateMessageId(),
    type,
    timestamp: Date.now(),
    payload,
    userId,
    sessionId,
  };
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isSystemMessage(message: WebSocketMessage): boolean {
  return [
    MessageType.CONNECT,
    MessageType.DISCONNECT,
    MessageType.PING,
    MessageType.PONG,
    MessageType.ERROR,
  ].includes(message.type);
}

export function calculateLatency(sentTime: number, receivedTime: number): number {
  return receivedTime - sentTime;
}
