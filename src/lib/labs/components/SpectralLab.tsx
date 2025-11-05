'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { Sparkles } from 'lucide-react';

export default function SpectralLab() {
  const [wavelength, setWavelength] = useState(550);
  const [intensity, setIntensity] = useState(50);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const getColorFromWavelength = (wl: number) => {
    if (wl < 450) return 'from-purple-500 to-indigo-500';
    if (wl < 495) return 'from-blue-500 to-cyan-500';
    if (wl < 570) return 'from-green-500 to-yellow-500';
    if (wl < 590) return 'from-yellow-500 to-amber-500';
    if (wl < 620) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Visualization */}
      <div className="flex flex-col items-center justify-center bg-black/30 border border-amber-500/20 rounded-lg p-6">
        <div className="relative w-40 h-40">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${getColorFromWavelength(wavelength)}`}
            style={{ opacity: intensity / 100 }}
          />
          <div className="absolute inset-0 rounded-full blur-2xl" style={{
            background: `radial-gradient(circle, rgba(255,255,255,${intensity/200}) 0%, transparent 70%)`
          }} />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🌈</div>
        </div>
        <div className="mt-4 space-y-1 text-center">
          <p className="text-amber-300 text-sm">Wavelength: {wavelength} nm</p>
          <p className="text-amber-400 text-sm">Intensity: {intensity}%</p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 relative z-10">
        <div>
          <label className="text-amber-300 text-sm mb-2 block">Wavelength (nm)</label>
          <input
            type="range"
            min="380"
            max="750"
            value={wavelength}
            onChange={(e) => setWavelength(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
        <div>
          <label className="text-amber-300 text-sm mb-2 block">Intensity (%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
        <button
          onClick={() => { setWavelength(550); setIntensity(50); }}
          className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 text-amber-950 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> RESET
        </button>

        <div className="pt-2 border-t border-amber-500/20" />
        <button
          onClick={async () => {
            const user = auth?.currentUser;
            if (!user) {
              setSaveMsg('Please sign in to save sessions.');
              return;
            }
            setSaving(true);
            setSaveMsg(null);
            try {
              const payload = {
                labType: 'spectral',
                userId: user.uid,
                data: {
                  experimentId: `spectral-${Date.now()}`,
                  wavelengthsNm: [wavelength],
                  intensities: [intensity],
                  method: 'UV-Vis',
                  runtimeMs: 500,
                  success: intensity > 10,
                  errorMessage: undefined,
                  notes: 'Logged from SpectralLab UI',
                },
              };
              const res = await fetch('/api/learning/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json?.error || 'Failed to ingest');
              setSaveMsg(`Saved session ${json.sessionId}`);
            } catch (e: any) {
              setSaveMsg(`Save failed: ${e.message}`);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/40 text-emerald-50 rounded font-semibold transition-colors"
        >
          {saving ? 'Saving…' : 'Save Learning Session'}
        </button>
        {saveMsg ? (
          <p className="text-amber-300 text-sm">{saveMsg}</p>
        ) : null}
      </div>
    </div>
  );
}
