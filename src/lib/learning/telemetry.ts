/**
 * Learning Infrastructure Core — Telemetry
 *
 * Simple Firestore-backed telemetry logger for user/agent/lab events.
 * Usage: await Telemetry.logEvent({ userId, agentId, labType, event })
 */

import { collection, addDoc, serverTimestamp, CollectionReference, Firestore } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';

export type TelemetryEvent = {
  userId: string;
  agentId: string;
  labType: string;
  event: string;
  timestamp?: Date;
  runId?: string;
  meta?: Record<string, any>;
};

export class Telemetry {
  /** Firestore collection name */
  static collectionName = 'telemetry';

  /** Internal collection reference builder */
  private static collectionRef(db: Firestore): CollectionReference {
    return collection(db, Telemetry.collectionName) as CollectionReference;
  }

  /**
   * Log a telemetry event to Firestore.
   * Adds serverTimestamp if no timestamp is provided.
   */
  static async logEvent(eventData: TelemetryEvent): Promise<string> {
    const db = getFirestoreInstance();
    if (!db) throw new Error('Firestore is not available on server-side context.');

    const payload = {
      ...eventData,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(Telemetry.collectionRef(db), payload);
    return docRef.id;
  }
}