/**
 * LAB REGISTRY SYSTEM
 *
 * Extensible architecture for dynamic lab loading.
 * Makes it trivial to add new labs, user-created labs, and future sandboxes.
 *
 * Design Principles:
 * 1. Labs are self-contained modules
 * 2. Easy to register new labs
 * 3. Support for system, user, and community labs
 * 4. Permission-based access control
 * 5. Category-based organization
 */

import { ComponentType } from 'react';

// Lab metadata and configuration
export interface Lab {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  creator: 'system' | 'user' | 'community';
  category: 'science' | 'crypto' | 'design' | 'custom';
  component: ComponentType<any>;
  permissions: string[];
  tags: string[];
  version: string;
  featured?: boolean;
}

// Area groupings for the FORGE
export interface Area {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // Tailwind color class
  labs: string[]; // Lab IDs in this area
}

// Registry storage
const labRegistry = new Map<string, Lab>();
const areaRegistry = new Map<string, Area>();

/**
 * Register a new lab in the system
 */
export function registerLab(lab: Lab): void {
  if (labRegistry.has(lab.id)) {
    console.warn(`Lab ${lab.id} is already registered. Overwriting...`);
  }
  labRegistry.set(lab.id, lab);
}

/**
 * Register a new area
 */
export function registerArea(area: Area): void {
  if (areaRegistry.has(area.id)) {
    console.warn(`Area ${area.id} is already registered. Overwriting...`);
  }
  areaRegistry.set(area.id, area);
}

/**
 * Get a lab by ID
 */
export function getLab(id: string): Lab | undefined {
  return labRegistry.get(id);
}

/**
 * Get an area by ID
 */
export function getArea(id: string): Area | undefined {
  return areaRegistry.get(id);
}

/**
 * Get all registered labs
 */
export function getAllLabs(): Lab[] {
  return Array.from(labRegistry.values());
}

/**
 * Get all registered areas
 */
export function getAllAreas(): Area[] {
  return Array.from(areaRegistry.values());
}

/**
 * Get labs for a specific area
 */
export function getLabsForArea(areaId: string): Lab[] {
  const area = areaRegistry.get(areaId);
  if (!area) return [];

  return area.labs
    .map(labId => labRegistry.get(labId))
    .filter((lab): lab is Lab => lab !== undefined);
}

/**
 * Get labs by category
 */
export function getLabsByCategory(category: Lab['category']): Lab[] {
  return Array.from(labRegistry.values()).filter(lab => lab.category === category);
}

/**
 * Get labs by creator type
 */
export function getLabsByCreator(creator: Lab['creator']): Lab[] {
  return Array.from(labRegistry.values()).filter(lab => lab.creator === creator);
}

/**
 * Check if user has permission to access lab
 */
export function hasLabPermission(lab: Lab, userPermissions: string[]): boolean {
  if (lab.permissions.length === 0) return true; // Public lab
  return lab.permissions.some(perm => userPermissions.includes(perm));
}

/**
 * Search labs by name or tags
 */
export function searchLabs(query: string): Lab[] {
  const lowerQuery = query.toLowerCase();
  return Array.from(labRegistry.values()).filter(lab =>
    lab.name.toLowerCase().includes(lowerQuery) ||
    lab.description.toLowerCase().includes(lowerQuery) ||
    lab.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get featured labs
 */
export function getFeaturedLabs(): Lab[] {
  return Array.from(labRegistry.values()).filter(lab => lab.featured);
}

/**
 * Clear all registries (useful for testing)
 */
export function clearRegistries(): void {
  labRegistry.clear();
  areaRegistry.clear();
}
