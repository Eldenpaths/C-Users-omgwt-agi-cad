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
import { db } from "../lib/firebase.js";
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

    const q = query(collection(db, path), orderBy(orderByField, direction));
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
      const itemsCol = collection(db, path);
      const newDocRef = doc(itemsCol);

      batch.set(newDocRef, {
        ...payload,
        _source: sourceTag,
        _createdAt: serverTimestamp(),
        _updatedAt: serverTimestamp()
      });

      if (path.endsWith("/vault/items")) {
        const metaPath = path.slice(0, -"/items".length) + "/_meta";
        batch.set(doc(db, metaPath), { count: increment(1) }, { merge: true });
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
      await updateDoc(doc(db, path, id), {
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
      await deleteDoc(doc(db, path, id));
      decPending();
    } catch (e) {
      setError(e);
      decPending();
    }
  }

  return { items, loading, error, addOne, updateOne, removeOne };
}
