/**
 * Direct test of API route logic
 * Bypasses HTTP to see exact error
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { LabType, validateExperiment } from '../src/lib/learning';
import { getAdminDb, serverTimestamp } from '../src/lib/server/firebaseAdmin';

async function testDirectAPI() {
  console.log('🧪 Testing API route logic directly...\n');

  try {
    // Create test data similar to what the test script sends
    const testData = {
      labType: 'crypto' as LabType,
      data: {
        userId: 'test-user-0',
        agentId: 'crypto-agent-0',
        runId: `run-${Date.now()}-0`,
        parameters: {
          algorithm: 'sha256' as any,
          payloadSizeBytes: 100,
          iterations: 1,
        },
        measurements: {
          throughputOps: 1000,
          latencyMs: 10,
          errorRate: 0.01,
        },
        success: true,
        runtimeMs: 100,
      }
    };

    console.log('Test payload:', JSON.stringify(testData, null, 2));
    console.log('\n1. Testing validation...');
    const validated = validateExperiment(testData.labType, testData.data);
    console.log('✅ Validation passed');
    console.log('Validated data:', validated);

    console.log('\n2. Getting Firestore instance...');
    const adminDb = getAdminDb();
    console.log('✅ Firestore instance obtained');

    console.log('\n3. Creating batch...');
    const batch = adminDb.batch();
    const ref = adminDb.collection('learning_sessions').doc();
    batch.set(ref, { ...validated, createdAt: serverTimestamp() });
    console.log('✅ Batch prepared');

    console.log('\n4. Committing batch...');
    await batch.commit();
    console.log('✅ Batch committed successfully');
    console.log('Document ID:', ref.id);

    console.log('\n5. Cleaning up...');
    await ref.delete();
    console.log('✅ Test document deleted');

    console.log('\n🎉 All API logic tests passed!\n');

  } catch (error) {
    console.error('\n❌ API logic test failed:\n');
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('\nStack trace:');
      console.error(error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

testDirectAPI();
