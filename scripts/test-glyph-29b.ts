import { GlyphDocumentSchema } from '@/lib/glyphcore/schema';
import { roundTripText } from '@/lib/glyphcore/compressor';
import { glyphToRouteTask, inferRoute } from '@/lib/glyphcore/routerAdapter';

async function main(){
  const doc = {
    id: 'g-29b', name: 'Glyph Physics Test', version: '1', tags: ['sim','plasma'],
    content: { mime: 'text/plain', encoding: 'utf8', data: 'plasma:beta=0.2' },
  };
  const parsed = GlyphDocumentSchema.parse(doc);
  const route = inferRoute(parsed);
  const task = glyphToRouteTask(parsed);
  const rt = await roundTripText(parsed.content.data);
  console.log('valid \u2713 route=', route, 'task.agent=', task.agent, 'sizes=', rt.sizeIn, '->', rt.sizeOut, 'restored=', rt.restored);
}

main().catch((e)=>{ console.error(e); process.exit(1); });

