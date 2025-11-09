/**
 * Test script to verify Firebase Admin SDK initialization
 * Run with: npx tsx scripts/test-firebase-admin.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/server/firebaseAdmin';

async function testFirebaseAdmin() {
  console.log('🔥 Testing Firebase Admin SDK initialization...\n');

  try {
    // Test 1: Get Firestore instance
    console.log('Test 1: Getting Firestore instance...');
    const db = getAdminDb();

    if (!db) {
      throw new Error('❌ Firestore instance is undefined!');
    }
    console.log('✅ Firestore instance created successfully\n');

    // Test 2: Check Firestore configuration
    console.log('Test 2: Checking Firestore configuration...');
    console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('  Firestore type:', db.constructor.name);
    console.log('✅ Configuration looks good\n');

    // Test 3: Try a simple read operation
    console.log('Test 3: Testing Firestore read access...');
    const testRef = db.collection('_test_connection');
    const snapshot = await testRef.limit(1).get();
    console.log('✅ Firestore read successful');
    console.log('  Collection query returned:', snapshot.size, 'documents\n');

    // Test 4: Try a write operation
    console.log('Test 4: Testing Firestore write access...');
    const testDoc = await testRef.add({
      timestamp: new Date().toISOString(),
      message: 'Firebase Admin SDK test',
      test: true,
    });
    console.log('✅ Firestore write successful');
    console.log('  Created document ID:', testDoc.id);

    // Clean up test document
    await testDoc.delete();
    console.log('✅ Test document deleted\n');

    console.log('🎉 All tests passed! Firebase Admin SDK is working correctly.\n');

  } catch (error) {
    console.error('❌ Firebase Admin test failed:\n');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('\nStack:', error.stack);
    } else {
      console.error('Error:', error);
    }
    console.error('\n📋 Troubleshooting:');
    console.error('1. Check that GOOGLE_APPLICATION_CREDENTIALS_JSON is set in .env.local');
    console.error('2. Verify the service account JSON is valid');
    console.error('3. Ensure FIREBASE_PROJECT_ID matches your service account project');
    console.error('4. Check that the service account has Firestore permissions');
    process.exit(1);
  }
}

testFirebaseAdmin();
