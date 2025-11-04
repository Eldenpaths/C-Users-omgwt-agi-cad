/**
 * SYSTEM LABS INITIALIZATION
 *
 * Registers all built-in labs and areas.
 * This file demonstrates how easy it is to add new labs to the system.
 *
 * To add a new lab:
 * 1. Create the lab component in /src/lib/labs/components/
 * 2. Import it here
 * 3. Call registerLab() with the lab configuration
 * 4. Add the lab ID to the appropriate area
 *
 * Future: User labs will use the same pattern but stored in Firestore
 */

import { registerLab, registerArea } from './registry';
import PlasmaLab from './components/PlasmaLab';
import SpectralLab from './components/SpectralLab';
import ChemistryLab from '../../components/sos/chemistry/ChemistryLab';
import CryptoLab from '../../components/sos/crypto/CryptoLab';

/**
 * Initialize all system labs and areas
 * Call this once at app startup
 */
export function initializeSystemLabs() {
  // ============================================================
  // SCIENCE AREA LABS
  // ============================================================

  registerLab({
    id: 'plasma',
    name: 'Plasma Lab',
    description: 'Simulate high-temperature plasma physics with real-time ionization calculations',
    icon: '⚡',
    creator: 'system',
    category: 'science',
    component: PlasmaLab,
    permissions: [], // Public
    tags: ['physics', 'plasma', 'simulation', 'temperature'],
    version: '1.0.0',
    featured: true,
  });

  registerLab({
    id: 'spectral',
    name: 'Spectral Lab',
    description: 'Analyze wavelengths and light spectra across the visible spectrum',
    icon: '🌈',
    creator: 'system',
    category: 'science',
    component: SpectralLab,
    permissions: [], // Public
    tags: ['optics', 'wavelength', 'spectrum', 'light'],
    version: '1.0.0',
    featured: true,
  });

  registerLab({
    id: 'chemistry',
    name: 'Chemistry Lab',
    description: 'Build molecules, visualize structures, and simulate chemical reactions',
    icon: '🧪',
    creator: 'system',
    category: 'science',
    component: ChemistryLab,
    permissions: [], // Public
    tags: ['chemistry', 'molecules', 'reactions', '3d', 'visualization'],
    version: '1.0.0',
    featured: true,
  });

  // ============================================================
  // CRYPTO AREA LABS
  // ============================================================

  registerLab({
    id: 'crypto-market',
    name: 'Crypto Market Simulator',
    description: 'Simulate cryptocurrency markets with AI trading bots',
    icon: '💰',
    creator: 'system',
    category: 'crypto',
    component: CryptoLab,
    permissions: [],
    tags: ['crypto', 'trading', 'bots', 'market', 'simulation'],
    version: '1.0.0',
    featured: true,
  });

  // ============================================================
  // DESIGN AREA LABS (Future)
  // ============================================================

  // Placeholder for future design labs
  // registerLab({
  //   id: 'color-theory',
  //   name: 'Color Theory Lab',
  //   description: 'Explore color harmonies, palettes, and visual design principles',
  //   icon: '🎨',
  //   creator: 'system',
  //   category: 'design',
  //   component: ColorTheoryLab,
  //   permissions: [],
  //   tags: ['color', 'design', 'palette', 'harmony'],
  //   version: '1.0.0',
  // });

  // ============================================================
  // REGISTER AREAS
  // ============================================================

  registerArea({
    id: 'science',
    name: 'Science',
    description: 'Physics, chemistry, and natural sciences',
    icon: '🔬',
    color: 'cyan',
    labs: ['plasma', 'spectral', 'chemistry'],
  });

  registerArea({
    id: 'crypto',
    name: 'Crypto',
    description: 'Blockchain, tokenomics, and decentralized systems',
    icon: '₿',
    color: 'emerald',
    labs: ['crypto-market'],
  });

  registerArea({
    id: 'design',
    name: 'Design',
    description: 'Visual design, UX, and creative tools',
    icon: '🎨',
    color: 'purple',
    labs: [], // To be populated in future phases
  });

  registerArea({
    id: 'custom',
    name: 'Custom',
    description: 'User-created labs and experiments',
    icon: '⚙️',
    color: 'amber',
    labs: [], // User labs go here (Phase 3+)
  });
}

/**
 * Utility to validate all labs are properly registered
 */
export function validateSystemLabs(): boolean {
  try {
    const { getAllLabs, getAllAreas } = require('./registry');
    const labs = getAllLabs();
    const areas = getAllAreas();

    console.log(`✓ ${labs.length} labs registered`);
    console.log(`✓ ${areas.length} areas registered`);

    // Validate all area lab references exist
    for (const area of areas) {
      for (const labId of area.labs) {
        const lab = labs.find(l => l.id === labId);
        if (!lab) {
          console.error(`✗ Area "${area.id}" references non-existent lab "${labId}"`);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Lab validation failed:', error);
    return false;
  }
}
