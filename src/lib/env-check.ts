/**
 * Environment Variable Validation
 * Ensures all required environment variables are set before app starts
 *
 * Phase 19-FINAL: Production readiness check
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  // Firebase (required)
  {
    key: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    required: true,
    description: 'Firebase API key',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    required: true,
    description: 'Firebase auth domain',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    required: true,
    description: 'Firebase project ID',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    required: true,
    description: 'Firebase storage bucket',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    required: true,
    description: 'Firebase messaging sender ID',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    required: true,
    description: 'Firebase app ID',
  },

  // OpenAI (optional - for agents)
  {
    key: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for agent features',
  },

  // Pinecone (optional - for similarity search)
  {
    key: 'PINECONE_API_KEY',
    required: false,
    description: 'Pinecone API key for vector search',
  },
  {
    key: 'PINECONE_ENVIRONMENT',
    required: false,
    description: 'Pinecone environment',
  },
  {
    key: 'PINECONE_INDEX_NAME',
    required: false,
    description: 'Pinecone index name',
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];

    if (!value) {
      if (envVar.required) {
        errors.push(`Missing required environment variable: ${envVar.key} (${envVar.description})`);
      } else {
        warnings.push(`Missing optional environment variable: ${envVar.key} (${envVar.description})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results
 */
export function logEnvironmentStatus() {
  const result = validateEnvironment();

  if (result.valid) {
    console.log('✅ Environment variables validated successfully');
    if (result.warnings.length > 0) {
      console.warn('⚠️  Optional environment variables missing:');
      result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }
  } else {
    console.error('❌ Environment validation failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error('Missing required environment variables. Check console for details.');
  }

  return result;
}

/**
 * Get safe environment info (no sensitive data)
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasFirebase: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasPinecone: !!process.env.PINECONE_API_KEY,
    firebaseProject: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
}
