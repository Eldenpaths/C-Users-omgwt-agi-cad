import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const root = process.cwd();
    const statusPath = path.join(root, 'logs', 'thread-status.json');
    if (!fs.existsSync(statusPath)) {
      return NextResponse.json({ messageCount: 0, tokenEstimate: 0, driftScore: 0, phaseStatus: 'stable' }, { status: 200 });
    }
    const raw = fs.readFileSync(statusPath, 'utf8');
    const json = JSON.parse(raw);
    return NextResponse.json(json, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'status failed' }, { status: 500 });
  }
}

