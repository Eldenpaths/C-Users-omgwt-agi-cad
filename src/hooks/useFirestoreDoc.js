// /hooks/useFirestoreDoc.js
"use client";
import { useEffect, useRef, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import useDebouncedCallback from "./useDebouncedCallback.js";
import { db } from '../lib/firebase-legacy.js';
import { syncStatusManager } from "../lib/syncStatus.js";

export function useFirestoreDoc({
  path,
  initial = {},
  writeDelay = 600,
  sourceTag = "client"
}) {
  const [data, setDataState] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const localVersionRef = useRef(0);
  const lastWriteHash = useRef(null);
  const unsubRef = useRef(null);

  // ---------- SUBSCRIBE ----------
  useEffect(() => {
    if (!path) return;
    setLoading(true);
    if (unsubRef.current) unsubRef.current();

    const ref = doc(db, path);
    unsubRef.current = onSnapshot(
      ref,
      (snap) => {
        const serverData = snap.exists() ? snap.data() : initial;
        setDataState((current) => {
          const localVer = localVersionRef.current;
          const serverVer = serverData?._updatedAt?.toMillis?.() || 0;
          if (localVer > serverVer) return current;
          return serverData;
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [path]);

  // ---------- WRITE ----------
  const saveDebounced = useDebouncedCallback(async (next) => {
    if (!path) return;
    const writeId = `${path}-${Date.now()}`;
    const completeWrite = syncStatusManager.registerWrite(writeId);

    try {
      const { _updatedAt, _version, _source, ...core } = next ?? {};
      const hash = JSON.stringify(core);
      if (hash === lastWriteHash.current) {
        completeWrite();
        return;
      }
      lastWriteHash.current = hash;

      const ref = doc(db, path);
      const predicted = Date.now(); // local guess
      await setDoc(
        ref,
        {
          ...next,
          _clientWriteTime: predicted,
          _updatedAt: serverTimestamp(),
          _source: sourceTag
        },
        { merge: true }
      );

      // read authoritative version from server
      const snap = await getDoc(ref);
      const serverVersion = snap.data()?._updatedAt?.toMillis?.() || 0;
      localVersionRef.current = serverVersion;
    } catch (e) {
      console.error("Firestore write error:", e);
      setError(e);
    } finally {
      completeWrite();
    }
  }, writeDelay);

  // ---------- STATE SETTER ----------
  function setData(next) {
    localVersionRef.current = Date.now();
    setDataState(next);
    saveDebounced(next);
  }

  return { data, setData, loading, error };
}
