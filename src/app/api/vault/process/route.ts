/**
 * VAULT PROCESSING API
 *
 * Endpoint to process VAULT experiments through the AGI pipeline.
 * POST /api/vault/process - Process a single experiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { processVaultEntry } from '@/lib/events';
import type { Experiment } from '@/lib/firestore/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experiment } = body;

    if (!experiment) {
      return NextResponse.json(
        { error: 'Missing experiment data in request body' },
        { status: 400 }
      );
    }

    console.log(`[API] Processing experiment: ${experiment.id}`);

    // Process the experiment
    const result = await processVaultEntry(experiment as Experiment);

    console.log(`[API] Processing ${result.success ? 'succeeded' : 'failed'} in ${result.processingTime}ms`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API] Processing error:', error);

    return NextResponse.json({
      error: 'Processing failed',
      message: error.message,
    }, { status: 500 });
  }
}

// Status endpoint
export async function GET() {
  const { isPineconeConfigured, isOpenAIConfigured } = require('@/lib/embeddings');

  const pineconeReady = isPineconeConfigured();
  const openaiReady = isOpenAIConfigured();
  const ready = pineconeReady && openaiReady;

  return NextResponse.json({
    status: 'VAULT processor online',
    ready,
    services: {
      pinecone: pineconeReady ? 'configured' : 'not configured',
      openai: openaiReady ? 'configured' : 'not configured',
    },
    message: ready
      ? 'Ready to process experiments'
      : 'Configure API keys in .env.local to enable processing',
  });
}
