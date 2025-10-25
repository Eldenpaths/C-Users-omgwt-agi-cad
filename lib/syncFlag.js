// /lib/syncFlag.js
// Tiny global store to track "pending writes" across the whole app.

const listeners = new Set();
const state = { pendingCount: 0 };

export function incPending() {
  state.pendingCount += 1;
  emit();
}

export function decPending() {
  state.pendingCount = Math.max(0, state.pendingCount - 1);
  emit();
}

export function getPendingCount() {
  return state.pendingCount;
}

export function subscribe(cb) {
  listeners.add(cb);
  cb(state);
  return () => listeners.delete(cb);
}

function emit() {
  for (const cb of listeners) cb(state);
}
