// /components/panels/ForgePanel.jsx
"use client";
import { useMemo } from "react";
import { useFirestoreDoc } from "../../hooks/useFirestoreDoc.js";
import { auth } from "../../lib/firebase.js";

export default function ForgePanel() {
  const uid = auth.currentUser?.uid;
  const path = useMemo(() => (uid ? `users/${uid}/forge/state` : null), [uid]);

  const { data, setData, loading, error } = useFirestoreDoc({
    path: path ?? "noop/blocked",
    initial: { content: "", title: "Untitled Forge" },
    writeDelay: 600,
    sourceTag: "client"
  });

  if (!uid) return <div className="p-6 text-sm text-yellow-400">Sign in to load Forge.</div>;
  if (loading) return <div className="p-6">Loading Forge…</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error.message}</div>;

  const onChange = (key) => (e) => {
    const next = { ...data, [key]: e.target.value };
    setData(next); // Local Echo + debounced write
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <input
          value={data.title ?? ""}
          onChange={onChange("title")}
          placeholder="Forge Title"
          className="w-full rounded-xl bg-neutral-900/50 border border-neutral-700 px-3 py-2"
        />
        <span className="text-xs text-neutral-500">auto-saved</span>
      </div>

      <textarea
        value={data.content ?? ""}
        onChange={onChange("content")}
        placeholder="Type design notes, JSON, or commands…"
        rows={12}
        className="w-full rounded-xl bg-neutral-900/50 border border-neutral-700 px-3 py-3 font-mono"
      />

      <div className="text-xs text-neutral-500">
        Path: <code>users/{uid}/forge/state</code>
      </div>
    </div>
  );
}
