// CLAUDE-META: Phase 10E Vault & Fusion Bridge - Real-time Telemetry
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Vault ↔ Forge sync + Drift/Trust telemetry to Firestore
// Status: Production - Phase 10E Active

import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

/**
 * Telemetry Event Types
 */
export type TelemetryEvent = {
  timestamp: Date;
  type: 'drift' | 'trust' | 'rollback' | 'modification' | 'heartbeat';
  agentId?: string;
  data: Record<string, any>;
};

/**
 * Drift Telemetry Data
 */
export type DriftTelemetry = {
  agentId: string;
  driftScore: number;
  entropyScore: number;
  driftDetected: boolean;
  entropyExceeded: boolean;
  filePath: string;
  timestamp: Date;
};

/**
 * Trust Telemetry Data
 */
export type TrustTelemetry = {
  agentId: string;
  trustScore: number;
  successCount: number;
  failureCount: number;
  avgDrift: number;
  alpha: number;
  beta: number;
  timestamp: Date;
};

/**
 * Rollback Telemetry Data
 */
export type RollbackTelemetry = {
  modificationId: string;
  reason: string;
  triggeredBy: string;
  rolledBackCount: number;
  timestamp: Date;
};

/**
 * Fusion Bridge
 * Real-time synchronization between Vault, Forge, and Firestore
 * Logs drift, trust, and rollback telemetry for dashboard visualization
 */
export class FusionBridge {
  private listeners: Map<string, () => void> = new Map();
  private eventBuffer: TelemetryEvent[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.startBufferFlush();
  }

  /**
   * Initialize Fusion Bridge with Firestore listeners
   */
  async initialize() {
    console.log('[FusionBridge] Initializing...');

    try {
      // Listen to Vault state changes
      this.subscribeToVaultState();

      // Listen to Forge events
      this.subscribeToForgeEvents();

      // Listen to telemetry updates
      this.subscribeToTelemetry();

      console.log('✅ Fusion Bridge initialized');
    } catch (error) {
      console.error('❌ Fusion Bridge initialization error:', error);
    }
  }

  /**
   * Log drift telemetry to Firestore
   */
  async logDrift(data: DriftTelemetry) {
    try {
      const telemetryDoc = doc(collection(db, 'telemetry'));

      await setDoc(telemetryDoc, {
        type: 'drift',
        agentId: data.agentId,
        driftScore: data.driftScore,
        entropyScore: data.entropyScore,
        driftDetected: data.driftDetected,
        entropyExceeded: data.entropyExceeded,
        filePath: data.filePath,
        timestamp: serverTimestamp(),
        createdAt: Timestamp.fromDate(data.timestamp),
      });

      // Add to event buffer
      this.addEventToBuffer({
        timestamp: data.timestamp,
        type: 'drift',
        agentId: data.agentId,
        data: {
          driftScore: data.driftScore,
          entropyScore: data.entropyScore,
          driftDetected: data.driftDetected,
        },
      });

      console.log(`[FusionBridge] Drift logged: ${data.agentId} (drift: ${data.driftScore.toFixed(4)})`);
    } catch (error) {
      console.error('❌ Error logging drift:', error);
    }
  }

  /**
   * Log trust telemetry to Firestore
   */
  async logTrust(data: TrustTelemetry) {
    try {
      const telemetryDoc = doc(collection(db, 'telemetry'));

      await setDoc(telemetryDoc, {
        type: 'trust',
        agentId: data.agentId,
        trustScore: data.trustScore,
        successCount: data.successCount,
        failureCount: data.failureCount,
        avgDrift: data.avgDrift,
        alpha: data.alpha,
        beta: data.beta,
        timestamp: serverTimestamp(),
        createdAt: Timestamp.fromDate(data.timestamp),
      });

      // Add to event buffer
      this.addEventToBuffer({
        timestamp: data.timestamp,
        type: 'trust',
        agentId: data.agentId,
        data: {
          trustScore: data.trustScore,
          successCount: data.successCount,
          failureCount: data.failureCount,
        },
      });

      console.log(`[FusionBridge] Trust logged: ${data.agentId} (trust: ${data.trustScore.toFixed(3)})`);
    } catch (error) {
      console.error('❌ Error logging trust:', error);
    }
  }

  /**
   * Log rollback telemetry to Firestore
   */
  async logRollback(data: RollbackTelemetry) {
    try {
      const telemetryDoc = doc(collection(db, 'telemetry'));

      await setDoc(telemetryDoc, {
        type: 'rollback',
        modificationId: data.modificationId,
        reason: data.reason,
        triggeredBy: data.triggeredBy,
        rolledBackCount: data.rolledBackCount,
        timestamp: serverTimestamp(),
        createdAt: Timestamp.fromDate(data.timestamp),
      });

      // Add to event buffer
      this.addEventToBuffer({
        timestamp: data.timestamp,
        type: 'rollback',
        data: {
          modificationId: data.modificationId,
          reason: data.reason,
          rolledBackCount: data.rolledBackCount,
        },
      });

      console.log(`[FusionBridge] Rollback logged: ${data.modificationId} (count: ${data.rolledBackCount})`);
    } catch (error) {
      console.error('❌ Error logging rollback:', error);
    }
  }

  /**
   * Log modification event
   */
  async logModification(agentId: string, filePath: string, approved: boolean, riskScore: number) {
    try {
      const telemetryDoc = doc(collection(db, 'telemetry'));

      await setDoc(telemetryDoc, {
        type: 'modification',
        agentId,
        filePath,
        approved,
        riskScore,
        timestamp: serverTimestamp(),
      });

      console.log(`[FusionBridge] Modification logged: ${agentId} → ${filePath} (${approved ? 'approved' : 'rejected'})`);
    } catch (error) {
      console.error('❌ Error logging modification:', error);
    }
  }

  /**
   * Subscribe to Vault state changes
   */
  private subscribeToVaultState() {
    const docRef = doc(db, 'vaultState', 'current');

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('[FusionBridge] Vault state updated:', data);

        // Emit vault update event
        this.addEventToBuffer({
          timestamp: new Date(),
          type: 'heartbeat',
          data: {
            memoriesCount: data.memories?.length || 0,
            agentsCount: data.agents?.length || 0,
            tasksCount: data.tasks?.length || 0,
          },
        });
      }
    });

    this.listeners.set('vaultState', unsubscribe);
  }

  /**
   * Subscribe to Forge events
   */
  private subscribeToForgeEvents() {
    // Listen to forgeStatus document for Forge events
    const docRef = doc(db, 'forgeStatus', 'current');

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('[FusionBridge] Forge status updated:', data);
      }
    });

    this.listeners.set('forgeStatus', unsubscribe);
  }

  /**
   * Subscribe to real-time telemetry updates
   */
  private subscribeToTelemetry() {
    const telemetryQuery = query(
      collection(db, 'telemetry'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(telemetryQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log(`[FusionBridge] New telemetry event: ${data.type}`);
        }
      });
    });

    this.listeners.set('telemetry', unsubscribe);
  }

  /**
   * Add event to buffer
   */
  private addEventToBuffer(event: TelemetryEvent) {
    this.eventBuffer.push(event);

    // Keep buffer size limited
    if (this.eventBuffer.length > this.BUFFER_SIZE) {
      this.eventBuffer.shift();
    }
  }

  /**
   * Get recent events from buffer
   */
  getRecentEvents(count: number = 10): TelemetryEvent[] {
    return this.eventBuffer.slice(-count);
  }

  /**
   * Start periodic buffer flush
   */
  private startBufferFlush() {
    setInterval(() => {
      if (this.eventBuffer.length > 0) {
        console.log(`[FusionBridge] Buffer: ${this.eventBuffer.length} events`);
      }
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Get telemetry statistics
   */
  getTelemetryStats() {
    const driftEvents = this.eventBuffer.filter(e => e.type === 'drift');
    const trustEvents = this.eventBuffer.filter(e => e.type === 'trust');
    const rollbackEvents = this.eventBuffer.filter(e => e.type === 'rollback');

    return {
      totalEvents: this.eventBuffer.length,
      driftEvents: driftEvents.length,
      trustEvents: trustEvents.length,
      rollbackEvents: rollbackEvents.length,
      avgDrift: driftEvents.length > 0
        ? driftEvents.reduce((sum, e) => sum + (e.data.driftScore || 0), 0) / driftEvents.length
        : 0,
      avgTrust: trustEvents.length > 0
        ? trustEvents.reduce((sum, e) => sum + (e.data.trustScore || 0), 0) / trustEvents.length
        : 0,
    };
  }

  /**
   * Cleanup listeners
   */
  destroy() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
    this.eventBuffer = [];
    console.log('[FusionBridge] Destroyed');
  }
}

// Singleton instance
let fusionBridge: FusionBridge | null = null;

/**
 * Get or create Fusion Bridge instance
 */
export function getFusionBridge(): FusionBridge {
  if (!fusionBridge) {
    fusionBridge = new FusionBridge();
  }
  return fusionBridge;
}

/**
 * Initialize Fusion Bridge (call once on app start)
 */
export async function initializeFusionBridge() {
  const bridge = getFusionBridge();
  await bridge.initialize();
  return bridge;
}

export default FusionBridge;
