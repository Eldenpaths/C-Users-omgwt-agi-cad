/**
 * Phase 20: WebSocket API Route
 * HTTP endpoint for WebSocket connection management and state queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { websocketServer } from '@/lib/sync/websocketServer';
import { syncManager } from '@/lib/sync/syncManager';
import { SubscriptionChannel, MessageType, createMessage } from '@/lib/sync/syncTypes';

// ============================================================================
// GET - Query WebSocket Status and State
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        return handleGetStats();

      case 'clients':
        return handleGetClients();

      case 'state':
        return handleGetState();

      case 'conflicts':
        return handleGetConflicts();

      default:
        return handleGetInfo();
    }
  } catch (error) {
    console.error('❌ WebSocket GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleGetInfo() {
  const stats = websocketServer.getStatistics();
  const state = syncManager.getState();

  return NextResponse.json({
    success: true,
    data: {
      version: state.version,
      timestamp: state.timestamp,
      statistics: stats,
    },
  });
}

async function handleGetStats() {
  const stats = websocketServer.getStatistics();

  return NextResponse.json({
    success: true,
    data: stats,
  });
}

async function handleGetClients() {
  const clients = websocketServer.getAllClients();

  return NextResponse.json({
    success: true,
    data: clients,
  });
}

async function handleGetState() {
  const state = syncManager.getState();

  return NextResponse.json({
    success: true,
    data: state,
  });
}

async function handleGetConflicts() {
  const conflicts = syncManager.getConflicts();

  return NextResponse.json({
    success: true,
    data: conflicts,
  });
}

// ============================================================================
// POST - Manage Connections and Publish Updates
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'register':
        return handleRegisterClient(body);

      case 'subscribe':
        return handleSubscribe(body);

      case 'publish':
        return handlePublish(body);

      case 'update_glyph':
        return handleUpdateGlyph(body);

      case 'update_task':
        return handleUpdateTask(body);

      case 'update_agent':
        return handleUpdateAgent(body);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ WebSocket POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleRegisterClient(body: any) {
  const { clientId, userId, metadata } = body;

  if (!clientId) {
    return NextResponse.json(
      { success: false, error: 'Client ID required' },
      { status: 400 }
    );
  }

  const client = websocketServer.registerClient(clientId, userId, metadata);

  // Send initial state snapshot
  syncManager.broadcastSnapshot(clientId);

  return NextResponse.json({
    success: true,
    data: client,
  }, { status: 201 });
}

async function handleSubscribe(body: any) {
  const { clientId, channel } = body;

  if (!clientId || !channel) {
    return NextResponse.json(
      { success: false, error: 'Client ID and channel required' },
      { status: 400 }
    );
  }

  websocketServer.subscribe(clientId, channel as SubscriptionChannel);

  return NextResponse.json({
    success: true,
    data: { clientId, channel },
  });
}

async function handlePublish(body: any) {
  const { channel, type, payload, excludeClient } = body;

  if (!channel || !type) {
    return NextResponse.json(
      { success: false, error: 'Channel and message type required' },
      { status: 400 }
    );
  }

  const message = createMessage(type as MessageType, payload);
  const sent = await websocketServer.broadcast(
    channel as SubscriptionChannel,
    message,
    excludeClient
  );

  return NextResponse.json({
    success: true,
    data: { sent, messageId: message.id },
  });
}

async function handleUpdateGlyph(body: any) {
  const { glyphId, updates, clientId } = body;

  if (!glyphId || !updates) {
    return NextResponse.json(
      { success: false, error: 'Glyph ID and updates required' },
      { status: 400 }
    );
  }

  syncManager.updateGlyph(glyphId, updates, clientId);

  return NextResponse.json({
    success: true,
    data: { glyphId, version: syncManager.getStateVersion() },
  });
}

async function handleUpdateTask(body: any) {
  const { taskId, updates, clientId } = body;

  if (!taskId || !updates) {
    return NextResponse.json(
      { success: false, error: 'Task ID and updates required' },
      { status: 400 }
    );
  }

  syncManager.updateTask(taskId, updates, clientId);

  return NextResponse.json({
    success: true,
    data: { taskId, version: syncManager.getStateVersion() },
  });
}

async function handleUpdateAgent(body: any) {
  const { agentId, updates, clientId } = body;

  if (!agentId || !updates) {
    return NextResponse.json(
      { success: false, error: 'Agent ID and updates required' },
      { status: 400 }
    );
  }

  syncManager.updateAgent(agentId, updates, clientId);

  return NextResponse.json({
    success: true,
    data: { agentId, version: syncManager.getStateVersion() },
  });
}

// ============================================================================
// PUT - Update Client State
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, action } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'unsubscribe':
        const { channel } = body;
        if (!channel) {
          return NextResponse.json(
            { success: false, error: 'Channel required' },
            { status: 400 }
          );
        }
        websocketServer.unsubscribe(clientId, channel as SubscriptionChannel);
        break;

      case 'resolve_conflict':
        const { conflictId, resolution } = body;
        if (!conflictId || !resolution) {
          return NextResponse.json(
            { success: false, error: 'Conflict ID and resolution required' },
            { status: 400 }
          );
        }
        syncManager.resolveConflictManually(conflictId, resolution);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { clientId },
    });
  } catch (error) {
    console.error('❌ WebSocket PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Disconnect Clients
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }

    websocketServer.unregisterClient(clientId);

    return NextResponse.json({
      success: true,
      data: { clientId, disconnected: true },
    });
  } catch (error) {
    console.error('❌ WebSocket DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
