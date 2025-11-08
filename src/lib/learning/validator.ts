import { z } from 'zod';

/**
 * Zod schemas for lab experiment payloads.
 * These are intentionally minimal but capture core structure used across labs.
 */

export const BaseExperimentSchema = z.object({
  experimentId: z.string().min(1),
  userId: z.string().min(1),
  agentId: z.string().min(1),
  labType: z.enum(['plasma', 'spectral', 'chemistry', 'crypto']),
  timestamp: z.number().int().nonnegative(),
  runtimeMs: z.number().int().nonnegative().optional().default(0),
  success: z.boolean().optional().default(true),
  error: z.string().optional(),
  summary: z.string().optional().default(''),
});

const PlasmaMetricsSchema = z.object({
  energyInputJ: z.number().nonnegative(),
  plasmaTempK: z.number().positive(),
  confinementStability: z.number().min(0).max(1),
});

const SpectralMetricsSchema = z.object({
  wavelengthNm: z.number().positive(),
  intensity: z.number().nonnegative(),
  snr: z.number().nonnegative(),
});

const ChemistryMetricsSchema = z.object({
  yieldPct: z.number().min(0).max(100),
  purityPct: z.number().min(0).max(100),
  reactionTimeSec: z.number().nonnegative(),
});

const CryptoMetricsSchema = z.object({
  throughputTxS: z.number().nonnegative(),
  latencyMs: z.number().nonnegative(),
  errorRate: z.number().min(0).max(1),
});

export const PlasmaExperimentSchema = BaseExperimentSchema.extend({
  labType: z.literal('plasma'),
  metrics: PlasmaMetricsSchema,
});

export const SpectralExperimentSchema = BaseExperimentSchema.extend({
  labType: z.literal('spectral'),
  metrics: SpectralMetricsSchema,
});

export const ChemistryExperimentSchema = BaseExperimentSchema.extend({
  labType: z.literal('chemistry'),
  metrics: ChemistryMetricsSchema,
});

export const CryptoExperimentSchema = BaseExperimentSchema.extend({
  labType: z.literal('crypto'),
  metrics: CryptoMetricsSchema,
});

export type PlasmaExperiment = z.infer<typeof PlasmaExperimentSchema>;
export type SpectralExperiment = z.infer<typeof SpectralExperimentSchema>;
export type ChemistryExperiment = z.infer<typeof ChemistryExperimentSchema>;
export type CryptoExperiment = z.infer<typeof CryptoExperimentSchema>;

export type AnyExperiment =
  | PlasmaExperiment
  | SpectralExperiment
  | ChemistryExperiment
  | CryptoExperiment;

/**
 * Validate incoming experiment data based on lab type.
 * Throws ZodError on invalid payloads.
 */
export function validateExperiment(labType: AnyExperiment['labType'], data: unknown): AnyExperiment {
  switch (labType) {
    case 'plasma':
      return PlasmaExperimentSchema.parse(data);
    case 'spectral':
      return SpectralExperimentSchema.parse(data);
    case 'chemistry':
      return ChemistryExperimentSchema.parse(data);
    case 'crypto':
      return CryptoExperimentSchema.parse(data);
    default:
      throw new Error(`Unsupported labType: ${String((data as any)?.labType ?? labType)}`);
  }
}

export const LabSchemas = {
  plasma: PlasmaExperimentSchema,
  spectral: SpectralExperimentSchema,
  chemistry: ChemistryExperimentSchema,
  crypto: CryptoExperimentSchema,
};

export type LabType = keyof typeof LabSchemas;

