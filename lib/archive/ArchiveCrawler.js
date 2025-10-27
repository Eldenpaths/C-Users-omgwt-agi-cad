import { db } from "../../firebase.js";
import {
addDoc,
collection,
getDocs,
query,
orderBy,
limit,
serverTimestamp,
} from "firebase/firestore";


async function sha256(text) {
try {
const enc = new TextEncoder().encode(text);
const buf = await crypto.subtle.digest("SHA-256", enc);
return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
} catch {
return null; // best-effort
}
}


function summarize(text, max = 400) {
if (!text) return "";
const clean = String(text).replace(/\s+/g, " ").trim();
return clean.length <= max ? clean : clean.slice(0, max - 3) + "...";
}


/**
* addTextSource({ path, content, tags[] })
* - Directly index a text blob into vaultKnowledge
*/
export async function addTextSource({ path, content, tags = [] }) {
const checksum = await sha256(content || "");
const payload = {
path: path || "unknown",
tags,
bytes: (content || "").length,
checksum,
summary: summarize(content, 700),
createdAt: serverTimestamp(),
};
const ref = await addDoc(collection(db, "vaultKnowledge"), payload);
return { id: ref.id, ...payload };
}