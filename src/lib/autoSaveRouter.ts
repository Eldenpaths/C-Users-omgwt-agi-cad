// src/lib/autoSaveRouter.ts
// Server-only periodic snapshot saver. Import in server runtime if desired.
import { saveSnapshot } from './routerStore.firestore'

if (typeof window === 'undefined') {
  setInterval(() => {
    saveSnapshot().catch(() => {})
  }, 10_000)
}

