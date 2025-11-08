import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const root = process.cwd();
    const p = path.join(root, 'logs', 'notifications.json');
    if (!fs.existsSync(p)) return NextResponse.json([], { status: 200 });
    const raw = fs.readFileSync(p, 'utf8');
    return NextResponse.json(JSON.parse(raw), { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'notifications failed' }, { status: 500 });
  }
}

