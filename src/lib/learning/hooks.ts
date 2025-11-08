import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase/client';

export interface LearningSessionDoc {
  experimentId: string;
  userId: string;
  agentId: string;
  labType: string;
  timestamp: number;
  runtimeMs?: number;
  success?: boolean;
  summary?: string;
}

export interface TelemetryDoc {
  userId: string;
  agentId?: string;
  labType?: string;
  event: string;
  timestamp: number;
  createdAt?: any;
}

/**
 * Subscribe to a user's learning_sessions in real-time.
 */
export function useLearningSessions(userId?: string) {
  const [sessions, setSessions] = useState<LearningSessionDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const db = getDbInstance();
    if (!db || !userId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'learning_sessions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => d.data() as LearningSessionDoc);
      setSessions(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  return { sessions, loading };
}

/**
 * Live telemetry feed for a specific agent.
 */
export function useTelemetryFeed(agentId?: string, max = 100) {
  const [events, setEvents] = useState<TelemetryDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const db = getDbInstance();
    if (!db || !agentId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'telemetry'),
      where('agentId', '==', agentId),
      orderBy('timestamp', 'desc'),
      limit(max),
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => d.data() as TelemetryDoc);
      setEvents(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [agentId, max]);

  return { events, loading };
}

export default { useLearningSessions, useTelemetryFeed };

