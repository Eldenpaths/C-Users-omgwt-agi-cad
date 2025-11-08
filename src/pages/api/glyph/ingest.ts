import type { NextApiRequest, NextApiResponse } from 'next';
import { validateGlyph } from '@/lib/glyphcore';
import { compress } from '@/lib/glyphcore/compressor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { glyph } = req.body || {};
    const doc = validateGlyph(glyph);
    const contentStr = doc.content.encoding === 'base64' ? Buffer.from(doc.content.data, 'base64').toString('utf8') : doc.content.data;
    const comp = await compress(contentStr);

    // Persist via Firebase Admin (server-only)
    try {
      const { getFirestoreInstance } = await import('@/lib/firebase/server');
      const { FieldValue } = await import('firebase-admin/firestore');
      const db = getFirestoreInstance();
      const ref = await db.collection('glyph_docs').add({
        id: doc.id,
        name: doc.name,
        tags: doc.tags,
        version: doc.version,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        content: { mime: doc.content.mime, size: comp.length, algo: 'hybrid' },
      });
      return res.status(200).json({ ok: true, id: ref.id, compressed: comp.length });
    } catch {
      return res.status(200).json({ ok: true, compressed: comp.length, note: 'local-only (no admin)' });
    }
  } catch (e: any) {
    return res.status(422).json({ ok: false, error: e?.message || 'invalid glyph' });
  }
}

