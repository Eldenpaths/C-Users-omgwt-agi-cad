// lib/syncStatus.js
let state = {
  phase: "saved",    // "saved" | "saving" | "syncing" | "offline"
  pending: 0,
  lastWriteAt: null,
  lastSavedAt: null,
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
};
const listeners = new Set();

function notify() { for (const fn of listeners) fn({ ...state }); }

export function subscribe(listener) {
  listeners.add(listener);
  listener({ ...state }); // immediate push
  return () => listeners.delete(listener);
}

export function setOnline(online) {
  state.online = online;
  if (!online) state.phase = "offline";
  else if (state.pending === 0) state.phase = "saved";
  notify();
}

export function registerWrite() {
  state.pending += 1;
  state.lastWriteAt = Date.now();
  if (state.online) state.phase = "saving";
  notify();
}

export function markSyncing() {
  if (state.online) state.phase = "syncing";
  notify();
}

export function markSaved() {
  state.pending = Math.max(0, state.pending - 1);
  state.lastSavedAt = Date.now();
  if (state.online) state.phase = state.pending > 0 ? "saving" : "saved";
  notify();
}

export function getStatus() { return { ...state }; }

// wire browser connectivity
if (typeof window !== "undefined") {
  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => setOnline(false));
}
