"use client";
import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase.js";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";


export default function RecallConsole(){
const [qtext, setQtext] = useState("");
const [items, setItems] = useState([]);
const [submitting, setSubmitting] = useState(false);
const [collections, setCollections] = useState("commands,events,snapshots");


useEffect(() => {
const qk = query(collection(db, "vaultKnowledge"), orderBy("createdAt", "desc"), limit(100));
const un = onSnapshot(qk, (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
return () => un();
}, []);


const filtered = useMemo(() => {
const t = qtext.toLowerCase();
if (!t) return items;
return items.filter(i =>
(i.summary && i.summary.toLowerCase().includes(t)) ||
(i.path && i.path.toLowerCase().includes(t)) ||
(Array.isArray(i.tags) && i.tags.join(" ").toLowerCase().includes(t))
);
}, [qtext, items]);


async function mineNow(){
setSubmitting(true);
try {
const list = collections.split(",").map(s=>s.trim()).filter(Boolean);
await fetch("/api/mission", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ kind: "archive.mine", prompt: "crawl firestore", params: { collections: list, sample: 100 } }),
});
} finally { setSubmitting(false); }
}


return (
<div className="p-4 grid gap-4">
<div className="flex items-center gap-2">
<input value={qtext} onChange={e=>setQtext(e.target.value)} placeholder="Search knowledge..." className="border rounded px-3 py-2 flex-1" />
<input value={collections} onChange={e=>setCollections(e.target.value)} className="border rounded px-3 py-2 w-[320px]" />
<button onClick={mineNow} disabled={submitting} className="px-3 py-2 rounded bg-black text-white disabled:opacity-50">Mine</button>
</div>


<div className="space-y-2 max-h-[70vh] overflow-auto">
{filtered.map(i => (
<div key={i.id} className="border rounded p-3 text-sm">
<div className="flex items-center justify-between">
<span className="font-mono text-[11px]">{i.path}</span>
<span className="text-[11px] opacity-60">{(i.tags||[]).join(", ")}</span>
</div>
<div className="mt-1 whitespace-pre-wrap text-gray-800">{i.summary}</div>
</div>
))}
</div>
</div>
);
}