/**
 * Learning Infrastructure Core - Barrel Export
 *
 * The Learning subsystem coordinates experiment ingestion, validation,
 * telemetry, persistence, and analysis for AGI-CAD labs. It exposes:
 * - LearningCore: orchestrates ingestion + embeddings
 * - validateExperiment: Zod validation for lab payloads
 * - Telemetry: Firestore-backed event logger
 * - Analyzer: aggregate metrics for dashboards
 * - Hooks: React subscriptions for live sessions and telemetry
 */

export * from './learningCore';
export * from './validator';
export * from './telemetry';
export * from './analyzer';
export * from './hooks';