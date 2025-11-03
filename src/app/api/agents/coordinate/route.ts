/**
 * AGENT COORDINATION API
 *
 * Test endpoint for the multi-agent orchestration system.
 * POST /api/agents/coordinate
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    // Check if API keys are configured
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if ((!anthropicKey || anthropicKey.includes('your-key-here')) &&
        (!openaiKey || openaiKey.includes('your-openai-key-here'))) {
      return NextResponse.json({
        error: 'API keys not configured',
        message: 'Please add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local',
        instructions: [
          '1. Get an API key from https://console.anthropic.com/ or https://platform.openai.com/',
          '2. Add to .env.local: ANTHROPIC_API_KEY=sk-ant-...',
          '3. Restart the dev server'
        ]
      }, { status: 503 });
    }

    console.log(`[API] Coordinating task: "${prompt}"`);

    // Execute orchestration
    const result = await orchestrator.coordinateTask(prompt);

    console.log(`[API] Orchestration ${result.success ? 'succeeded' : 'failed'} in ${result.totalTime}ms`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API] Orchestration error:', error);

    return NextResponse.json({
      error: 'Orchestration failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Simple GET endpoint to check status
export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const hasValidKey = (anthropicKey && !anthropicKey.includes('your-key-here')) ||
                      (openaiKey && !openaiKey.includes('your-openai-key-here'));

  return NextResponse.json({
    status: 'Agent orchestration system online',
    configured: hasValidKey,
    message: hasValidKey
      ? 'API keys configured. Ready to coordinate agents.'
      : 'API keys not configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local'
  });
}
