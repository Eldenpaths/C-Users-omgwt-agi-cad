/**
 * Live task constraints registry (in-memory) with subscription support.
 * Server API persists to Firestore; client can subscribe via Firestore or WS.
 */

import type { TaskConstraints, TaskType } from './tasks'

type Listener = (type: TaskType, constraints: TaskConstraints) => void

const store = new Map<TaskType, TaskConstraints>()
const listeners = new Set<Listener>()

export function getConstraints(type: TaskType): TaskConstraints | undefined {
  return store.get(type)
}

export function setConstraints(type: TaskType, constraints: TaskConstraints) {
  store.set(type, constraints)
  for (const l of listeners) l(type, constraints)
}

export function subscribeConstraints(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

