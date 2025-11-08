import type { GlyphDocument } from './schema';

export type RouteKind = 'echo' | 'fractal' | 'math' | 'sim';

export function inferRoute(doc: GlyphDocument): RouteKind {
  const tags = (doc.tags || []).map((t) => t.toLowerCase());
  const name = doc.name.toLowerCase();
  const text = `${name} ${tags.join(' ')}`;
  if (/(plasma|physics|sim)/.test(text)) return 'sim';
  if (/(fractal|embedding|lacunarity|render)/.test(text)) return 'fractal';
  if (/(math|equation|algebra|proof)/.test(text)) return 'math';
  return 'echo';
}

export function glyphToRouteTask(doc: GlyphDocument) {
  const agent = inferRoute(doc);
  const payload = {
    glyphId: doc.id,
    name: doc.name,
    tags: doc.tags,
    content: doc.content,
  };
  return { agent, payload } as { agent: RouteKind; payload: any };
}

