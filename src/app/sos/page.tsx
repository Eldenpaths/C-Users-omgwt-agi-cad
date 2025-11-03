'use client';

import { useState, useEffect } from 'react';
import { useExperiments } from '@/hooks/useExperiments';
import { useAuth } from '@/lib/auth/AuthContext';
import { ChevronRight } from 'lucide-react';
import { initializeSystemLabs } from '@/lib/labs/system-labs';
import { getAllAreas, getLabsForArea, getLab, type Area } from '@/lib/labs/registry';

export default function SOSPage() {
  const { user } = useAuth();
  const { experiments, loading, updateExperiment } = useExperiments();
  const [selectedArea, setSelectedArea] = useState<string>('science');
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize labs on mount
  useEffect(() => {
    if (!initialized) {
      initializeSystemLabs();
      setAreas(getAllAreas());
      setInitialized(true);
    }
  }, [initialized]);

  const markAsCanon = async (experimentId: string) => {
    try {
      await updateExperiment(experimentId, {
        status: 'completed',
        tags: ['canon']
      });
    } catch (error) {
      console.error('Error marking as canon:', error);
    }
  };

  // Get labs for selected area
  const areaLabs = getLabsForArea(selectedArea);
  const activeLab = selectedLab ? getLab(selectedLab) : null;
  const activeArea = areas.find(a => a.id === selectedArea);

  return (
    <div className="min-h-screen bg-black text-amber-50 relative overflow-hidden">
      {/* Mystical Background */}
      <div className="absolute inset-0 bg-gradient-radial from-amber-950/20 via-black to-black" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex h-screen">

        {/* VAULT - Left Sidebar */}
        <aside className="w-80 border-r border-amber-500/30 bg-black/50 backdrop-blur-sm">
          <div className="p-6 border-b border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-400 tracking-wide">◈ VAULT</h2>
            <p className="text-xs text-amber-500/60 mt-1">Experiment Archive</p>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
            {loading ? (
              <div className="text-amber-500/50 text-sm">Loading experiments...</div>
            ) : experiments.length === 0 ? (
              <div className="text-amber-500/40 text-sm italic">No experiments yet</div>
            ) : (
              experiments.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExperiment(exp.id)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all duration-300
                    ${selectedExperiment === exp.id
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                      : 'border-amber-500/20 bg-black/30 hover:border-amber-400/50 hover:bg-amber-500/5'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-100">{exp.title}</h3>
                      <p className="text-xs text-amber-500/60 mt-1">
                        {exp.createdAt?.toDate().toLocaleDateString()}
                      </p>
                      <div className="flex gap-1 mt-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300">
                          {exp.labId}
                        </span>
                        {exp.tags?.includes('canon') && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300">
                            ✓ Canon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedExperiment === exp.id && !exp.tags?.includes('canon') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsCanon(exp.id);
                      }}
                      className="mt-3 w-full px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-400 rounded hover:bg-amber-300 transition-colors"
                    >
                      Mark as Canon
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* FORGE - Center Area */}
        <main className="flex-1 flex flex-col">

          {/* Header */}
          <header className="border-b border-amber-500/30 bg-black/50 backdrop-blur-sm">
            <div className="px-8 py-6">
              <h1 className="text-4xl font-bold text-amber-400 tracking-wider mb-2">
                ⬡ SYMBOLIC OPERATING SYSTEM
              </h1>
              <p className="text-amber-500/70 text-sm">
                Unified Consciousness Interface • {user?.email || 'Not signed in'}
              </p>
            </div>
          </header>

          {/* Area Selector */}
          <div className="border-b border-amber-500/20 bg-black/30 px-8 py-4">
            <div className="flex gap-3">
              {areas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => {
                    setSelectedArea(area.id);
                    setSelectedLab(null);
                  }}
                  className={`
                    px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2
                    ${selectedArea === area.id
                      ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-black/40 text-amber-500/60 border border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-400'
                    }
                  `}
                >
                  <span className="text-xl">{area.icon}</span>
                  <span>{area.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FORGE Center - Main Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">

              {!selectedLab ? (
                <>
                  {/* Central Mystical Element */}
                  <div className="relative mb-12">
                    <div className="flex items-center justify-center h-64 relative">
                      {/* Particle Field */}
                      <div className="absolute inset-0 overflow-hidden">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-amber-400"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              opacity: Math.random() * 0.5 + 0.3,
                              animation: `float-particle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                              animationDelay: `${Math.random() * 2}s`,
                            }}
                          />
                        ))}
                      </div>

                      <div className="relative z-10">
                        {/* Glowing Core */}
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse" />
                        <div className="absolute inset-0 w-32 h-32 rounded-full bg-amber-400 blur-3xl opacity-70 animate-pulse" />
                        <div className="absolute -inset-4 w-40 h-40 rounded-full bg-amber-500/20 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

                        {/* Rotating Rings */}
                        <div className="absolute -inset-8 border-2 border-amber-500/30 rounded-full animate-spin-slow shadow-lg shadow-amber-500/20" />
                        <div className="absolute -inset-16 border border-amber-500/20 rounded-full animate-spin-reverse shadow-md shadow-amber-500/10" />

                        {/* Orbital Particles */}
                        <div className="absolute -inset-8 animate-spin-slow">
                          <div className="w-2 h-2 rounded-full bg-amber-300 absolute top-0 left-1/2 -translate-x-1/2 shadow-lg shadow-amber-400" />
                        </div>
                        <div className="absolute -inset-8 animate-spin-reverse">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-0 left-1/2 -translate-x-1/2 shadow-lg shadow-amber-500" />
                        </div>

                        {/* Center Symbol */}
                        <div className="absolute inset-0 flex items-center justify-center text-6xl text-black font-bold drop-shadow-2xl">
                          ◈
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-8">
                      <h2 className="text-2xl font-bold text-amber-300 drop-shadow-lg">FORGE ACTIVE</h2>
                      <p className="text-amber-500/70 text-sm mt-2">
                        Select a lab to begin
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                        <span>Systems Nominal</span>
                      </div>
                    </div>
                  </div>

                  {/* Area Info & Lab Grid */}
                  {activeArea && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-3xl font-bold text-amber-300 mb-2">
                          {activeArea.icon} {activeArea.name}
                        </h3>
                        <p className="text-amber-500/70">{activeArea.description}</p>
                      </div>

                      {areaLabs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                          {areaLabs.map((lab) => (
                            <button
                              key={lab.id}
                              onClick={() => setSelectedLab(lab.id)}
                              className="p-6 bg-black/40 border-2 border-amber-500/20 rounded-lg hover:border-amber-400 hover:bg-amber-500/10 transition-all duration-300 text-left group"
                            >
                              <div className="text-4xl mb-3">{lab.icon}</div>
                              <h4 className="text-xl font-bold text-amber-300 mb-2 group-hover:text-amber-200">
                                {lab.name}
                              </h4>
                              <p className="text-sm text-amber-500/70 mb-3">{lab.description}</p>
                              <div className="flex items-center gap-2 text-xs text-amber-400">
                                <span>Launch Lab</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-amber-500/50">
                          <p className="text-lg mb-2">No labs in this area yet</p>
                          <p className="text-sm">Coming in future phases</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Lab View */}
                  <div className="mb-6">
                    <button
                      onClick={() => setSelectedLab(null)}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold transition-colors"
                    >
                      ← Back to {activeArea?.name}
                    </button>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-amber-300 mb-2">
                      {activeLab?.icon} {activeLab?.name}
                    </h2>
                    <p className="text-amber-500/70">{activeLab?.description}</p>
                  </div>

                  {/* Render Active Lab Component */}
                  {activeLab && <activeLab.component />}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(
              ${Math.random() * 20 - 10}px,
              ${Math.random() * 20 - 10}px
            ) scale(1.5);
            opacity: 0.8;
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
