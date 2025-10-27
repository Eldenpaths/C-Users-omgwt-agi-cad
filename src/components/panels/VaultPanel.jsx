// VaultPanel.jsx
"use client";
import { useMemo, useState } from "react";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection.js";
import { auth } from "../../lib/firebase.js";

export default function VaultPanel() {
  const uid = auth.currentUser?.uid;
  const basePath = useMemo(() => (uid ? `users/${uid}/vault/items` : null), [uid]);
  const { items, loading, error, addOne, updateOne, removeOne } =
    useFirestoreCollection({ path: basePath ?? "noop/blocked", orderByField: "_updatedAt", direction: "desc" });

  const [draft, setDraft] = useState("");

  if (!uid) return <div className="p-6 text-sm text-yellow-400">Sign in to load Vault.</div>;
  if (loading) return <div className="p-6">Loading Vault…</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error.message}</div>;

  async function addItem() {
    const text = draft.trim();
    if (!text) return;
    await addOne({ text, status: "active" });
    setDraft("");
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add to Vault…"
          className="flex-1 rounded-xl bg-neutral-900/50 border border-neutral-700 px-3 py-2"
        />
        <button onClick={addItem} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">Add</button>
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 border border-neutral-700 rounded-xl p-3 bg-neutral-900/40">
            <input
              className="flex-1 bg-transparent outline-none"
              value={it.text ?? ""}
              onChange={(e) => updateOne(it.id, { text: e.target.value })}
            />
            <button onClick={() => removeOne(it.id)} className="text-red-300 hover:text-red-200 text-sm">Delete</button>
          </li>
        ))}
      </ul>

      <div className="text-xs text-neutral-500">
        Path: <code>users/{uid}/vault/items</code>
      </div>
    </div>
  );
}

