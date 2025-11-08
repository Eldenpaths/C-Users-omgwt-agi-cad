/**
 * Learning Infrastructure Core
 *
 * This subsystem ingests lab experiment results, validates payloads,
 * logs telemetry, persists to Firestore (`learning_sessions`),
 * and optionally generates vector embeddings for long-term analysis.
 *
 * Exports:
 * - LearningCore: orchestrates ingest + embeddings
 * - validateExperiment: strict Zod validation per lab
 * - Telemetry: lightweight logger to `telemetry`
 * - analyzeLearning: aggregate analytics for dashboards
 * - Hooks: useLearningSessions, useTelemetryFeed for real-time UI
 */
export { LearningCore } from './learningCore';
export type { LearningCoreOptions, IngestResult } from './learningCore';
export { validateExperiment, LabSchemas } from './validator';
export type { AnyExperiment } from './validator';
export type { TelemetryEvent } from './telemetry';
export { default as Telemetry } from './telemetry';
export { analyzeLearning, analyzeLearningTrends } from './analyzer';
export { useLearningSessions, useTelemetryFeed } from './hooks';
