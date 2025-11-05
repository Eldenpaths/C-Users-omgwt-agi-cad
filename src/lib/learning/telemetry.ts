import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import type { LabType } from './validator';

/**
 * Telemetry event payload for tracking user and agent actions across labs.
 */
export interface TelemetryEvent {
  userId?: string;
  agentId?: string;
  labType?: LabType | string;
  event: string;
  timestamp?: Date;
  payload?: Record<string, unknown>;
}

/**
 * Telemetry logger for Learning Infrastructure Core.
 * Writes events to Firestore collection `telemetry`.
 */
export class Telemetry {
  /**
   * Log a single event to the `telemetry` collection.
   * Safely no-ops during SSR if Firestore is not available.
   */
  static async logEvent(evt: TelemetryEvent): Promise<void> {
    const db = getFirestoreInstance();
    if (!db) {
      if (typeof window === 'undefined') {
        // SSR-safe: skip logging without failing
        return;
      }
      console.warn('[Telemetry] Firestore is not initialized; skipping logEvent');
      return;
    }

    try {
      await addDoc(collection(db, 'telemetry'), {
        ...evt,
        // Firestore canonical timestamp for consistent server time
        createdAt: serverTimestamp(),
        // Preserve a client-observed local time for audit trails
        clientTimestamp: evt.timestamp ?? new Date(),
      });
    } catch (err) {
      console.error('[Telemetry] Failed to log event:', err);
      // Swallow errors to not impact UX
    }
  }
}

export default Telemetry;

