// COMPATIBILITY LAYER - Re-export from canonical files
// This file exists for backward compatibility with existing imports
// TODO: Gradually migrate all imports to use firebase/admin.ts directly

export { adminAuth, adminDb } from './firebase/admin';