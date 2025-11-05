import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import type { LabType } from './validator';

export interface LearningSessionDoc<T = any> {
  id: string;
  userId: string;
  agentId?: string;
  labType: LabType | string;
  data: T;
  summary: string;
  metrics?: { success: boolean; runtimeMs?: number; errorCount?: number };
  createdAt?: any;
}

interface HookState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe to real-time learning sessions for a user.
 */
export function useLearningSessions(userId?: string) {
  const [state, setState] = useState<HookState<LearningSessionDoc>>({ data: [], loading: true, error: null });
  const db = getFirestoreInstance();

  const qRef = useMemo(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'learning_sessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [db, userId]);

  useEffect(() => {
    if (!qRef) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const items: LearningSessionDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LearningSessionDoc));
        setState({ data: items, loading: false, error: null });
      },
      (err) => setState({ data: [], loading: false, error: err.message })
    );
    return () => unsub();
  }, [qRef]);

  return state;
}

export interface TelemetryDoc {
  id: string;
  userId?: string;
  agentId?: string;
  labType?: LabType | string;
  event: string;
  createdAt?: any;
  clientTimestamp?: any;
  payload?: Record<string, any>;
}

/**
 * Subscribe to a real-time telemetry feed for an agent.
 */
export function useTelemetryFeed(agentId?: string) {
  const [state, setState] = useState<HookState<TelemetryDoc>>({ data: [], loading: true, error: null });
  const db = getFirestoreInstance();

  const qRef = useMemo(() => {
    if (!db || !agentId) return null;
    return query(
      collection(db, 'telemetry'),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    );
  }, [db, agentId]);

  useEffect(() => {
    if (!qRef) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const items: TelemetryDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TelemetryDoc));
        setState({ data: items, loading: false, error: null });
      },
      (err) => setState({ data: [], loading: false, error: err.message })
    );
    return () => unsub();
  }, [qRef]);

  return state;
}

