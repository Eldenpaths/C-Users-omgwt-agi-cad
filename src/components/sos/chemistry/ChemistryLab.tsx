'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder } from '@react-three/drei';
import {
  Flask,
  Atom,
  Beaker,
  Trash2,
  Save,
  RotateCcw,
  Play,
  Info,
} from 'lucide-react';
import {
  Molecule,
  Atom as AtomType,
  Bond,
  ELEMENTS,
  COMMON_MOLECULES,
  createMolecule,
  calculateMolecularWeight,
  validateMolecule,
  generateFormula,
} from '@/lib/chemistry/reactions';
import * as THREE from 'three';

export default function ChemistryLab() {
  const [currentMolecule, setCurrentMolecule] = useState<Molecule | null>(null);
  const [selectedElement, setSelectedElement] = useState<keyof typeof ELEMENTS>('C');
  const [selectedBondType, setSelectedBondType] = useState<Bond['type']>('single');
  const [selectedAtoms, setSelectedAtoms] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  const loadMolecule = (name: keyof typeof COMMON_MOLECULES) => {
    const molecule = createMolecule(name);
    setCurrentMolecule(molecule);
    setSelectedAtoms([]);
  };

  const addAtom = (position: { x: number; y: number; z: number }) => {
    if (!currentMolecule) {
      // Create new molecule
      const newAtom: AtomType = {
        id: `atom_${Date.now()}`,
        element: selectedElement,
        position,
      };

      setCurrentMolecule({
        id: `mol_${Date.now()}`,
        name: 'Custom Molecule',
        formula: selectedElement,
        atoms: [newAtom],
        bonds: [],
        molecularWeight: ELEMENTS[selectedElement].atomicMass,
        energy: 0,
        polarity: 'nonpolar',
      });
    } else {
      // Add atom to existing molecule
      const newAtom: AtomType = {
        id: `atom_${Date.now()}`,
        element: selectedElement,
        position,
      };

      const updatedMolecule = {
        ...currentMolecule,
        atoms: [...currentMolecule.atoms, newAtom],
        formula: generateFormula([...currentMolecule.atoms, newAtom]),
        molecularWeight: calculateMolecularWeight([...currentMolecule.atoms, newAtom]),
      };

      setCurrentMolecule(updatedMolecule);
    }
  };

  const createBond = () => {
    if (!currentMolecule || selectedAtoms.length !== 2) return;

    const [atom1, atom2] = selectedAtoms;
    const bondEnergy = selectedBondType === 'single' ? 300 : selectedBondType === 'double' ? 600 : 900;

    const newBond: Bond = {
      id: `bond_${Date.now()}`,
      atom1,
      atom2,
      type: selectedBondType,
      energy: bondEnergy,
    };

    const updatedMolecule = {
      ...currentMolecule,
      bonds: [...currentMolecule.bonds, newBond],
    };

    setCurrentMolecule(updatedMolecule);
    setSelectedAtoms([]);
  };

  const clearMolecule = () => {
    setCurrentMolecule(null);
    setSelectedAtoms([]);
  };

  const saveMolecule = () => {
    if (!currentMolecule) return;
    // TODO: Save to VAULT
    console.log('Saving molecule to VAULT:', currentMolecule);
  };

  const validation = currentMolecule ? validateMolecule(currentMolecule) : null;

  return (
    <div className="h-full flex gap-4">
      {/* Control Panel */}
      <div className="w-80 bg-gray-900/60 border border-amber-500/30 rounded-xl p-4 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flask className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-400">Chemistry Lab</h3>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors"
          >
            <Info className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300"
          >
            <p className="mb-2">
              <strong>How to use:</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Select element and click in 3D space to add atoms</li>
              <li>Select 2 atoms and click "Create Bond"</li>
              <li>Use library to load common molecules</li>
              <li>Rotate view by dragging</li>
            </ul>
          </motion.div>
        )}

        {/* Elements */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Elements</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ELEMENTS).map(([symbol, element]) => (
              <button
                key={symbol}
                onClick={() => setSelectedElement(symbol as keyof typeof ELEMENTS)}
                className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedElement === symbol
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-600'
                }`}
                style={{ backgroundColor: element.color + '20' }}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Bond Types */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Bond Type</h4>
          <div className="flex gap-2">
            {(['single', 'double', 'triple'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedBondType(type)}
                className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                  selectedBondType === type
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-600'
                }`}
              >
                {type === 'single' ? '─' : type === 'double' ? '═' : '≡'}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Actions</h4>
          <div className="space-y-2">
            <button
              onClick={createBond}
              disabled={selectedAtoms.length !== 2}
              className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-800/40 border border-blue-500/40 disabled:border-gray-700 rounded-lg text-sm text-blue-300 disabled:text-gray-500 transition-all flex items-center justify-center gap-2"
            >
              <Atom className="w-4 h-4" />
              Create Bond ({selectedAtoms.length}/2)
            </button>
            <button
              onClick={clearMolecule}
              className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-sm text-red-300 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Molecule Library */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Molecule Library</h4>
          <div className="space-y-1">
            {Object.keys(COMMON_MOLECULES).map((name) => {
              const molecule = COMMON_MOLECULES[name as keyof typeof COMMON_MOLECULES];
              return (
                <button
                  key={name}
                  onClick={() => loadMolecule(name as keyof typeof COMMON_MOLECULES)}
                  className="w-full p-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-amber-500/40 rounded-lg text-left transition-all"
                >
                  <div className="text-sm font-medium text-gray-200">{molecule.name}</div>
                  <div className="text-xs text-gray-500">{molecule.formula}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Molecule Info */}
        {currentMolecule && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-amber-400">Current Molecule</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Formula:</span>
                <span className="text-gray-200 font-mono">{currentMolecule.formula}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weight:</span>
                <span className="text-gray-200">{currentMolecule.molecularWeight.toFixed(2)} g/mol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Atoms:</span>
                <span className="text-gray-200">{currentMolecule.atoms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bonds:</span>
                <span className="text-gray-200">{currentMolecule.bonds.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Polarity:</span>
                <span className="text-gray-200 capitalize">{currentMolecule.polarity}</span>
              </div>
            </div>

            {validation && !validation.valid && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-300">
                <strong>Validation Errors:</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {validation.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={saveMolecule}
              disabled={!validation?.valid}
              className="w-full mt-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-800/40 border border-green-500/40 disabled:border-gray-700 rounded-lg text-sm text-green-300 disabled:text-gray-500 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save to VAULT
            </button>
          </div>
        )}
      </div>

      {/* 3D Visualizer */}
      <div className="flex-1 bg-black/40 border border-amber-500/30 rounded-xl overflow-hidden relative">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

          {/* Render molecule */}
          {currentMolecule && (
            <MoleculeView
              molecule={currentMolecule}
              selectedAtoms={selectedAtoms}
              onAtomClick={(atomId) => {
                if (selectedAtoms.includes(atomId)) {
                  setSelectedAtoms(selectedAtoms.filter((id) => id !== atomId));
                } else if (selectedAtoms.length < 2) {
                  setSelectedAtoms([...selectedAtoms, atomId]);
                }
              }}
            />
          )}

          {/* Grid helper */}
          <gridHelper args={[10, 10, '#444444', '#222222']} />
        </Canvas>

        {/* Instructions overlay */}
        {!currentMolecule && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <Beaker className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No molecule loaded</p>
              <p className="text-sm mt-2">Load from library or add atoms to create</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 3D Molecule Renderer
interface MoleculeViewProps {
  molecule: Molecule;
  selectedAtoms: string[];
  onAtomClick: (atomId: string) => void;
}

function MoleculeView({ molecule, selectedAtoms, onAtomClick }: MoleculeViewProps) {
  return (
    <group>
      {/* Render atoms */}
      {molecule.atoms.map((atom) => {
        const element = ELEMENTS[atom.element as keyof typeof ELEMENTS];
        const isSelected = selectedAtoms.includes(atom.id);

        return (
          <mesh
            key={atom.id}
            position={[atom.position.x, atom.position.y, atom.position.z]}
            onClick={() => onAtomClick(atom.id)}
          >
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
              color={element?.color || '#FFFFFF'}
              emissive={isSelected ? '#FFAA00' : '#000000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
        );
      })}

      {/* Render bonds */}
      {molecule.bonds.map((bond) => {
        const atom1 = molecule.atoms.find((a) => a.id === bond.atom1);
        const atom2 = molecule.atoms.find((a) => a.id === bond.atom2);

        if (!atom1 || !atom2) return null;

        const start = new THREE.Vector3(atom1.position.x, atom1.position.y, atom1.position.z);
        const end = new THREE.Vector3(atom2.position.x, atom2.position.y, atom2.position.z);
        const direction = end.clone().sub(start);
        const length = direction.length();
        const midpoint = start.clone().add(direction.multiplyScalar(0.5));

        return (
          <mesh key={bond.id} position={midpoint}>
            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
            <meshStandardMaterial color="#AAAAAA" />
          </mesh>
        );
      })}
    </group>
  );
}
