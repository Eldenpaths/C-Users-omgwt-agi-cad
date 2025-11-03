/**
 * Phase 17B: Vault Logger
 * Logs glyph state changes, ETS score updates, and persists to Firestore
 */

import { getFirestoreInstance } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { LabType, GlyphState, GlyphMetrics } from "../glyph/schema";

// ============================================================================
// Legacy Types (preserved for compatibility)
// ============================================================================

export type VaultLogType =
  | "archivist_sweep"
  | "qfl_aggregation"
  | "lab_event"
  | "system_alert"
  | "glyph_state_change"
  | "glyph_ets_update"
  | "glyph_metrics_update"
  | "glyph_transition"
  | "predictive_alert"
  | "heuristic_update"
  | "anomaly_detection";

export interface VaultLogEntry<T = any> {
  log_type: VaultLogType;
  data: T;
  source: string;
  timestamp?: number;
}

// ============================================================================
// Phase 17B: Glyph Event Types
// ============================================================================

export interface GlyphStateChangeEvent {
  glyphId: string;
  labType: LabType;
  previousState: GlyphState;
  newState: GlyphState;
  transitionDuration?: number;
  reason?: string;
}

export interface GlyphETSUpdateEvent {
  glyphId: string;
  labType: LabType;
  previousScore: number;
  newScore: number;
  delta: number;
  colorChange?: {
    from: string;
    to: string;
  };
}

export interface GlyphMetricsUpdateEvent {
  glyphId: string;
  labType: LabType;
  metrics: GlyphMetrics;
  changes: {
    field: keyof GlyphMetrics;
    previousValue: number;
    newValue: number;
  }[];
}

export interface GlyphTransitionEvent {
  glyphId: string;
  labType: LabType;
  fromState: GlyphState;
  toState: GlyphState;
  duration: number;
  startTime: number;
  endTime: number;
  completed: boolean;
}

// ============================================================================
// Vault Logger Class
// ============================================================================

export class VaultLogger {
  private static COL = "vault_system_reports";
  private static GLYPH_COL = "vault_glyph_logs";
  private static METRICS_COL = "vault_glyph_metrics";
  private static BATCH_SIZE = 10;
  private static pendingLogs: VaultLogEntry[] = [];
  private static batchTimeout: NodeJS.Timeout | null = null;

  // ========================================================================
  // Legacy Methods (preserved for compatibility)
  // ========================================================================

  static async log<T>(entry: VaultLogEntry<T>) {
    const db = getFirestoreInstance();
    const doc = {
      ...entry,
      timestamp: Date.now(),
      firestore_timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, VaultLogger.COL), doc);
    console.log(`✅ Vault log created: ${entry.log_type}`);
  }

  static async logArchivistSweep(findings: any) {
    await this.log({
      log_type: "archivist_sweep",
      data: findings,
      source: "archivist_agent",
    });
  }

  // ========================================================================
  // Phase 17B: Glyph Logging Methods
  // ========================================================================

  /**
   * Log a glyph state change
   */
  static async logGlyphStateChange(event: GlyphStateChangeEvent): Promise<void> {
    await this.log({
      log_type: "glyph_state_change",
      data: event,
      source: "nexus_glyph_animator",
    });

    // Also add to specialized glyph collection
    const db = getFirestoreInstance();
    await addDoc(collection(db, VaultLogger.GLYPH_COL), {
      event_type: "state_change",
      glyph_id: event.glyphId,
      lab_type: event.labType,
      previous_state: event.previousState,
      new_state: event.newState,
      transition_duration: event.transitionDuration,
      reason: event.reason,
      timestamp: Date.now(),
      firestore_timestamp: serverTimestamp(),
    });

    console.log(`🔄 Glyph state change logged: ${event.glyphId} ${event.previousState} → ${event.newState}`);
  }

  /**
   * Log an ETS score update
   */
  static async logETSUpdate(event: GlyphETSUpdateEvent): Promise<void> {
    await this.log({
      log_type: "glyph_ets_update",
      data: event,
      source: "nexus_glyph_animator",
    });

    // Also add to specialized glyph collection
    const db = getFirestoreInstance();
    await addDoc(collection(db, VaultLogger.GLYPH_COL), {
      event_type: "ets_update",
      glyph_id: event.glyphId,
      lab_type: event.labType,
      previous_score: event.previousScore,
      new_score: event.newScore,
      delta: event.delta,
      color_change: event.colorChange,
      timestamp: Date.now(),
      firestore_timestamp: serverTimestamp(),
    });

    console.log(`📊 ETS update logged: ${event.glyphId} ${event.previousScore} → ${event.newScore} (Δ${event.delta.toFixed(2)})`);
  }

  /**
   * Log glyph metrics update
   */
  static async logMetricsUpdate(event: GlyphMetricsUpdateEvent): Promise<void> {
    const db = getFirestoreInstance();

    // Add to specialized metrics collection
    await addDoc(collection(db, VaultLogger.METRICS_COL), {
      glyph_id: event.glyphId,
      lab_type: event.labType,
      metrics: event.metrics,
      changes: event.changes,
      timestamp: Date.now(),
      firestore_timestamp: serverTimestamp(),
    });

    console.log(`📈 Metrics update logged: ${event.glyphId} (${event.changes.length} changes)`);
  }

  /**
   * Log a glyph transition completion
   */
  static async logTransition(event: GlyphTransitionEvent): Promise<void> {
    await this.log({
      log_type: "glyph_transition",
      data: event,
      source: "nexus_glyph_animator",
    });

    const db = getFirestoreInstance();
    await addDoc(collection(db, VaultLogger.GLYPH_COL), {
      event_type: "transition",
      glyph_id: event.glyphId,
      lab_type: event.labType,
      from_state: event.fromState,
      to_state: event.toState,
      duration: event.duration,
      start_time: event.startTime,
      end_time: event.endTime,
      completed: event.completed,
      timestamp: Date.now(),
      firestore_timestamp: serverTimestamp(),
    });

    console.log(`⏱️ Transition logged: ${event.glyphId} ${event.fromState} → ${event.toState} (${event.duration}ms)`);
  }

  // ========================================================================
  // Batched Logging for Performance
  // ========================================================================

  /**
   * Add a log entry to the batch queue
   */
  static queueLog<T>(entry: VaultLogEntry<T>): void {
    this.pendingLogs.push(entry);

    if (this.pendingLogs.length >= this.BATCH_SIZE) {
      this.flushLogs();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushLogs(), 5000);
    }
  }

  /**
   * Flush all pending logs to Firestore
   */
  static async flushLogs(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.pendingLogs.length === 0) return;

    const logsToWrite = [...this.pendingLogs];
    this.pendingLogs = [];

    const db = getFirestoreInstance();
    const promises = logsToWrite.map((entry) =>
      addDoc(collection(db, VaultLogger.COL), {
        ...entry,
        timestamp: Date.now(),
        firestore_timestamp: serverTimestamp(),
      })
    );

    await Promise.all(promises);
    console.log(`📦 Flushed ${logsToWrite.length} logs to Firestore`);
  }

  // ========================================================================
  // Query Methods
  // ========================================================================

  /**
   * Get recent glyph events
   */
  static async getRecentGlyphEvents(
    glyphId: string,
    maxCount: number = 10
  ): Promise<any[]> {
    const db = getFirestoreInstance();
    const q = query(
      collection(db, VaultLogger.GLYPH_COL),
      where("glyph_id", "==", glyphId),
      orderBy("timestamp", "desc"),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get recent ETS updates
   */
  static async getRecentETSUpdates(
    labType?: LabType,
    maxCount: number = 20
  ): Promise<any[]> {
    const db = getFirestoreInstance();
    let q = query(
      collection(db, VaultLogger.GLYPH_COL),
      where("event_type", "==", "ets_update"),
      orderBy("timestamp", "desc"),
      limit(maxCount)
    );

    if (labType) {
      q = query(
        collection(db, VaultLogger.GLYPH_COL),
        where("event_type", "==", "ets_update"),
        where("lab_type", "==", labType),
        orderBy("timestamp", "desc"),
        limit(maxCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get metrics history for a glyph
   */
  static async getMetricsHistory(
    glyphId: string,
    maxCount: number = 50
  ): Promise<any[]> {
    const db = getFirestoreInstance();
    const q = query(
      collection(db, VaultLogger.METRICS_COL),
      where("glyph_id", "==", glyphId),
      orderBy("timestamp", "desc"),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get all state transitions for a lab type
   */
  static async getStateTransitions(
    labType: LabType,
    maxCount: number = 30
  ): Promise<any[]> {
    const db = getFirestoreInstance();
    const q = query(
      collection(db, VaultLogger.GLYPH_COL),
      where("event_type", "==", "state_change"),
      where("lab_type", "==", labType),
      orderBy("timestamp", "desc"),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // ========================================================================
  // Analytics Methods
  // ========================================================================

  /**
   * Calculate average ETS score for a lab type
   */
  static async getAverageETSScore(labType: LabType): Promise<number> {
    const updates = await this.getRecentETSUpdates(labType, 100);
    if (updates.length === 0) return 0;

    const sum = updates.reduce((acc, update) => acc + (update.new_score || 0), 0);
    return sum / updates.length;
  }

  /**
   * Get state distribution for a lab type
   */
  static async getStateDistribution(labType: LabType): Promise<Record<GlyphState, number>> {
    const transitions = await this.getStateTransitions(labType, 100);
    const distribution: Record<string, number> = {
      IDLE: 0,
      ACTIVE: 0,
      CRITICAL: 0,
      TRANSITIONING: 0,
    };

    for (const transition of transitions) {
      const state = transition.new_state;
      if (state in distribution) {
        distribution[state]++;
      }
    }

    return distribution as Record<GlyphState, number>;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Clear old logs (cleanup utility)
   */
  static async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const db = getFirestoreInstance();

    const collections = [VaultLogger.COL, VaultLogger.GLYPH_COL, VaultLogger.METRICS_COL];
    let totalDeleted = 0;

    for (const collectionName of collections) {
      const q = query(
        collection(db, collectionName),
        where("timestamp", "<", cutoffTime)
      );

      const snapshot = await getDocs(q);
      console.log(`🗑️ Found ${snapshot.size} old logs in ${collectionName}`);

      // Note: Actual deletion would require batch operations
      // This is a placeholder for the count
      totalDeleted += snapshot.size;
    }

    return totalDeleted;
  }
}

// ============================================================================
// Singleton Logger Instance
// ============================================================================

export const vaultLogger = VaultLogger;

// ============================================================================
// Helper Functions
// ============================================================================

export async function logGlyphStateChange(event: GlyphStateChangeEvent): Promise<void> {
  return VaultLogger.logGlyphStateChange(event);
}

export async function logETSUpdate(event: GlyphETSUpdateEvent): Promise<void> {
  return VaultLogger.logETSUpdate(event);
}

export async function logMetricsUpdate(event: GlyphMetricsUpdateEvent): Promise<void> {
  return VaultLogger.logMetricsUpdate(event);
}

export async function logTransition(event: GlyphTransitionEvent): Promise<void> {
  return VaultLogger.logTransition(event);
}
