// /hooks/useFirestoreCollection.js
"use client";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
  increment
} from "firebase/firestore";
import { db } from '../lib/firebase-legacy.js';
import { incPending, decPending } from "../lib/syncFlag.js";

export function useFirestoreCollection({
  path,
  orderByField = "_updatedAt",
  direction = "desc",
  sourceTag = "client"
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!path) return;
    setLoading(true);
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // Normalize path for modular API: supply segments instead of a single even-segment string
    const segs = Array.isArray(path) ? path : String(path).split('/').filter(Boolean);
    const q = query(collection(db, ...segs), orderBy(orderByField, direction));
    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [path, orderByField, direction]);

  async function addOne(payload) {
    try {
      incPending();
      const batch = writeBatch(db);
      const segs = Array.isArray(path) ? path : String(path).split('/').filter(Boolean);
      const itemsCol = collection(db, ...segs);
      const newDocRef = doc(itemsCol);

      batch.set(newDocRef, {
        ...payload,
        _source: sourceTag,
        _createdAt: serverTimestamp(),
        _updatedAt: serverTimestamp()
      });

      if (String(path).endsWith("/vault/items")) {
        const metaSegs = (String(path).slice(0, -"/items".length) + "/_meta").split('/').filter(Boolean);
        batch.set(doc(db, ...metaSegs), { count: increment(1) }, { merge: true });
      }

      await batch.commit();
      decPending();
    } catch (e) {
      setError(e);
      decPending();
    }
  }

  async function updateOne(id, patch) {
    try {
      incPending();
      const segs = Array.isArray(path) ? path : String(path).split('/').filter(Boolean);
      await updateDoc(doc(db, ...segs, id), {
        ...patch,
        _source: sourceTag,
        _updatedAt: serverTimestamp()
      });
      decPending();
    } catch (e) {
      setError(e);
      decPending();
    }
  }

  async function removeOne(id) {
    try {
      incPending();
      const segs = Array.isArray(path) ? path : String(path).split('/').filter(Boolean);
      await deleteDoc(doc(db, ...segs, id));
      decPending();
    } catch (e) {
      setError(e);
      decPending();
    }
  }

  return { items, loading, error, addOne, updateOne, removeOne };
}
