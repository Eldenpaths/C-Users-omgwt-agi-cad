/**
 * LABS MODULE - Main Entry Point
 *
 * Centralized exports for the lab registry system.
 */

// Registry functions
export {
  registerLab,
  registerArea,
  getLab,
  getArea,
  getAllLabs,
  getAllAreas,
  getLabsForArea,
  getLabsByCategory,
  getLabsByCreator,
  hasLabPermission,
  searchLabs,
  getFeaturedLabs,
  clearRegistries,
  type Lab,
  type Area,
} from './registry';

// System initialization
export { initializeSystemLabs, validateSystemLabs } from './system-labs';

// Lab components (for direct import if needed)
export { default as PlasmaLab } from './components/PlasmaLab';
export { default as SpectralLab } from './components/SpectralLab';
