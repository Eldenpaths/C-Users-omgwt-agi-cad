/**
 * Lab Command API
 * RESTful API for AI agents to control Science Labs
 */

import { NextRequest, NextResponse } from 'next/server';
import { labRouter } from '@/lib/science-labs/LabRouter';

/**
 * POST /api/labs/command
 * Execute a command on a lab
 *
 * Body:
 * {
 *   "lab": "plasma",
 *   "command": "heat",
 *   "params": { "flux": 2000 }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lab, command, params } = body;

    // Validate input
    if (!lab || !command) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: lab and command are required',
          example: {
            lab: 'plasma',
            command: 'heat',
            params: { flux: 2000 }
          }
        },
        { status: 400 }
      );
    }

    // Check if lab is registered
    if (!labRouter.isLabRegistered(lab)) {
      return NextResponse.json(
        {
          success: false,
          error: `Lab '${lab}' not found`,
          availableLabs: labRouter.getRegisteredLabs()
        },
        { status: 404 }
      );
    }

    // Execute command via Lab Router
    const result = await labRouter.executeCommandAsync(lab, command, params || {});

    // Get current lab state after command execution
    const state = await labRouter.getLabStateAsync(lab);

    return NextResponse.json({
      success: true,
      lab,
      command,
      params: params || {},
      result,
      state,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Lab command API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/labs/command
 * Get lab state(s)
 *
 * Query params:
 * - lab: (optional) specific lab ID
 *
 * Examples:
 * - GET /api/labs/command?lab=plasma
 * - GET /api/labs/command (returns all labs)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lab = searchParams.get('lab');

    if (!lab) {
      // Return all lab states
      const allStates = await labRouter.getAllLabStates();
      const registeredLabs = labRouter.getRegisteredLabs();

      return NextResponse.json({
        success: true,
        registeredLabs,
        labs: allStates,
        timestamp: Date.now()
      });
    }

    // Check if lab is registered
    if (!labRouter.isLabRegistered(lab)) {
      return NextResponse.json(
        {
          success: false,
          error: `Lab '${lab}' not found`,
          availableLabs: labRouter.getRegisteredLabs()
        },
        { status: 404 }
      );
    }

    // Return specific lab state
    const state = await labRouter.getLabStateAsync(lab);

    return NextResponse.json({
      success: true,
      lab,
      state,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Lab state API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
