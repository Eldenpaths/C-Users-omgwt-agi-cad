import { z, ZodIssue } from 'zod';

/**
 * LabType represents the recognized labs supported by the Learning subsystem.
 */
export type LabType = 'plasma' | 'spectral' | 'chemistry' | 'crypto';

/**
 * Zod schemas for each lab domain.
 * These are intentionally concise but production-ready, with extensible fields.
 */
const PlasmaSchema = z.object({
  experimentId: z.string().min(1),
  temperatureKeV: z.number().positive().finite(),
  density: z.number().positive().finite(),
  confinementTimeMs: z.number().nonnegative().finite(),
  magneticFieldT: z.number().nonnegative().finite().optional(),
  runtimeMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errors: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const SpectralSchema = z.object({
  experimentId: z.string().min(1),
  wavelengthsNm: z.array(z.number().positive().finite()).min(1),
  intensities: z.array(z.number().nonnegative().finite()).min(1),
  method: z.enum(['FTIR', 'Raman', 'UV-Vis', 'NMR', 'Other']).default('Other'),
  runtimeMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => d.wavelengthsNm.length === d.intensities.length, {
  message: 'wavelengthsNm and intensities must be same length',
});

const ChemistrySchema = z.object({
  experimentId: z.string().min(1),
  reaction: z.string().min(1),
  reagents: z.array(z.object({ name: z.string(), quantity: z.number().finite() })).min(1),
  yieldPercent: z.number().min(0).max(100),
  temperatureC: z.number().finite().optional(),
  ph: z.number().min(0).max(14).optional(),
  runtimeMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errors: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const CryptoSchema = z.object({
  experimentId: z.string().min(1),
  strategy: z.string().min(1),
  market: z.enum(['spot', 'futures']).default('spot'),
  pair: z.string().min(3),
  trades: z.number().int().nonnegative(),
  profitPct: z.number().finite(),
  maxDrawdownPct: z.number().finite().optional(),
  runtimeMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errors: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type PlasmaData = z.infer<typeof PlasmaSchema>;
export type SpectralData = z.infer<typeof SpectralSchema>;
export type ChemistryData = z.infer<typeof ChemistrySchema>;
export type CryptoData = z.infer<typeof CryptoSchema>;

export type LabDataMap = {
  plasma: PlasmaData;
  spectral: SpectralData;
  chemistry: ChemistryData;
  crypto: CryptoData;
};

const schemaMap: Record<LabType, z.ZodTypeAny> = {
  plasma: PlasmaSchema,
  spectral: SpectralSchema,
  chemistry: ChemistrySchema,
  crypto: CryptoSchema,
};

export type ValidationSuccess<T extends LabType> = { success: true; data: LabDataMap[T] };
export type ValidationFailure = { success: false; errors: ZodIssue[] };
export type ValidationResult<T extends LabType> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validate arbitrary experiment payload for a given lab.
 * Returns typed data on success; normalized error list on failure.
 */
export function validateExperiment<T extends LabType>(
  labType: T,
  data: unknown
): ValidationResult<T> {
  const schema = schemaMap[labType];
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues } as ValidationFailure;
  }
  return { success: true, data: parsed.data } as ValidationSuccess<T>;
}

/**
 * Utility helper to humanize Zod issues for UI or logs.
 */
export function formatZodIssues(issues: ZodIssue[]): string[] {
  return issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`);
}

