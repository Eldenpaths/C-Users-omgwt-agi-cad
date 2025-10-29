// CLAUDE-META: Phase 10E Vault & Fusion Bridge - Sync Flag Utility
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Track pending Firestore operations for loading states
// Status: Production - Phase 10E Active

/**
 * Sync Flag Manager
 * Tracks pending Firestore operations to show loading states
 */
class SyncFlagManager {
  constructor() {
    this.pendingCount = 0;
    this.listeners = new Set();
  }

  incPending() {
    this.pendingCount++;
    this.notify();
  }

  decPending() {
    this.pendingCount = Math.max(0, this.pendingCount - 1);
    this.notify();
  }

  getPendingCount() {
    return this.pendingCount;
  }

  isPending() {
    return this.pendingCount > 0;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(callback => callback(this.pendingCount));
  }
}

// Singleton instance
const syncFlagManager = new SyncFlagManager();

export function incPending() {
  syncFlagManager.incPending();
}

export function decPending() {
  syncFlagManager.decPending();
}

export function getPendingCount() {
  return syncFlagManager.getPendingCount();
}

export function isPending() {
  return syncFlagManager.isPending();
}

export function subscribeToPending(callback) {
  return syncFlagManager.subscribe(callback);
}

export default syncFlagManager;
