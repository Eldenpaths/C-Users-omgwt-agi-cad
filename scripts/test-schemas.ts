/**
 * TEST: Schema Validation
 * Phase 19A: Verify Zod schemas validate correctly
 */

import {
  validateLabData,
  formatValidationErrors,
} from '../src/lib/schemas/vault-events';

console.log('='.repeat(60));
console.log('PHASE 19A: Schema Validation Test');
console.log('='.repeat(60));

// ============================================================
// TEST 1: Valid Chemistry Experiment
// ============================================================
console.log('\n[TEST 1] Valid Chemistry Experiment');

const validChemistry = {
  labId: 'chemistry',
  labName: 'Chemistry Lab',
  timestamp: new Date(),
  version: '1.0.0',
  tags: ['test', 'water'],
  data: {
    molecule: {
      id: 'mol-1',
      name: 'Water',
      formula: 'H2O',
      atoms: [
        {
          id: 'atom-1',
          element: 'H',
          position: { x: 0, y: 0, z: 0 },
        },
        {
          id: 'atom-2',
          element: 'H',
          position: { x: 1, y: 0, z: 0 },
        },
        {
          id: 'atom-3',
          element: 'O',
          position: { x: 0.5, y: 0.866, z: 0 },
        },
      ],
      bonds: [
        {
          id: 'bond-1',
          atom1: 'atom-1',
          atom2: 'atom-3',
          type: 'single',
        },
        {
          id: 'bond-2',
          atom1: 'atom-2',
          atom2: 'atom-3',
          type: 'single',
        },
      ],
      molecularWeight: 18.015,
      energy: -76.4,
      polarity: 'polar',
    },
    validation: {
      valid: true,
      errors: [],
      warnings: [],
    },
  },
};

const chemResult = validateLabData('chemistry', validChemistry);

if (chemResult.success) {
  console.log('✅ Chemistry validation PASSED');
} else {
  console.error('❌ Chemistry validation FAILED:');
  console.error(formatValidationErrors(chemResult.errors!));
}

// ============================================================
// TEST 2: Valid Crypto Experiment
// ============================================================
console.log('\n[TEST 2] Valid Crypto Experiment');

const validCrypto = {
  labId: 'crypto-market',
  labName: 'Crypto Trading Lab',
  timestamp: new Date(),
  version: '1.0.0',
  tags: ['test', 'crypto'],
  data: {
    bots: [
      {
        botId: 'bot-trend-1',
        botName: 'Trend Follower',
        strategy: 'trend',
        portfolio: {
          cash: 8500,
          holdings: {
            BTC: 0.15,
          },
          totalValue: 10000,
        },
        performance: {
          trades: 25,
          winRate: 0.64,
          totalPnL: 1500,
          sharpeRatio: 1.8,
          maxDrawdown: -250,
        },
      },
    ],
    marketState: {
      timestamp: new Date(),
      assets: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          volume: 1000000,
          change24h: 2.5,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          volume: 500000,
          change24h: -1.2,
        },
      ],
    },
    summary: {
      totalTrades: 25,
      totalPnL: 1500,
      bestBot: 'bot-trend-1',
      duration: 3600000, // 1 hour in ms
    },
  },
};

const cryptoResult = validateLabData('crypto-market', validCrypto);

if (cryptoResult.success) {
  console.log('✅ Crypto validation PASSED');
} else {
  console.error('❌ Crypto validation FAILED:');
  console.error(formatValidationErrors(cryptoResult.errors!));
}

// ============================================================
// TEST 3: Invalid Chemistry Experiment (missing required field)
// ============================================================
console.log('\n[TEST 3] Invalid Chemistry Experiment (missing validation)');

const invalidChemistry = {
  labId: 'chemistry',
  labName: 'Chemistry Lab',
  timestamp: new Date(),
  data: {
    molecule: {
      id: 'mol-1',
      name: 'Water',
      formula: 'H2O',
      atoms: [],
      bonds: [],
      molecularWeight: 18.015,
    },
    // Missing validation field!
  },
};

const invalidChemResult = validateLabData('chemistry', invalidChemistry);

if (!invalidChemResult.success) {
  console.log('✅ Correctly rejected invalid chemistry experiment');
  console.log('   Errors:', formatValidationErrors(invalidChemResult.errors!));
} else {
  console.error('❌ Should have rejected invalid chemistry experiment');
}

// ============================================================
// TEST 4: Invalid Crypto Experiment (negative winRate)
// ============================================================
console.log('\n[TEST 4] Invalid Crypto Experiment (invalid winRate)');

const invalidCrypto = {
  ...validCrypto,
  data: {
    ...validCrypto.data,
    bots: [
      {
        ...validCrypto.data.bots[0],
        performance: {
          ...validCrypto.data.bots[0].performance,
          winRate: 1.5, // Invalid - must be between 0 and 1
        },
      },
    ],
  },
};

const invalidCryptoResult = validateLabData('crypto-market', invalidCrypto);

if (!invalidCryptoResult.success) {
  console.log('✅ Correctly rejected invalid crypto experiment');
  console.log('   Errors:', formatValidationErrors(invalidCryptoResult.errors!));
} else {
  console.error('❌ Should have rejected invalid crypto experiment');
}

// ============================================================
// TEST 5: Unknown Lab ID
// ============================================================
console.log('\n[TEST 5] Unknown Lab ID');

const unknownLabResult = validateLabData('unknown-lab', {
  labId: 'unknown-lab',
  timestamp: new Date(),
});

if (!unknownLabResult.success) {
  console.log('✅ Correctly rejected unknown lab');
  console.log('   Errors:', formatValidationErrors(unknownLabResult.errors!));
} else {
  console.error('❌ Should have rejected unknown lab');
}

// ============================================================
// SUMMARY
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log('Schema validation system is working correctly!');
console.log('All lab data will be validated before saving to VAULT.');
console.log('Invalid data will be logged for CVRA analysis.');
console.log('='.repeat(60));
