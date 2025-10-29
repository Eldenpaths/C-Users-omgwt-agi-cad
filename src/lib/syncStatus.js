// CLAUDE-META: Phase 10E Vault & Fusion Bridge - Sync Status Manager
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Track Firestore write operations for sync status
// Status: Production - Phase 10E Active

/**
 * Sync Status Manager
 * Tracks ongoing Firestore write operations for sync status UI
 */
class SyncStatusManager {
  constructor() {
    this.activeWrites = new Map();
    this.listeners = new Set();
  }

  /**
   * Register a write operation and return a completion callback
   * @param {string} writeId - Unique identifier for this write
   * @returns {Function} Completion callback to call when write finishes
   */
  registerWrite(writeId) {
    this.activeWrites.set(writeId, {
      id: writeId,
      startedAt: Date.now(),
    });
    this.notify();

    // Return completion callback
    return () => {
      this.activeWrites.delete(writeId);
      this.notify();
    };
  }

  /**
   * Check if any writes are in progress
   * @returns {boolean}
   */
  isSyncing() {
    return this.activeWrites.size > 0;
  }

  /**
   * Get count of active writes
   * @returns {number}
   */
  getActiveWriteCount() {
    return this.activeWrites.size;
  }

  /**
   * Get list of active write IDs
   * @returns {Array<string>}
   */
  getActiveWrites() {
    return Array.from(this.activeWrites.values());
  }

  /**
   * Subscribe to sync status changes
   * @param {Function} callback - Called when sync status changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of status change
   */
  notify() {
    this.listeners.forEach(callback => callback({
      isSyncing: this.isSyncing(),
      activeCount: this.getActiveWriteCount(),
      writes: this.getActiveWrites(),
    }));
  }
}

// Singleton instance
const syncStatusManager = new SyncStatusManager();

export { syncStatusManager };

export function isSyncing() {
  return syncStatusManager.isSyncing();
}

export function getActiveWriteCount() {
  return syncStatusManager.getActiveWriteCount();
}

export function subscribeToSyncStatus(callback) {
  return syncStatusManager.subscribe(callback);
}

export default syncStatusManager;
