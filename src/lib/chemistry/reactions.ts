/**
 * Chemistry Reaction Engine
 * Simulates molecular reactions and calculates properties
 */

export interface Atom {
  id: string;
  element: string;
  position: { x: number; y: number; z: number };
  charge?: number;
}

export interface Bond {
  id: string;
  atom1: string;
  atom2: string;
  type: 'single' | 'double' | 'triple';
  energy: number; // kJ/mol
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
  molecularWeight: number;
  energy: number;
  polarity: 'polar' | 'nonpolar';
}

export interface Reaction {
  id: string;
  name: string;
  equation: string;
  reactants: Molecule[];
  products: Molecule[];
  energyChange: number; // kJ/mol
  type: 'synthesis' | 'decomposition' | 'combustion' | 'exchange';
  spontaneous: boolean;
}

// Element properties
export const ELEMENTS = {
  H: { name: 'Hydrogen', atomicMass: 1.008, color: '#FFFFFF', valence: 1 },
  C: { name: 'Carbon', atomicMass: 12.011, color: '#000000', valence: 4 },
  N: { name: 'Nitrogen', atomicMass: 14.007, color: '#0000FF', valence: 3 },
  O: { name: 'Oxygen', atomicMass: 15.999, color: '#FF0000', valence: 2 },
  S: { name: 'Sulfur', atomicMass: 32.065, color: '#FFFF00', valence: 2 },
  P: { name: 'Phosphorus', atomicMass: 30.974, color: '#FFA500', valence: 3 },
  Cl: { name: 'Chlorine', atomicMass: 35.453, color: '#00FF00', valence: 1 },
  Br: { name: 'Bromine', atomicMass: 79.904, color: '#8B4513', valence: 1 },
} as const;

// Bond energies (kJ/mol)
export const BOND_ENERGIES = {
  'H-H': 436,
  'C-C': 347,
  'C=C': 614,
  'C≡C': 839,
  'C-H': 413,
  'C-O': 358,
  'C=O': 799,
  'O-H': 463,
  'O=O': 498,
  'N-H': 391,
  'N=N': 418,
  'N≡N': 945,
} as const;

// Common molecules library
export const COMMON_MOLECULES: Record<string, Omit<Molecule, 'id'>> = {
  water: {
    name: 'Water',
    formula: 'H2O',
    atoms: [
      { id: 'O1', element: 'O', position: { x: 0, y: 0, z: 0 } },
      { id: 'H1', element: 'H', position: { x: 0.96, y: 0, z: 0 } },
      { id: 'H2', element: 'H', position: { x: -0.24, y: 0.93, z: 0 } },
    ],
    bonds: [
      { id: 'b1', atom1: 'O1', atom2: 'H1', type: 'single', energy: 463 },
      { id: 'b2', atom1: 'O1', atom2: 'H2', type: 'single', energy: 463 },
    ],
    molecularWeight: 18.015,
    energy: -285.8,
    polarity: 'polar',
  },
  co2: {
    name: 'Carbon Dioxide',
    formula: 'CO2',
    atoms: [
      { id: 'C1', element: 'C', position: { x: 0, y: 0, z: 0 } },
      { id: 'O1', element: 'O', position: { x: -1.16, y: 0, z: 0 } },
      { id: 'O2', element: 'O', position: { x: 1.16, y: 0, z: 0 } },
    ],
    bonds: [
      { id: 'b1', atom1: 'C1', atom2: 'O1', type: 'double', energy: 799 },
      { id: 'b2', atom1: 'C1', atom2: 'O2', type: 'double', energy: 799 },
    ],
    molecularWeight: 44.009,
    energy: -393.5,
    polarity: 'nonpolar',
  },
  methane: {
    name: 'Methane',
    formula: 'CH4',
    atoms: [
      { id: 'C1', element: 'C', position: { x: 0, y: 0, z: 0 } },
      { id: 'H1', element: 'H', position: { x: 1.09, y: 0, z: 0 } },
      { id: 'H2', element: 'H', position: { x: -0.36, y: 1.03, z: 0 } },
      { id: 'H3', element: 'H', position: { x: -0.36, y: -0.51, z: 0.89 } },
      { id: 'H4', element: 'H', position: { x: -0.36, y: -0.51, z: -0.89 } },
    ],
    bonds: [
      { id: 'b1', atom1: 'C1', atom2: 'H1', type: 'single', energy: 413 },
      { id: 'b2', atom1: 'C1', atom2: 'H2', type: 'single', energy: 413 },
      { id: 'b3', atom1: 'C1', atom2: 'H3', type: 'single', energy: 413 },
      { id: 'b4', atom1: 'C1', atom2: 'H4', type: 'single', energy: 413 },
    ],
    molecularWeight: 16.043,
    energy: -74.9,
    polarity: 'nonpolar',
  },
  ethanol: {
    name: 'Ethanol',
    formula: 'C2H5OH',
    atoms: [
      { id: 'C1', element: 'C', position: { x: 0, y: 0, z: 0 } },
      { id: 'C2', element: 'C', position: { x: 1.54, y: 0, z: 0 } },
      { id: 'O1', element: 'O', position: { x: 2.31, y: 1.16, z: 0 } },
      { id: 'H1', element: 'H', position: { x: -0.36, y: -0.51, z: 0.89 } },
      { id: 'H2', element: 'H', position: { x: -0.36, y: -0.51, z: -0.89 } },
      { id: 'H3', element: 'H', position: { x: -0.36, y: 1.03, z: 0 } },
      { id: 'H4', element: 'H', position: { x: 1.9, y: -0.51, z: 0.89 } },
      { id: 'H5', element: 'H', position: { x: 1.9, y: -0.51, z: -0.89 } },
      { id: 'H6', element: 'H', position: { x: 3.26, y: 1.16, z: 0 } },
    ],
    bonds: [
      { id: 'b1', atom1: 'C1', atom2: 'C2', type: 'single', energy: 347 },
      { id: 'b2', atom1: 'C2', atom2: 'O1', type: 'single', energy: 358 },
      { id: 'b3', atom1: 'C1', atom2: 'H1', type: 'single', energy: 413 },
      { id: 'b4', atom1: 'C1', atom2: 'H2', type: 'single', energy: 413 },
      { id: 'b5', atom1: 'C1', atom2: 'H3', type: 'single', energy: 413 },
      { id: 'b6', atom1: 'C2', atom2: 'H4', type: 'single', energy: 413 },
      { id: 'b7', atom1: 'C2', atom2: 'H5', type: 'single', energy: 413 },
      { id: 'b8', atom1: 'O1', atom2: 'H6', type: 'single', energy: 463 },
    ],
    molecularWeight: 46.069,
    energy: -277.7,
    polarity: 'polar',
  },
  glucose: {
    name: 'Glucose',
    formula: 'C6H12O6',
    atoms: [
      { id: 'C1', element: 'C', position: { x: 0, y: 0, z: 0 } },
      { id: 'C2', element: 'C', position: { x: 1.54, y: 0, z: 0 } },
      { id: 'C3', element: 'C', position: { x: 2.31, y: 1.33, z: 0 } },
      { id: 'C4', element: 'C', position: { x: 1.54, y: 2.66, z: 0 } },
      { id: 'C5', element: 'C', position: { x: 0, y: 2.66, z: 0 } },
      { id: 'C6', element: 'C', position: { x: -0.77, y: 1.33, z: 0 } },
      // Simplified - would need all 12 H and 6 O atoms
    ],
    bonds: [],
    molecularWeight: 180.156,
    energy: -1273.3,
    polarity: 'polar',
  },
  benzene: {
    name: 'Benzene',
    formula: 'C6H6',
    atoms: [
      { id: 'C1', element: 'C', position: { x: 1.4, y: 0, z: 0 } },
      { id: 'C2', element: 'C', position: { x: 0.7, y: 1.21, z: 0 } },
      { id: 'C3', element: 'C', position: { x: -0.7, y: 1.21, z: 0 } },
      { id: 'C4', element: 'C', position: { x: -1.4, y: 0, z: 0 } },
      { id: 'C5', element: 'C', position: { x: -0.7, y: -1.21, z: 0 } },
      { id: 'C6', element: 'C', position: { x: 0.7, y: -1.21, z: 0 } },
    ],
    bonds: [
      { id: 'b1', atom1: 'C1', atom2: 'C2', type: 'double', energy: 614 },
      { id: 'b2', atom1: 'C2', atom2: 'C3', type: 'single', energy: 347 },
      { id: 'b3', atom1: 'C3', atom2: 'C4', type: 'double', energy: 614 },
      { id: 'b4', atom1: 'C4', atom2: 'C5', type: 'single', energy: 347 },
      { id: 'b5', atom1: 'C5', atom2: 'C6', type: 'double', energy: 614 },
      { id: 'b6', atom1: 'C6', atom2: 'C1', type: 'single', energy: 347 },
    ],
    molecularWeight: 78.114,
    energy: 82.9,
    polarity: 'nonpolar',
  },
};

// Common reactions
export const COMMON_REACTIONS: Omit<Reaction, 'id' | 'reactants' | 'products'>[] = [
  {
    name: 'Water Formation',
    equation: '2H2 + O2 → 2H2O',
    energyChange: -483.6,
    type: 'synthesis',
    spontaneous: true,
  },
  {
    name: 'Combustion of Methane',
    equation: 'CH4 + 2O2 → CO2 + 2H2O',
    energyChange: -890.0,
    type: 'combustion',
    spontaneous: true,
  },
  {
    name: 'Photosynthesis (simplified)',
    equation: '6CO2 + 6H2O → C6H12O6 + 6O2',
    energyChange: 2803.0,
    type: 'synthesis',
    spontaneous: false,
  },
  {
    name: 'Combustion of Ethanol',
    equation: 'C2H5OH + 3O2 → 2CO2 + 3H2O',
    energyChange: -1367.0,
    type: 'combustion',
    spontaneous: true,
  },
  {
    name: 'Decomposition of Water',
    equation: '2H2O → 2H2 + O2',
    energyChange: 483.6,
    type: 'decomposition',
    spontaneous: false,
  },
];

/**
 * Calculate molecular weight from atoms
 */
export function calculateMolecularWeight(atoms: Atom[]): number {
  return atoms.reduce((total, atom) => {
    const element = ELEMENTS[atom.element as keyof typeof ELEMENTS];
    return total + (element?.atomicMass || 0);
  }, 0);
}

/**
 * Calculate total bond energy
 */
export function calculateBondEnergy(bonds: Bond[]): number {
  return bonds.reduce((total, bond) => total + bond.energy, 0);
}

/**
 * Validate molecule structure
 */
export function validateMolecule(molecule: Molecule): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if all bonds reference valid atoms
  for (const bond of molecule.bonds) {
    const atom1 = molecule.atoms.find((a) => a.id === bond.atom1);
    const atom2 = molecule.atoms.find((a) => a.id === bond.atom2);

    if (!atom1 || !atom2) {
      errors.push(`Bond ${bond.id} references non-existent atom(s)`);
    }
  }

  // Check valence (simplified)
  const bondCounts: Record<string, number> = {};
  for (const bond of molecule.bonds) {
    const multiplier = bond.type === 'single' ? 1 : bond.type === 'double' ? 2 : 3;
    bondCounts[bond.atom1] = (bondCounts[bond.atom1] || 0) + multiplier;
    bondCounts[bond.atom2] = (bondCounts[bond.atom2] || 0) + multiplier;
  }

  for (const atom of molecule.atoms) {
    const element = ELEMENTS[atom.element as keyof typeof ELEMENTS];
    if (element && bondCounts[atom.id] > element.valence) {
      errors.push(
        `Atom ${atom.id} (${atom.element}) exceeds valence: ${bondCounts[atom.id]} > ${element.valence}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if reaction conserves atoms
 */
export function validateReaction(reaction: Reaction): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Count atoms in reactants
  const reactantAtoms: Record<string, number> = {};
  for (const molecule of reaction.reactants) {
    for (const atom of molecule.atoms) {
      reactantAtoms[atom.element] = (reactantAtoms[atom.element] || 0) + 1;
    }
  }

  // Count atoms in products
  const productAtoms: Record<string, number> = {};
  for (const molecule of reaction.products) {
    for (const atom of molecule.atoms) {
      productAtoms[atom.element] = (productAtoms[atom.element] || 0) + 1;
    }
  }

  // Check conservation
  const allElements = new Set([
    ...Object.keys(reactantAtoms),
    ...Object.keys(productAtoms),
  ]);

  for (const element of allElements) {
    const reactantCount = reactantAtoms[element] || 0;
    const productCount = productAtoms[element] || 0;
    if (reactantCount !== productCount) {
      errors.push(
        `Atom ${element} not conserved: ${reactantCount} reactant(s) vs ${productCount} product(s)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create molecule from library
 */
export function createMolecule(name: keyof typeof COMMON_MOLECULES): Molecule {
  const template = COMMON_MOLECULES[name];
  return {
    ...template,
    id: `mol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Generate molecular formula from atoms
 */
export function generateFormula(atoms: Atom[]): string {
  const counts: Record<string, number> = {};
  for (const atom of atoms) {
    counts[atom.element] = (counts[atom.element] || 0) + 1;
  }

  // Sort by: C, H, then alphabetical
  const elements = Object.keys(counts).sort((a, b) => {
    if (a === 'C') return -1;
    if (b === 'C') return 1;
    if (a === 'H') return -1;
    if (b === 'H') return 1;
    return a.localeCompare(b);
  });

  return elements
    .map((element) => {
      const count = counts[element];
      return count === 1 ? element : `${element}${count}`;
    })
    .join('');
}
