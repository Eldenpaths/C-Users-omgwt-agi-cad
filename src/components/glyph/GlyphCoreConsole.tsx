"use client";
import React from 'react';
import { GlyphDocumentSchema } from '@/lib/glyphcore/schema';
import { roundTripText } from '@/lib/glyphcore/compressor';
import { visualCompressClient, isVisualCompressionEnabled } from '@/lib/glyphcore/visualHybrid';

export default function GlyphCoreConsole() {
  const [input, setInput] = React.useState<string>(JSON.stringify({
    id: 'glyph-001', name: 'Example Glyph', version: '1', author: 'ops', tags: ['math'],
    content: { mime: 'text/plain', encoding: 'utf8', data: 'E=mc^2' },
  }, null, 2));
  const [status, setStatus] = React.useState<string>('');
  const [useVisual, setUseVisual] = React.useState<boolean>(false);

  async function handleValidate() {
    try {
      const parsed = JSON.parse(input);
      const doc = GlyphDocumentSchema.parse(parsed);
      setStatus(`Valid ✓ id=${doc.id}`);
    } catch (e: any) {
      setStatus(`Invalid ✕: ${e?.message || 'error'}`);
    }
  }

  async function handleCompress() {
    try {
      const parsed = JSON.parse(input);
      const text = parsed?.content?.data || '';
      if (useVisual && isVisualCompressionEnabled()) {
        const bytes = await visualCompressClient(String(text));
        setStatus(`Visual-compressed preview: ~${String(text).length} → ${bytes.length} bytes`);
      } else {
        const r = await roundTripText(String(text));
        setStatus(`Compressed ${r.sizeIn} → ${r.sizeOut} bytes; restored="${r.restored}"`);
      }
    } catch (e: any) {
      setStatus(`Compression error: ${e?.message || 'error'}`);
    }
  }

  async function handleSubmit() {
    try {
      const parsed = JSON.parse(input);
      const res = await fetch('/api/glyph/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ glyph: parsed }) });
      const json = await res.json();
      setStatus(res.ok && json.ok ? `Submitted ✓ id=${json.id ?? 'local'} (compressed=${json.compressed})` : `Submit error: ${json.error || res.status}`);
    } catch (e: any) {
      setStatus(`Submit failed: ${e?.message || 'error'}`);
    }
  }

  return (
    <div className="rounded-xl border border-amber-500/20 p-4 bg-black/30">
      <div className="mb-2 text-amber-200 font-semibold">GlyphCore Console</div>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} className="w-full rounded bg-black/40 border border-amber-500/20 p-2 font-mono text-sm text-amber-100" />
      <div className="mt-3 flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-amber-300/80 mr-4">
          <input type="checkbox" checked={useVisual} onChange={(e)=>setUseVisual(e.target.checked)} />
          <span>Use visual compression (env-gated)</span>
        </label>
        <button onClick={handleValidate} className="px-3 py-1.5 rounded border border-amber-500/30 hover:bg-amber-500/10 text-amber-100 text-sm">Validate</button>
        <button onClick={handleCompress} className="px-3 py-1.5 rounded border border-amber-500/30 hover:bg-amber-500/10 text-amber-100 text-sm">Compress</button>
        <button onClick={handleSubmit} className="px-3 py-1.5 rounded border border-amber-500/30 hover:bg-amber-500/10 text-amber-100 text-sm">Submit</button>
      </div>
      {status && <div className="mt-3 text-xs text-amber-300/80">{status}</div>}
    </div>
  );
}
