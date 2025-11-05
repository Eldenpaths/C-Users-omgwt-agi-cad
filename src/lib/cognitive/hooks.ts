import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import type { CVRASuggestion } from './interface';

/**
 * Subscribe to CVRA suggestions for a given user.
 */
export function useCVRAResults(userId?: string) {
  const [data, setData] = useState<CVRASuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const db = getFirestoreInstance();
  const qRef = useMemo(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'cvra_suggestions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [db, userId]);

  useEffect(() => {
    if (!qRef) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CVRASuggestion)));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [qRef]);

  return { data, loading, error };
}

export default useCVRAResults;

