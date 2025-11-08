/**
 * Learning Infrastructure Core — React Hooks
 *
 * Real-time Firestore hooks for learning sessions and telemetry streams.
 */

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where, Firestore, DocumentData } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';

export type LearningSession = {
  id: string;
  userId: string;
  agentId: string;
  labType: string;
  runId?: string;
  success?: boolean;
  runtimeMs?: number;
  createdAt?: any;
  [k: string]: any;
};

export type TelemetryRecord = {
  id: string;
  userId: string;
  agentId: string;
  labType: string;
  event: string;
  timestamp?: any;
  runId?: string;
  [k: string]: any;
};

/**
 * Subscribe to learning sessions for a user.
 */
export function useLearningSessions(userId?: string) {
  const db = getFirestoreInstance();
  const [data, setData] = useState<LearningSession[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const qRef = useMemo(() => {
    if (!db) return null;
    let col = collection(db, 'learning_sessions');
    const clauses = [] as any[];
    if (userId) clauses.push(where('userId', '==', userId));
    const qy = query(col, ...clauses, orderBy('createdAt', 'desc'));
    return qy;
  }, [db, userId]);

  useEffect(() => {
    if (!qRef) return;
    setLoading(true);
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows: LearningSession[] = [];
        snap.forEach((doc) => rows.push({ id: doc.id, ...(doc.data() as DocumentData) }));
        setData(rows);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [qRef]);

  return { data, loading, error };
}

/**
 * Subscribe to telemetry events for an agent.
 */
export function useTelemetryFeed(agentId?: string) {
  const db = getFirestoreInstance();
  const [data, setData] = useState<TelemetryRecord[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const qRef = useMemo(() => {
    if (!db) return null;
    let col = collection(db, 'telemetry');
    const clauses = [] as any[];
    if (agentId) clauses.push(where('agentId', '==', agentId));
    const qy = query(col, ...clauses, orderBy('timestamp', 'desc'));
    return qy;
  }, [db, agentId]);

  useEffect(() => {
    if (!qRef) return;
    setLoading(true);
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows: TelemetryRecord[] = [];
        snap.forEach((doc) => rows.push({ id: doc.id, ...(doc.data() as DocumentData) }));
        setData(rows);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [qRef]);

  return { data, loading, error };
}
/**
 * Subscribe to Learning batch telemetry events (e.g., learning.batch.commit / learning.batch.error)
 */
export function useLearningBatchTelemetry(limitN: number = 20) {
  const db = getFirestoreInstance();
  const [data, setData] = useState<TelemetryRecord[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const qRef = useMemo(() => {
    if (!db) return null;
    const col = collection(db, 'telemetry');
    const qy = query(col, orderBy('timestamp', 'desc'));
    return qy;
  }, [db]);

  useEffect(() => {
    if (!qRef) return;
    setLoading(true);
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows: TelemetryRecord[] = [];
        snap.forEach((doc) => {
          const d = { id: doc.id, ...(doc.data() as DocumentData) } as any;
          if (typeof d.event === 'string' && d.event.startsWith('learning.batch')) rows.push(d);
        });
        setData(rows.slice(0, limitN));
        setLoading(false);
      },
      (err) => { setError(err as Error); setLoading(false); }
    );
    return () => unsub();
  }, [qRef, limitN]);

  return { data, loading, error };
}
