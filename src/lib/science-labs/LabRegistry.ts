/**
 * Lab Registry
 * Central catalog of all Science Labs in the AGI-CAD system
 */

export interface LabDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  route: string;
  icon: string; // lucide-react icon name
  status: 'active' | 'beta' | 'coming-soon';
  experiments?: number; // Active experiment count
  lastUpdate?: number; // Timestamp
}

export const LAB_REGISTRY: LabDefinition[] = [
  {
    id: 'plasma',
    name: 'Plasma Physics Lab',
    description: 'High-temperature ionization and thermal dynamics',
    capabilities: ['heat', 'ionize', 'vent', 'refill'],
    route: '/plasma-lab',
    icon: 'Zap',
    status: 'active',
    experiments: 2,
    lastUpdate: Date.now(),
  },
  {
    id: 'fluid',
    name: 'Fluid Dynamics Lab',
    description: 'Aerodynamics and turbulence simulation',
    capabilities: ['setWind', 'addObstacle', 'analyze'],
    route: '/fluid-lab',
    icon: 'Wind',
    status: 'coming-soon',
  },
  {
    id: 'spectral',
    name: 'Spectral Analysis Lab',
    description: 'Atomic emission and absorption spectra',
    capabilities: ['selectElement', 'scan', 'identify'],
    route: '/spectral-lab',
    icon: 'Sparkles',
    status: 'coming-soon',
  },
  {
    id: 'quantum',
    name: 'Quantum Mechanics Lab',
    description: 'Wave functions and quantum state manipulation',
    capabilities: ['entangle', 'measure', 'superpose'],
    route: '/quantum-lab',
    icon: 'Atom',
    status: 'coming-soon',
  },
  {
    id: 'materials',
    name: 'Materials Science Lab',
    description: 'Crystal structures and material properties',
    capabilities: ['synthesize', 'stress-test', 'analyze-lattice'],
    route: '/materials-lab',
    icon: 'Box',
    status: 'coming-soon',
  },
  {
    id: 'chemistry',
    name: 'Chemical Reactions Lab',
    description: 'Molecular interactions and reaction kinetics',
    capabilities: ['mix', 'heat', 'titrate', 'distill'],
    route: '/chemistry-lab',
    icon: 'Flask',
    status: 'coming-soon',
  },
];

/**
 * Get lab by ID
 */
export function getLabById(id: string): LabDefinition | undefined {
  return LAB_REGISTRY.find((lab) => lab.id === id);
}

/**
 * Get all active labs
 */
export function getActiveLabs(): LabDefinition[] {
  return LAB_REGISTRY.filter((lab) => lab.status === 'active');
}

/**
 * Get lab stats for dashboard
 */
export function getLabStats() {
  const active = LAB_REGISTRY.filter((lab) => lab.status === 'active').length;
  const total = LAB_REGISTRY.length;
  const experiments = LAB_REGISTRY.reduce((sum, lab) => sum + (lab.experiments || 0), 0);

  return {
    activeLabs: active,
    totalLabs: total,
    activeExperiments: experiments,
    comingSoon: total - active,
  };
}
