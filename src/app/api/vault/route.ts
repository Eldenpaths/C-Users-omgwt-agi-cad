/**
 * Phase 18: Vault API Route
 * RESTful API for vault operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vaultService';
import { archivistService } from '@/lib/archivist/archivistService';
import {
  VaultEntry,
  VaultQuery,
  ArchivistSearchQuery,
  ArchivistRecoveryRequest,
} from '@/lib/vault/vaultTypes';

// ============================================================================
// GET - Query Vault Entries
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle different actions
    switch (action) {
      case 'stats':
        return handleGetStats();

      case 'entry':
        return handleGetEntry(searchParams.get('id')!);

      case 'search':
        return handleSearch(searchParams);

      case 'archivist':
        return handleArchivistSearch(searchParams);

      default:
        return handleQuery(searchParams);
    }
  } catch (error) {
    console.error('❌ Vault GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleGetStats() {
  const stats = await vaultService.getStatistics();
  return NextResponse.json({
    success: true,
    data: stats,
  });
}

async function handleGetEntry(id: string) {
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Entry ID required' },
      { status: 400 }
    );
  }

  const entry = await vaultService.getEntry(id);

  if (!entry) {
    return NextResponse.json(
      { success: false, error: 'Entry not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: entry,
  });
}

async function handleQuery(searchParams: URLSearchParams) {
  const query: VaultQuery = {
    type: searchParams.get('type') as any,
    status: searchParams.get('status') as any,
    tags: searchParams.get('tags')?.split(','),
    createdBy: searchParams.get('createdBy') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
    sortBy: searchParams.get('sortBy') as any || 'createdAt',
    sortOrder: searchParams.get('sortOrder') as any || 'desc',
  };

  const results = await vaultService.queryEntries(query);

  return NextResponse.json({
    success: true,
    data: results,
  });
}

async function handleSearch(searchParams: URLSearchParams) {
  const searchText = searchParams.get('q');

  if (!searchText) {
    return NextResponse.json(
      { success: false, error: 'Search query required' },
      { status: 400 }
    );
  }

  // Basic search implementation
  const query: VaultQuery = {
    searchText,
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  const results = await vaultService.queryEntries(query);

  return NextResponse.json({
    success: true,
    data: results,
  });
}

async function handleArchivistSearch(searchParams: URLSearchParams) {
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Search query required' },
      { status: 400 }
    );
  }

  const searchQuery: ArchivistSearchQuery = {
    query,
    keywords: searchParams.get('keywords')?.split(','),
    limit: parseInt(searchParams.get('limit') || '10'),
    minRelevance: parseFloat(searchParams.get('minRelevance') || '0.3'),
  };

  const results = await archivistService.searchThreads(searchQuery);

  return NextResponse.json({
    success: true,
    data: results,
  });
}

// ============================================================================
// POST - Create or Recover Entries
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return handleCreate(body);

      case 'recover':
        return handleRecover(body);

      case 'analyze':
        return handleAnalyze(body);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Vault POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleCreate(body: any) {
  const { entry } = body;

  if (!entry) {
    return NextResponse.json(
      { success: false, error: 'Entry data required' },
      { status: 400 }
    );
  }

  const id = await vaultService.createEntry(entry);

  return NextResponse.json({
    success: true,
    data: { id },
  }, { status: 201 });
}

async function handleRecover(body: any) {
  const request: ArchivistRecoveryRequest = body.request;

  if (!request || !request.threadId || !request.platform) {
    return NextResponse.json(
      { success: false, error: 'Recovery request data required' },
      { status: 400 }
    );
  }

  const result = await archivistService.recoverThread(request);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
  });
}

async function handleAnalyze(body: any) {
  const { threadId } = body;

  if (!threadId) {
    return NextResponse.json(
      { success: false, error: 'Thread ID required' },
      { status: 400 }
    );
  }

  const analysis = await archivistService.analyzeThread(threadId);

  return NextResponse.json({
    success: true,
    data: analysis,
  });
}

// ============================================================================
// PUT - Update Entries
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'archive':
        await vaultService.archiveEntry(id);
        break;

      case 'restore':
        await vaultService.restoreEntry(id);
        break;

      default:
        if (!updates) {
          return NextResponse.json(
            { success: false, error: 'Updates required' },
            { status: 400 }
          );
        }
        await vaultService.updateEntry(id, updates);
        break;
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('❌ Vault PUT error:', error);
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
// DELETE - Delete Entries
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const soft = searchParams.get('soft') !== 'false'; // Default to soft delete

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID required' },
        { status: 400 }
      );
    }

    await vaultService.deleteEntry(id, soft);

    return NextResponse.json({
      success: true,
      data: { id, deleted: true, soft },
    });
  } catch (error) {
    console.error('❌ Vault DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
