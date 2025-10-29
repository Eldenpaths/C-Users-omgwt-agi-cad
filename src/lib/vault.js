// CLAUDE-META: Phase 10E Vault & Fusion Bridge - Vault State Manager
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Vault state management with checksum and Firestore sync
// Status: Production - Phase 10E Active

import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Vault State Manager
 * Maintains in-memory state of the Vault with Firestore persistence
 */
class VaultState {
  constructor() {
    this.state = {
      memories: [],
      agents: [],
      tasks: [],
      metadata: {},
      lastSync: null,
    };
    this.listeners = new Set();
    this.initialized = false;
  }

  /**
   * Initialize Vault with Firestore listener
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Listen to vaultState document
      const docRef = doc(db, 'vaultState', 'current');

      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          this.state = {
            ...this.state,
            ...data,
            lastSync: new Date(),
          };
          this.notifyListeners();
          console.log('✅ Vault state synced from Firestore');
        }
      });

      this.initialized = true;
      console.log('✅ Vault state manager initialized');
    } catch (error) {
      console.error('❌ Vault initialization error:', error);
    }
  }

  /**
   * Subscribe to vault state changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.state));
  }

  /**
   * Get current vault state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update vault state and sync to Firestore
   */
  async updateState(updates) {
    try {
      this.state = {
        ...this.state,
        ...updates,
        lastSync: new Date(),
      };

      const docRef = doc(db, 'vaultState', 'current');
      await setDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      this.notifyListeners();
      console.log('✅ Vault state updated and synced');
    } catch (error) {
      console.error('❌ Vault state update error:', error);
    }
  }

  /**
   * Add memory to vault
   */
  async addMemory(memory) {
    const memories = [...this.state.memories, {
      id: `mem-${Date.now()}`,
      ...memory,
      timestamp: new Date().toISOString(),
    }];
    await this.updateState({ memories });
  }

  /**
   * Add agent to vault
   */
  async addAgent(agent) {
    const agents = [...this.state.agents, {
      id: agent.id || `agent-${Date.now()}`,
      ...agent,
      registeredAt: new Date().toISOString(),
    }];
    await this.updateState({ agents });
  }

  /**
   * Update task status
   */
  async updateTask(taskId, updates) {
    const tasks = this.state.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    await this.updateState({ tasks });
  }
}

// Singleton instance
const vaultState = new VaultState();

/**
 * Compute checksum of current Vault state
 * Used by useHeartbeat for sync detection
 */
export async function snapshotChecksum() {
  // Ensure vault is initialized
  if (!vaultState.initialized) {
    await vaultState.initialize();
  }

  const state = vaultState.getState();

  // Compute simple checksum from state
  const stateString = JSON.stringify({
    memoriesCount: state.memories.length,
    agentsCount: state.agents.length,
    tasksCount: state.tasks.length,
    lastSync: state.lastSync?.toISOString(),
  });

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < stateString.length; i++) {
    const char = stateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const checksum = `vault-${Math.abs(hash).toString(16)}`;
  console.log(`[Vault] Checksum: ${checksum}`);
  return checksum;
}

/**
 * Get vault state
 */
export function getVaultState() {
  return vaultState.getState();
}

/**
 * Subscribe to vault changes
 */
export function subscribeToVault(callback) {
  return vaultState.subscribe(callback);
}

/**
 * Update vault state
 */
export async function updateVaultState(updates) {
  return vaultState.updateState(updates);
}

/**
 * Add memory to vault
 */
export async function addMemory(memory) {
  return vaultState.addMemory(memory);
}

/**
 * Add agent to vault
 */
export async function addAgent(agent) {
  return vaultState.addAgent(agent);
}

/**
 * Update task in vault
 */
export async function updateTask(taskId, updates) {
  return vaultState.updateTask(taskId, updates);
}

/**
 * Initialize vault (must be called once)
 */
export async function initializeVault() {
  return vaultState.initialize();
}

export default {
  snapshotChecksum,
  getVaultState,
  subscribeToVault,
  updateVaultState,
  addMemory,
  addAgent,
  updateTask,
  initializeVault,
};
