/**
 * Phase 20: Sync Manager
 * State synchronization and conflict resolution
 */

import {
  SyncState,
  SyncDelta,
  SyncChange,
  SyncConflict,
  ConflictResolutionStrategy,
  WebSocketMessage,
  MessageType,
  SubscriptionChannel,
  createMessage,
} from './syncTypes';
import { websocketServer } from './websocketServer';

// ============================================================================
// Sync Manager Class
// ============================================================================

export class SyncManager {
  private state: SyncState;
  private version: number;
  private conflicts: Map<string, SyncConflict>;
  private resolutionStrategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.LAST_WRITE_WINS) {
    this.state = {
      version: 0,
      timestamp: Date.now(),
      glyphs: {},
      tasks: {},
      agents: {},
    };
    this.version = 0;
    this.conflicts = new Map();
    this.resolutionStrategy = strategy;
  }

  // ========================================================================
  // State Management
  // ========================================================================

  getState(): SyncState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getStateVersion(): number {
    return this.version;
  }

  updateState(path: string, value: any, clientId?: string): void {
    const previousValue = this.getValueAtPath(path);

    // Check for conflicts
    if (this.hasConflict(path, value, previousValue)) {
      const conflict = this.createConflict(path, value, previousValue);
      this.conflicts.set(conflict.id, conflict);

      if (this.resolutionStrategy === ConflictResolutionStrategy.MANUAL) {
        console.warn(`⚠️ Conflict detected at ${path}, awaiting manual resolution`);
        return;
      }

      // Auto-resolve based on strategy
      value = this.resolveConflict(conflict, value, previousValue);
    }

    // Apply change
    this.setValueAtPath(path, value);
    this.version++;
    this.state.version = this.version;
    this.state.timestamp = Date.now();

    // Broadcast update
    const change: SyncChange = {
      path,
      operation: previousValue === undefined ? 'add' : 'update',
      value,
      previousValue,
    };

    this.broadcastChange(change, clientId);

    console.log(`✅ State updated: ${path} (v${this.version})`);
  }

  deleteState(path: string, clientId?: string): void {
    const previousValue = this.getValueAtPath(path);

    if (previousValue === undefined) {
      return;
    }

    this.deleteValueAtPath(path);
    this.version++;
    this.state.version = this.version;
    this.state.timestamp = Date.now();

    // Broadcast deletion
    const change: SyncChange = {
      path,
      operation: 'delete',
      previousValue,
    };

    this.broadcastChange(change, clientId);

    console.log(`🗑️ State deleted: ${path} (v${this.version})`);
  }

  // ========================================================================
  // Delta Operations
  // ========================================================================

  applyDelta(delta: SyncDelta, clientId?: string): void {
    for (const change of delta.changes) {
      switch (change.operation) {
        case 'add':
        case 'update':
          if (change.value !== undefined) {
            this.updateState(change.path, change.value, clientId);
          }
          break;

        case 'delete':
          this.deleteState(change.path, clientId);
          break;
      }
    }

    console.log(`✅ Applied delta with ${delta.changes.length} changes (v${delta.version})`);
  }

  createDelta(fromVersion: number): SyncDelta | null {
    // This would normally track change history
    // For now, return a full state snapshot
    if (fromVersion < this.version) {
      return {
        version: this.version,
        timestamp: Date.now(),
        changes: [], // Would contain actual changes since fromVersion
      };
    }

    return null;
  }

  // ========================================================================
  // Conflict Resolution
  // ========================================================================

  private hasConflict(path: string, newValue: any, oldValue: any): boolean {
    // Simple conflict detection: values are different and both exist
    return oldValue !== undefined && newValue !== oldValue;
  }

  private createConflict(path: string, clientVersion: any, serverVersion: any): SyncConflict {
    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path,
      clientVersion,
      serverVersion,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  private resolveConflict(conflict: SyncConflict, clientValue: any, serverValue: any): any {
    switch (this.resolutionStrategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        conflict.resolved = true;
        conflict.resolution = clientValue;
        return clientValue;

      case ConflictResolutionStrategy.FIRST_WRITE_WINS:
        conflict.resolved = true;
        conflict.resolution = serverValue;
        return serverValue;

      case ConflictResolutionStrategy.MERGE:
        // Simple merge: if both are objects, merge properties
        if (
          typeof clientValue === 'object' &&
          typeof serverValue === 'object' &&
          !Array.isArray(clientValue)
        ) {
          const merged = { ...serverValue, ...clientValue };
          conflict.resolved = true;
          conflict.resolution = merged;
          return merged;
        }
        // Fallback to last write wins
        conflict.resolved = true;
        conflict.resolution = clientValue;
        return clientValue;

      default:
        return serverValue;
    }
  }

  resolveConflictManually(conflictId: string, resolution: any): void {
    const conflict = this.conflicts.get(conflictId);

    if (!conflict) {
      console.error(`❌ Conflict not found: ${conflictId}`);
      return;
    }

    conflict.resolved = true;
    conflict.resolution = resolution;

    // Apply resolution
    this.setValueAtPath(conflict.path, resolution);
    this.version++;

    console.log(`✅ Conflict resolved manually: ${conflictId}`);
  }

  getConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter((c) => !c.resolved);
  }

  // ========================================================================
  // Path Operations
  // ========================================================================

  private getValueAtPath(path: string): any {
    const parts = path.split('.');
    let current: any = this.state;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  private setValueAtPath(path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;
    let current: any = this.state;

    for (const part of parts) {
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }

    current[lastPart] = value;
  }

  private deleteValueAtPath(path: string): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;
    let current: any = this.state;

    for (const part of parts) {
      if (current[part] === undefined) {
        return;
      }
      current = current[part];
    }

    delete current[lastPart];
  }

  // ========================================================================
  // Broadcasting
  // ========================================================================

  private broadcastChange(change: SyncChange, excludeClient?: string): void {
    const message = createMessage(MessageType.STATE_UPDATE, {
      version: this.version,
      change,
    });

    websocketServer.broadcast(SubscriptionChannel.ALL, message, excludeClient);
  }

  broadcastSnapshot(clientId: string): void {
    const message = createMessage(MessageType.STATE_SNAPSHOT, {
      version: this.version,
      state: this.state,
    });

    websocketServer.sendMessage(clientId, message);
    console.log(`📸 Snapshot sent to client ${clientId}`);
  }

  // ========================================================================
  // Glyph-specific Operations
  // ========================================================================

  updateGlyph(glyphId: string, updates: any, clientId?: string): void {
    const path = `glyphs.${glyphId}`;
    const current = this.getValueAtPath(path) || {};
    const updated = { ...current, ...updates };

    this.updateState(path, updated, clientId);

    // Emit specialized glyph update
    websocketServer.emitGlyphUpdate(glyphId, updated);
  }

  getGlyph(glyphId: string): any {
    return this.getValueAtPath(`glyphs.${glyphId}`);
  }

  getAllGlyphs(): Record<string, any> {
    return this.state.glyphs;
  }

  // ========================================================================
  // Task-specific Operations
  // ========================================================================

  updateTask(taskId: string, updates: any, clientId?: string): void {
    const path = `tasks.${taskId}`;
    const current = this.getValueAtPath(path) || {};
    const updated = { ...current, ...updates };

    this.updateState(path, updated, clientId);

    // Emit specialized task update
    websocketServer.emitTaskUpdate(taskId, updated);
  }

  getTask(taskId: string): any {
    return this.getValueAtPath(`tasks.${taskId}`);
  }

  getAllTasks(): Record<string, any> {
    return this.state.tasks;
  }

  // ========================================================================
  // Agent-specific Operations
  // ========================================================================

  updateAgent(agentId: string, updates: any, clientId?: string): void {
    const path = `agents.${agentId}`;
    const current = this.getValueAtPath(path) || {};
    const updated = { ...current, ...updates };

    this.updateState(path, updated, clientId);

    // Emit specialized agent update
    websocketServer.emitAgentUpdate(agentId, updated);
  }

  getAgent(agentId: string): any {
    return this.getValueAtPath(`agents.${agentId}`);
  }

  getAllAgents(): Record<string, any> {
    return this.state.agents;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const syncManager = new SyncManager();

// ============================================================================
// Convenience Functions
// ============================================================================

export function getGlobalState(): SyncState {
  return syncManager.getState();
}

export function updateGlyphState(glyphId: string, updates: any): void {
  syncManager.updateGlyph(glyphId, updates);
}

export function updateTaskState(taskId: string, updates: any): void {
  syncManager.updateTask(taskId, updates);
}

export function updateAgentState(agentId: string, updates: any): void {
  syncManager.updateAgent(agentId, updates);
}

export function broadcastStateSnapshot(clientId: string): void {
  syncManager.broadcastSnapshot(clientId);
}
