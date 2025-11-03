/**
 * Phase 20: WebSocket Server
 * Real-time bidirectional communication server
 */

import {
  WebSocketMessage,
  MessageType,
  ClientInfo,
  SubscriptionChannel,
  SyncStatistics,
  createMessage,
  DEFAULT_HEARTBEAT_CONFIG,
} from './syncTypes';

// ============================================================================
// WebSocket Server Class
// ============================================================================

export class WebSocketServer {
  private clients: Map<string, ClientInfo>;
  private subscriptions: Map<string, Set<string>>; // channel -> Set<clientId>
  private messageQueue: Map<string, WebSocketMessage[]>; // clientId -> messages
  private statistics: SyncStatistics;
  private heartbeatInterval: NodeJS.Timeout | null;

  constructor() {
    this.clients = new Map();
    this.subscriptions = new Map();
    this.messageQueue = new Map();
    this.heartbeatInterval = null;
    this.statistics = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
      totalBytesSent: 0,
      totalBytesReceived: 0,
      averageLatency: 0,
      errorCount: 0,
    };

    // Initialize subscription channels
    Object.values(SubscriptionChannel).forEach((channel) => {
      this.subscriptions.set(channel, new Set());
    });

    this.startHeartbeat();
  }

  // ========================================================================
  // Client Management
  // ========================================================================

  registerClient(clientId: string, userId?: string, metadata?: Record<string, any>): ClientInfo {
    const client: ClientInfo = {
      id: clientId,
      userId,
      sessionId: this.generateSessionId(),
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: [],
      metadata,
    };

    this.clients.set(clientId, client);
    this.messageQueue.set(clientId, []);
    this.statistics.totalConnections++;
    this.statistics.activeConnections++;

    console.log(`✅ Client registered: ${clientId}`);
    return client;
  }

  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);

    if (!client) return;

    // Remove from all subscriptions
    this.subscriptions.forEach((subscribers) => {
      subscribers.delete(clientId);
    });

    // Clear message queue
    this.messageQueue.delete(clientId);

    // Remove client
    this.clients.delete(clientId);
    this.statistics.activeConnections--;

    console.log(`❌ Client unregistered: ${clientId}`);
  }

  getClient(clientId: string): ClientInfo | undefined {
    return this.clients.get(clientId);
  }

  getAllClients(): ClientInfo[] {
    return Array.from(this.clients.values());
  }

  updateClientActivity(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = Date.now();
    }
  }

  // ========================================================================
  // Subscription Management
  // ========================================================================

  subscribe(clientId: string, channel: SubscriptionChannel): void {
    const client = this.clients.get(clientId);

    if (!client) {
      console.error(`❌ Client not found: ${clientId}`);
      return;
    }

    const subscribers = this.subscriptions.get(channel);

    if (subscribers) {
      subscribers.add(clientId);

      if (!client.subscriptions.includes(channel)) {
        client.subscriptions.push(channel);
      }

      console.log(`📡 Client ${clientId} subscribed to ${channel}`);
    }
  }

  unsubscribe(clientId: string, channel: SubscriptionChannel): void {
    const client = this.clients.get(clientId);

    if (!client) return;

    const subscribers = this.subscriptions.get(channel);

    if (subscribers) {
      subscribers.delete(clientId);
      client.subscriptions = client.subscriptions.filter((c) => c !== channel);

      console.log(`📡 Client ${clientId} unsubscribed from ${channel}`);
    }
  }

  getSubscribers(channel: SubscriptionChannel): string[] {
    return Array.from(this.subscriptions.get(channel) || []);
  }

  // ========================================================================
  // Message Handling
  // ========================================================================

  async sendMessage(clientId: string, message: WebSocketMessage): Promise<boolean> {
    const queue = this.messageQueue.get(clientId);

    if (!queue) {
      console.error(`❌ Client queue not found: ${clientId}`);
      return false;
    }

    // Add to queue
    queue.push(message);

    this.updateClientActivity(clientId);
    this.statistics.totalMessagesSent++;
    this.statistics.totalBytesSent += JSON.stringify(message).length;

    console.log(`📤 Message queued for client ${clientId}: ${message.type}`);
    return true;
  }

  async broadcast(
    channel: SubscriptionChannel,
    message: WebSocketMessage,
    excludeClient?: string
  ): Promise<number> {
    const subscribers = this.getSubscribers(channel);
    let sent = 0;

    for (const clientId of subscribers) {
      if (clientId !== excludeClient) {
        const success = await this.sendMessage(clientId, message);
        if (success) sent++;
      }
    }

    console.log(`📢 Broadcast to ${sent} clients on ${channel}`);
    return sent;
  }

  receiveMessage(clientId: string, message: WebSocketMessage): void {
    this.updateClientActivity(clientId);
    this.statistics.totalMessagesReceived++;
    this.statistics.totalBytesReceived += JSON.stringify(message).length;

    console.log(`📥 Message received from ${clientId}: ${message.type}`);

    // Handle system messages
    if (message.type === MessageType.PING) {
      this.sendMessage(clientId, createMessage(MessageType.PONG, {}, message.userId));
    }
  }

  getQueuedMessages(clientId: string): WebSocketMessage[] {
    const queue = this.messageQueue.get(clientId);

    if (!queue) return [];

    // Get all messages and clear queue
    const messages = [...queue];
    this.messageQueue.set(clientId, []);

    return messages;
  }

  // ========================================================================
  // Heartbeat
  // ========================================================================

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, DEFAULT_HEARTBEAT_CONFIG.interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private performHeartbeat(): void {
    const now = Date.now();
    const timeout = DEFAULT_HEARTBEAT_CONFIG.timeout * DEFAULT_HEARTBEAT_CONFIG.maxMissed;

    // Check for inactive clients
    this.clients.forEach((client, clientId) => {
      const inactiveDuration = now - client.lastActivity;

      if (inactiveDuration > timeout) {
        console.warn(`⚠️ Client ${clientId} inactive for ${inactiveDuration}ms, disconnecting`);
        this.unregisterClient(clientId);
      } else {
        // Send ping
        this.sendMessage(clientId, createMessage(MessageType.PING, {}, client.userId));
      }
    });
  }

  // ========================================================================
  // Statistics
  // ========================================================================

  getStatistics(): SyncStatistics {
    return { ...this.statistics };
  }

  resetStatistics(): void {
    this.statistics = {
      ...this.statistics,
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
      totalBytesSent: 0,
      totalBytesReceived: 0,
      errorCount: 0,
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  shutdown(): void {
    this.stopHeartbeat();

    // Disconnect all clients
    const clientIds = Array.from(this.clients.keys());
    clientIds.forEach((clientId) => this.unregisterClient(clientId));

    console.log(`🛑 WebSocket server shut down`);
  }

  // ========================================================================
  // Event Emitters
  // ========================================================================

  emitGlyphUpdate(glyphId: string, data: any): void {
    const message = createMessage(MessageType.GLYPH_UPDATE, { glyphId, ...data });
    this.broadcast(SubscriptionChannel.GLYPHS, message);
  }

  emitTaskUpdate(taskId: string, data: any): void {
    const message = createMessage(MessageType.TASK_CREATED, { taskId, ...data });
    this.broadcast(SubscriptionChannel.TASKS, message);
  }

  emitAgentUpdate(agentId: string, data: any): void {
    const message = createMessage(MessageType.AGENT_STATUS_CHANGE, { agentId, ...data });
    this.broadcast(SubscriptionChannel.AGENTS, message);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const websocketServer = new WebSocketServer();

// ============================================================================
// Convenience Functions
// ============================================================================

export function registerWSClient(clientId: string, userId?: string): ClientInfo {
  return websocketServer.registerClient(clientId, userId);
}

export function unregisterWSClient(clientId: string): void {
  websocketServer.unregisterClient(clientId);
}

export function broadcastMessage(channel: SubscriptionChannel, message: WebSocketMessage): void {
  websocketServer.broadcast(channel, message);
}

export function getWSStatistics(): SyncStatistics {
  return websocketServer.getStatistics();
}
