/**
 * Learning Infrastructure Core - Validator
 *
 * Provides Zod schemas and a single entry point `validateExperiment`
 * to validate experiment payloads coming from different labs before
 * persisting to Firestore. Fully typed and extensible.
 */

import { z } from 'zod';

/** Supported lab types */
export type LabType = 'plasma' | 'spectral' | 'chemistry' | 'crypto';

/**
 * Common metadata shared by all lab submissions
 */
const CommonMetaSchema = z.object({
  userId: z.string().min(1, 'userId required'),
  agentId: z.string().min(1, 'agentId required'),
  runId: z.string().min(1, 'runId required'),
  startedAt: z.union([z.number(), z.date()]).optional(),
  finishedAt: z.union([z.number(), z.date()]).optional(),
  runtimeMs: z.number().nonnegative().optional(),
  success: z.boolean().optional(),
  notes: z.string().max(20000).optional(),
});

/** Plasma lab schema */
const PlasmaSchema = CommonMetaSchema.extend({
  labType: z.literal('plasma'),
  parameters: z.object({
    temperatureK: z.number().positive(),
    density: z.number().nonnegative(),
    magneticFieldT: z.number().optional(),
  }),
  measurements: z.object({
    confinementTimeMs: z.number().nonnegative(),
    energyOutputJ: z.number().nonnegative(),
    instabilityEvents: z.number().int().nonnegative().default(0),
  }),
});

/** Spectral lab schema */
const SpectralSchema = CommonMetaSchema.extend({
  labType: z.literal('spectral'),
  parameters: z.object({
    wavelengthNm: z.number().positive(),
    exposureMs: z.number().nonnegative(),
    sensorGain: z.number().nonnegative().default(1),
  }),
  measurements: z.object({
    peakIntensity: z.number().nonnegative(),
    snr: z.number().nonnegative(),
    spectrum: z.array(z.tuple([z.number(), z.number()])).optional(),
  }),
});

/** Chemistry lab schema */
const ChemistrySchema = CommonMetaSchema.extend({
  labType: z.literal('chemistry'),
  parameters: z.object({
    reagentA: z.string().min(1),
    reagentB: z.string().min(1),
    temperatureC: z.number(),
    pressureAtm: z.number().positive().optional(),
  }),
  measurements: z.object({
    yieldPercent: z.number().min(0).max(100),
    byproducts: z.array(z.string()).optional(),
    purityPercent: z.number().min(0).max(100).optional(),
  }),
});

/** Crypto lab schema */
const CryptoSchema = CommonMetaSchema.extend({
  labType: z.literal('crypto'),
  parameters: z.object({
    algorithm: z.enum(['sha256', 'blake3', 'rsa', 'secp256k1', 'ed25519']),
    payloadSizeBytes: z.number().int().nonnegative(),
    iterations: z.number().int().positive().default(1),
  }),
  measurements: z.object({
    throughputOps: z.number().nonnegative(),
    latencyMs: z.number().nonnegative(),
    errorRate: z.number().min(0).max(1).optional(),
  }),
});

/** Discriminated union over labType */
export const ExperimentSchema = z.discriminatedUnion('labType', [
  PlasmaSchema,
  SpectralSchema,
  ChemistrySchema,
  CryptoSchema,
]);

export type PlasmaExperiment = z.infer<typeof PlasmaSchema>;
export type SpectralExperiment = z.infer<typeof SpectralSchema>;
export type ChemistryExperiment = z.infer<typeof ChemistrySchema>;
export type CryptoExperiment = z.infer<typeof CryptoSchema>;
export type AnyExperiment = z.infer<typeof ExperimentSchema>;

/**
 * Validate experiment payload by lab type.
 * Throws ZodError on invalid shape. Returns typed data on success.
 */
export function validateExperiment<T extends LabType>(labType: T, data: unknown): AnyExperiment {
  return ExperimentSchema.parse({ ...(data as object), labType });
}

/**
 * Utility to safely coerce timestamps into JS Date for analytics.
 */
export function coerceDate(input?: number | Date): Date | undefined {
  if (input == null) return undefined;
  if (input instanceof Date) return input;
  return new Date(input);
}