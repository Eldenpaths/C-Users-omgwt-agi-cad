import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase/client';

export interface TelemetryEvent {
  userId: string;
  agentId?: string;
  labType?: 'plasma' | 'spectral' | 'chemistry' | 'crypto' | string;
  event: string;
  timestamp?: number; // client-provided optional epoch ms
  meta?: Record<string, unknown>;
}

/**
 * Telemetry logger for user + agent events. Writes to Firestore `telemetry`.
 */
export class Telemetry {
  /**
   * Logs a telemetry event. Safe to call on client; no-op during SSR if Firestore is not available.
   */
  static async logEvent(event: TelemetryEvent): Promise<void> {
    try {
      const db = getDbInstance();
      if (!db) return; // SSR/build path: skip
      const payload = {
        ...event,
        timestamp: event.timestamp ?? Date.now(),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'telemetry'), payload);
    } catch (err) {
      // Swallow to avoid runtime breaks; surface in console for debugging
      console.warn('[Telemetry.logEvent] failed:', err);
    }
  }
}

export default Telemetry;

