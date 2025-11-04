/**
 * CANONICAL DATA SCHEMAS
 *
 * Zod schemas for all lab outputs and VAULT entries.
 * These schemas ensure data consistency across the platform and enable CVRA analysis.
 *
 * Philosophy:
 * - Every lab output has a canonical schema
 * - All VAULT saves are validated
 * - Schemas evolve with the platform (versioned)
 * - Validation errors are logged for CVRA learning
 *
 * Phase 19A: Initial schema definitions
 */

import { z } from 'zod';

// ============================================================
// CORE SCHEMAS
// ============================================================

/**
 * Base experiment result that all lab outputs extend
 */
export const BaseExperimentSchema = z.object({
  id: z.string().uuid().optional(),
  labId: z.string(),
  labName: z.string(),
  timestamp: z.coerce.date(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),

  // Metadata
  version: z.string().default('1.0.0'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

/**
 * VAULT entry - top-level saved experiment
 */
export const VaultEntrySchema = BaseExperimentSchema.extend({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),

  // Lab-specific data (validated separately)
  data: z.record(z.any()),

  // Results and metrics
  results: z.object({
    success: z.boolean(),
    metrics: z.record(z.number()).optional(),
    visualizations: z.array(z.string()).optional(), // URLs or base64
    errors: z.array(z.string()).default([]),
  }),

  // Relationships
  relatedExperiments: z.array(z.string()).default([]),
  derivedFrom: z.string().optional(),

  // Status
  status: z.enum(['draft', 'completed', 'archived', 'failed']).default('completed'),
  visibility: z.enum(['private', 'team', 'public']).default('private'),
});

export type VaultEntry = z.infer<typeof VaultEntrySchema>;

// ============================================================
// CHEMISTRY LAB SCHEMAS
// ============================================================

/**
 * Chemical element
 */
export const ElementSchema = z.object({
  symbol: z.string().length(1).or(z.string().length(2)),
  name: z.string(),
  atomicMass: z.number().positive(),
  valence: z.number().int().positive(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
});

/**
 * Atom in a molecule
 */
export const AtomSchema = z.object({
  id: z.string(),
  element: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

/**
 * Bond between atoms
 */
export const BondSchema = z.object({
  id: z.string(),
  atom1: z.string(),
  atom2: z.string(),
  type: z.enum(['single', 'double', 'triple']),
  energy: z.number().positive().optional(),
});

/**
 * Molecule structure
 */
export const MoleculeSchema = z.object({
  id: z.string(),
  name: z.string(),
  formula: z.string(),
  atoms: z.array(AtomSchema),
  bonds: z.array(BondSchema),
  molecularWeight: z.number().positive(),
  energy: z.number().optional(),
  polarity: z.enum(['polar', 'nonpolar']).optional(),
});

/**
 * Chemistry lab experiment
 */
export const ChemistryExperimentSchema = BaseExperimentSchema.extend({
  labId: z.literal('chemistry'),

  data: z.object({
    molecule: MoleculeSchema,
    reaction: z.object({
      reactants: z.array(MoleculeSchema).optional(),
      products: z.array(MoleculeSchema).optional(),
      catalysts: z.array(z.string()).optional(),
      conditions: z.object({
        temperature: z.number().optional(),
        pressure: z.number().optional(),
        pH: z.number().optional(),
      }).optional(),
    }).optional(),

    validation: z.object({
      valid: z.boolean(),
      errors: z.array(z.string()),
      warnings: z.array(z.string()).default([]),
    }),
  }),
});

export type ChemistryExperiment = z.infer<typeof ChemistryExperimentSchema>;

// ============================================================
// CRYPTO LAB SCHEMAS
// ============================================================

/**
 * Trade execution
 */
export const TradeSchema = z.object({
  id: z.string(),
  timestamp: z.coerce.date(),
  asset: z.string(),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  profit: z.number().optional(),
  botId: z.string().optional(),
});

/**
 * Trading bot performance
 */
export const BotPerformanceSchema = z.object({
  botId: z.string(),
  botName: z.string(),
  strategy: z.enum(['trend', 'mean-reversion', 'arbitrage', 'sentiment']),

  portfolio: z.object({
    cash: z.number(),
    holdings: z.record(z.number()),
    totalValue: z.number(),
  }),

  performance: z.object({
    trades: z.number().int().nonnegative(),
    winRate: z.number().min(0).max(1),
    totalPnL: z.number(),
    sharpeRatio: z.number().optional(),
    maxDrawdown: z.number().optional(),
  }),

  trades: z.array(TradeSchema).optional(),
});

/**
 * Market state snapshot
 */
export const MarketStateSchema = z.object({
  timestamp: z.coerce.date(),
  assets: z.array(z.object({
    symbol: z.string(),
    name: z.string(),
    price: z.number().positive(),
    volume: z.number().nonnegative(),
    change24h: z.number(),
  })),
});

/**
 * Crypto lab experiment
 */
export const CryptoExperimentSchema = BaseExperimentSchema.extend({
  labId: z.literal('crypto-market'),

  data: z.object({
    bots: z.array(BotPerformanceSchema),
    marketState: MarketStateSchema,

    summary: z.object({
      totalTrades: z.number().int().nonnegative(),
      totalPnL: z.number(),
      bestBot: z.string().optional(),
      worstBot: z.string().optional(),
      duration: z.number().positive(), // milliseconds
    }),
  }),
});

export type CryptoExperiment = z.infer<typeof CryptoExperimentSchema>;

// ============================================================
// PLASMA LAB SCHEMAS
// ============================================================

/**
 * Plasma state
 */
export const PlasmaStateSchema = z.object({
  temperature: z.number().positive(), // Kelvin
  density: z.number().positive(),     // particles/m³
  ionization: z.number().min(0).max(1), // 0-100%
  pressure: z.number().nonnegative(),

  composition: z.record(z.number()).optional(), // element -> percentage
});

/**
 * Plasma lab experiment
 */
export const PlasmaExperimentSchema = BaseExperimentSchema.extend({
  labId: z.literal('plasma'),

  data: z.object({
    initialState: PlasmaStateSchema,
    finalState: PlasmaStateSchema.optional(),

    measurements: z.array(z.object({
      timestamp: z.number(), // relative to experiment start
      state: PlasmaStateSchema,
    })).optional(),

    parameters: z.object({
      duration: z.number().positive().optional(),
      energyInput: z.number().nonnegative().optional(),
    }).optional(),
  }),
});

export type PlasmaExperiment = z.infer<typeof PlasmaExperimentSchema>;

// ============================================================
// SPECTRAL LAB SCHEMAS
// ============================================================

/**
 * Wavelength measurement
 */
export const WavelengthSchema = z.object({
  wavelength: z.number().positive(), // nanometers
  intensity: z.number().min(0).max(1),
  color: z.string().optional(),
});

/**
 * Spectrum analysis
 */
export const SpectrumSchema = z.object({
  type: z.enum(['emission', 'absorption', 'continuous']),
  wavelengths: z.array(WavelengthSchema),

  range: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }),

  peaks: z.array(z.object({
    wavelength: z.number(),
    intensity: z.number(),
    identified: z.string().optional(), // element or compound
  })).optional(),
});

/**
 * Spectral lab experiment
 */
export const SpectralExperimentSchema = BaseExperimentSchema.extend({
  labId: z.literal('spectral'),

  data: z.object({
    spectrum: SpectrumSchema,

    analysis: z.object({
      dominantWavelength: z.number().positive().optional(),
      elementalComposition: z.record(z.number()).optional(),
      spectralClass: z.string().optional(),
    }).optional(),
  }),
});

export type SpectralExperiment = z.infer<typeof SpectralExperimentSchema>;

// ============================================================
// SCHEMA REGISTRY
// ============================================================

/**
 * Registry of all lab schemas
 * Maps labId -> schema
 */
export const LAB_SCHEMAS = {
  chemistry: ChemistryExperimentSchema,
  'crypto-market': CryptoExperimentSchema,
  plasma: PlasmaExperimentSchema,
  spectral: SpectralExperimentSchema,
} as const;

export type LabId = keyof typeof LAB_SCHEMAS;

/**
 * Validate lab data against its schema
 */
export function validateLabData(labId: string, data: any): {
  success: boolean;
  data?: any;
  errors?: z.ZodError;
} {
  const schema = LAB_SCHEMAS[labId as LabId];

  if (!schema) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: ['labId'],
          message: `Unknown lab: ${labId}`,
        },
      ]),
    };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Validate VAULT entry
 */
export function validateVaultEntry(entry: any): {
  success: boolean;
  data?: VaultEntry;
  errors?: z.ZodError;
} {
  const result = VaultEntrySchema.safeParse(entry);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Extract validation errors as strings
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

/**
 * Log validation failure (for CVRA analysis)
 */
export async function logValidationFailure(
  labId: string,
  data: any,
  errors: z.ZodError
): Promise<void> {
  try {
    // Import here to avoid circular dependency
    const { logAgentAction } = await import('../logging/agent-tracer');

    await logAgentAction({
      agentId: 'validation-system',
      agentType: 'system',
      action: 'schema_validation_failed',
      input: { labId, data },
      output: { errors: formatValidationErrors(errors) },
      timestamp: new Date(),
      duration: 0,
      confidence: 0,
      errors: formatValidationErrors(errors),
      warnings: [],
      metadata: {
        labId,
      },
    });
  } catch (error) {
    console.error('[Schema] Failed to log validation failure:', error);
  }
}

/**
 * Example usage:
 *
 * // Validate chemistry experiment
 * const result = validateLabData('chemistry', {
 *   labId: 'chemistry',
 *   labName: 'Chemistry Lab',
 *   timestamp: new Date(),
 *   data: {
 *     molecule: { ... },
 *     validation: { valid: true, errors: [] }
 *   }
 * });
 *
 * if (!result.success) {
 *   console.error('Validation failed:', formatValidationErrors(result.errors!));
 *   await logValidationFailure('chemistry', data, result.errors!);
 * }
 *
 * // Validate VAULT entry
 * const vaultResult = validateVaultEntry({
 *   title: 'My Experiment',
 *   labId: 'chemistry',
 *   labName: 'Chemistry Lab',
 *   timestamp: new Date(),
 *   data: { ... },
 *   results: { success: true }
 * });
 */
