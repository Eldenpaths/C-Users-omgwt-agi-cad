/**
 * Learning Infrastructure Core
 *
 * This subsystem ingests experiment data from AGI-CAD labs, validates it,
 * emits telemetry, persists canonical learning sessions to Firestore, and
 * generates Pinecone embeddings for long-term search and analysis. It also
 * exposes analytics utilities and React hooks for real-time dashboards.
 */

export * from './validator';
export * from './telemetry';
export * from './learningCore';
export * from './analyzer';
export * from './hooks';

