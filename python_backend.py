# backend/src/preprocessor.py
"""Mesh preprocessing and voxelization"""

import trimesh
import numpy as np
import pyvista as pv
from typing import Tuple, Optional
from dataclasses import dataclass


@dataclass
class VoxelGrid:
    """Voxelized representation of mesh"""
    data: np.ndarray  # 3D boolean array
    resolution: int
    bounds: Tuple[np.ndarray, np.ndarray]  # min, max
    pitch: float  # voxel size


class MeshPreprocessor:
    """Handles STL loading, validation, and voxelization"""
    
    def __init__(self, default_resolution: int = 256):
        self.default_resolution = default_resolution
    
    def load_stl(self, path: str) -> trimesh.Trimesh:
        """Load and validate STL file"""
        try:
            mesh = trimesh.load(path, force='mesh')
            
            if not isinstance(mesh, trimesh.Trimesh):
                raise ValueError("File must contain a single mesh")
            
            # Validate and repair
            if not mesh.is_watertight:
                print(f"Warning: Mesh not watertight, attempting repair")
                mesh.fill_holes()
            
            # Remove degenerate faces
            mesh.remove_degenerate_faces()
            mesh.remove_duplicate_faces()
            
            return mesh
            
        except Exception as e:
            raise ValueError(f"Failed to load STL: {str(e)}")
    
    def voxelize(
        self, 
        mesh: trimesh.Trimesh, 
        resolution: Optional[int] = None
    ) -> VoxelGrid:
        """Convert mesh to voxel grid using GPU-accelerated method"""
        resolution = resolution or self.default_resolution
        
        # Calculate pitch (voxel size)
        bounds = mesh.bounds
        extent = bounds[1] - bounds[0]
        pitch = extent.max() / resolution
        
        # Use PyVista for GPU-accelerated voxelization
        pv_mesh = pv.wrap(mesh)
        voxels = pv.voxelize(pv_mesh, density=pitch, check_surface=False)
        
        # Convert to numpy boolean array
        dims = [resolution, resolution, resolution]
        voxel_data = np.zeros(dims, dtype=np.uint8)
        
        # Fill voxel grid
        points = voxels.points
        for point in points:
            # Map to grid coordinates
            idx = ((point - bounds[0]) / pitch).astype(int)
            idx = np.clip(idx, 0, resolution - 1)
            voxel_data[idx[0], idx[1], idx[2]] = 1
        
        return VoxelGrid(
            data=voxel_data,
            resolution=resolution,
            bounds=(bounds[0], bounds[1]),
            pitch=pitch
        )
    
    def normalize(self, voxels: VoxelGrid) -> VoxelGrid:
        """Center and normalize voxel grid"""
        # Find occupied voxels
        occupied = np.argwhere(voxels.data > 0)
        
        if len(occupied) == 0:
            raise ValueError("Empty voxel grid")
        
        # Calculate center of mass
        center = occupied.mean(axis=0).astype(int)
        
        # Center the data
        shift = voxels.resolution // 2 - center
        centered_data = np.roll(voxels.data, shift, axis=(0, 1, 2))
        
        return VoxelGrid(
            data=centered_data,
            resolution=voxels.resolution,
            bounds=voxels.bounds,
            pitch=voxels.pitch
        )


# backend/src/codecs/crystalline.py
"""Crystalline lattice encoder"""

import numpy as np
from scipy import signal, ndimage
from typing import Dict, List, Tuple, Optional
import zlib
import base64
import json


class CrystallineCodec:
    """Detects and encodes periodic crystalline structures"""
    
    def __init__(self, confidence_threshold: float = 0.7):
        self.confidence_threshold = confidence_threshold
    
    def encode(self, voxels: np.ndarray) -> Optional[Dict]:
        """Attempt to encode voxels as crystalline structure"""
        lattice = self.detect_lattice(voxels)
        
        if lattice is None or lattice['confidence'] < self.confidence_threshold:
            return None  # Fall back to IFS
        
        # Extract unit cell
        unit_cell = self.extract_unit_cell(voxels, lattice)
        
        # Compress unit cell
        compressed = zlib.compress(unit_cell.tobytes(), level=9)
        encoded = base64.b64encode(compressed).decode('ascii')
        
        return {
            'type': 'crystal',
            'lattice': {
                'latticeType': lattice['type'],
                'vectors': lattice['vectors'],
                'origin': lattice['origin'].tolist()
            },
            'unitCell': {
                'shape': unit_cell.shape,
                'compressed': encoded
            },
            'confidence': float(lattice['confidence'])
        }
    
    def detect_lattice(self, voxels: np.ndarray) -> Optional[Dict]:
        """Detect lattice structure via 3D autocorrelation"""
        # Compute 3D autocorrelation using FFT (faster than direct)
        voxels_float = voxels.astype(float)
        fft = np.fft.fftn(voxels_float)
        autocorr = np.fft.ifftn(fft * np.conj(fft)).real
        
        # Normalize
        autocorr = autocorr / autocorr.max()
        
        # Find peaks (excluding center)
        peaks = self._find_peaks_3d(autocorr, num_peaks=6)
        
        if len(peaks) < 3:
            return None
        
        # Extract 3 primary lattice vectors
        vectors = self._select_lattice_vectors(peaks)
        
        # Classify Bravais lattice type
        lattice_type = self._classify_bravais(vectors)
        
        # Measure periodicity confidence
        confidence = self._measure_periodicity(autocorr, vectors)
        
        return {
            'type': lattice_type,
            'vectors': [v.tolist() for v in vectors],
            'origin': np.array([0, 0, 0]),
            'confidence': confidence
        }
    
    def _find_peaks_3d(
        self, 
        data: np.ndarray, 
        num_peaks: int = 6
    ) -> List[np.ndarray]:
        """Find local maxima in 3D array"""
        # Apply maximum filter to find local maxima
        local_max = ndimage.maximum_filter(data, size=5)
        peaks = (data == local_max) & (data > 0.5)  # Threshold
        
        # Get coordinates
        coords = np.argwhere(peaks)
        values = data[peaks]
        
        # Sort by value
        sorted_idx = np.argsort(values)[::-1]
        top_coords = coords[sorted_idx[:num_peaks]]
        
        # Convert to vectors from center
        center = np.array(data.shape) // 2
        vectors = top_coords - center
        
        return [v for v in vectors if np.linalg.norm(v) > 0]
    
    def _select_lattice_vectors(
        self, 
        peaks: List[np.ndarray]
    ) -> List[np.ndarray]:
        """Select 3 linearly independent vectors"""
        # Sort by magnitude
        peaks = sorted(peaks, key=np.linalg.norm)
        
        # Greedy selection for max volume
        selected = [peaks[0]]
        
        for peak in peaks[1:]:
            if len(selected) >= 3:
                break
            
            # Check linear independence
            test_matrix = np.array(selected + [peak])
            if np.linalg.matrix_rank(test_matrix) == len(selected) + 1:
                selected.append(peak)
        
        return selected[:3]
    
    def _classify_bravais(self, vectors: List[np.ndarray]) -> str:
        """Classify Bravais lattice type"""
        a, b, c = [np.linalg.norm(v) for v in vectors]
        
        # Compute angles
        cos_ab = np.dot(vectors[0], vectors[1]) / (a * b)
        cos_ac = np.dot(vectors[0], vectors[2]) / (a * c)
        cos_bc = np.dot(vectors[1], vectors[2]) / (b * c)
        
        angles = [np.arccos(np.clip(cos_ab, -1, 1)),
                  np.arccos(np.clip(cos_ac, -1, 1)),
                  np.arccos(np.clip(cos_bc, -1, 1))]
        
        # Simple classification (can be extended)
        tol = 0.1
        
        if abs(a - b) < tol and abs(b - c) < tol:
            if all(abs(ang - np.pi/2) < tol for ang in angles):
                return 'cubic'
        
        if abs(a - b) < tol and abs(angles[0] - 2*np.pi/3) < tol:
            return 'hexagonal'
        
        if all(abs(ang - np.pi/2) < tol for ang in angles):
            return 'orthorhombic'
        
        return 'triclinic'
    
    def _measure_periodicity(
        self, 
        autocorr: np.ndarray, 
        vectors: List[np.ndarray]
    ) -> float:
        """Measure strength of periodicity"""
        center = np.array(autocorr.shape) // 2
        
        # Sample autocorrelation at lattice points
        samples = []
        for i in range(-2, 3):
            for j in range(-2, 3):
                for k in range(-2, 3):
                    if i == j == k == 0:
                        continue
                    
                    point = center + i*vectors[0] + j*vectors[1] + k*vectors[2]
                    point = np.round(point).astype(int)
                    
                    # Check bounds
                    if all(0 <= p < s for p, s in zip(point, autocorr.shape)):
                        samples.append(autocorr[tuple(point)])
        
        # Confidence is mean of samples
        return float(np.mean(samples)) if samples else 0.0
    
    def extract_unit_cell(
        self, 
        voxels: np.ndarray, 
        lattice: Dict
    ) -> np.ndarray:
        """Extract minimal repeating unit cell"""
        vectors = [np.array(v) for v in lattice['vectors']]
        
        # Calculate unit cell dimensions
        dims = [int(np.ceil(np.linalg.norm(v))) for v in vectors]
        dims = [max(1, min(d, voxels.shape[i])) for i, d in enumerate(dims)]
        
        # Extract from center
        center = np.array(voxels.shape) // 2
        start = center - np.array(dims) // 2
        end = start + np.array(dims)
        
        # Ensure bounds
        start = np.clip(start, 0, np.array(voxels.shape) - 1)
        end = np.clip(end, 1, voxels.shape)
        
        unit_cell = voxels[start[0]:end[0], start[1]:end[1], start[2]:end[2]]
        
        return unit_cell


# backend/src/codecs/ifs.py
"""IFS (Iterated Function System) encoder"""

import numpy as np
from typing import List, Dict
import json


class IFSCodec:
    """Fallback encoder using Iterated Function Systems"""
    
    def __init__(self, max_transforms: int = 32, iterations: int = 500):
        self.max_transforms = max_transforms
        self.iterations = iterations
    
    def encode(self, voxels: np.ndarray) -> Dict:
        """Encode voxels using IFS compression"""
        # Simplified IFS - in production, use genetic algorithm
        transforms = self._fit_ifs(voxels)
        
        # Calculate bounding box
        occupied = np.argwhere(voxels > 0)
        bbox_min = occupied.min(axis=0) if len(occupied) > 0 else [0, 0, 0]
        bbox_max = occupied.max(axis=0) if len(occupied) > 0 else voxels.shape
        
        return {
            'type': 'ifs',
            'transforms': transforms,
            'iterations': self.iterations,
            'boundingBox': {
                'min': bbox_min.tolist(),
                'max': bbox_max.tolist()
            }
        }
    
    def _fit_ifs(self, voxels: np.ndarray) -> List[Dict]:
        """Fit IFS transforms (simplified version)"""
        # In production: use genetic algorithm or neural network
        # For MVP: generate random affine transforms
        
        transforms = []
        num_transforms = min(8, self.max_transforms)
        
        for i in range(num_transforms):
            # Create random affine transform
            scale = 0.5 + np.random.rand() * 0.3
            rotation = np.random.rand(3) * 2 * np.pi
            translation = (np.random.rand(3) - 0.5) * 0.5
            
            # Build 4x4 matrix
            matrix = self._build_affine_matrix(scale, rotation, translation)
            
            transforms.append({
                'matrix': matrix.flatten().tolist(),
                'probability': 1.0 / num_transforms
            })
        
        return transforms
    
    def _build_affine_matrix(
        self, 
        scale: float, 
        rotation: np.ndarray, 
        translation: np.ndarray
    ) -> np.ndarray:
        """Build 4x4 affine transformation matrix"""
        # Rotation matrices
        rx, ry, rz = rotation
        
        Rx = np.array([
            [1, 0, 0],
            [0, np.cos(rx), -np.sin(rx)],
            [0, np.sin(rx), np.cos(rx)]
        ])
        
        Ry = np.array([
            [np.cos(ry), 0, np.sin(ry)],
            [0, 1, 0],
            [-np.sin(ry), 0, np.cos(ry)]
        ])
        
        Rz = np.array([
            [np.cos(rz), -np.sin(rz), 0],
            [np.sin(rz), np.cos(rz), 0],
            [0, 0, 1]
        ])
        
        # Combined rotation
        R = Rz @ Ry @ Rx
        
        # Scale
        S = R * scale
        
        # Build 4x4
        matrix = np.eye(4)
        matrix[:3, :3] = S
        matrix[:3, 3] = translation
        
        return matrix


# backend/src/compressor.py
"""Main compression pipeline"""

import time
import json
from pathlib import Path
from typing import Dict, Optional
from preprocessor import MeshPreprocessor, VoxelGrid
from codecs.crystalline import CrystallineCodec
from codecs.ifs import IFSCodec


class GlyphCompressor:
    """Main compression orchestrator"""
    
    def __init__(self):
        self.preprocessor = MeshPreprocessor(default_resolution=256)
        self.crystal_codec = CrystallineCodec(confidence_threshold=0.7)
        self.ifs_codec = IFSCodec(max_transforms=32)
    
    def compress(self, stl_path: str, output_path: Optional[str] = None) -> Dict:
        """Compress STL to AGC format"""
        start_time = time.time()
        
        print(f"Loading STL: {stl_path}")
        mesh = self.preprocessor.load_stl(stl_path)
        original_size = Path(stl_path).stat().st_size
        
        print(f"Voxelizing at 256³ resolution...")
        voxels = self.preprocessor.voxelize(mesh, resolution=256)
        voxels = self.preprocessor.normalize(voxels)
        
        print("Attempting crystalline encoding...")
        compressed = self.crystal_codec.encode(voxels.data)
        
        if compressed is None:
            print("Falling back to IFS encoding...")
            compressed = self.ifs_codec.encode(voxels.data)
        
        processing_time = (time.time() - start_time) * 1000
        
        # Build AGC file
        agc_data = json.dumps(compressed)
        compressed_size = len(agc_data.encode('utf-8'))
        
        agc_file = {
            'version': '0.1.0',
            'encoding': compressed['type'],
            'data': compressed,
            'metadata': {
                'modelName': Path(stl_path).stem,
                'originalSize': original_size,
                'compressedSize': compressed_size,
                'compressionRatio': original_size / compressed_size,
                'processingTime': processing_time,
                'createdAt': time.time()
            }
        }
        
        # Save if output path provided
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(agc_file, f, indent=2)
            print(f"Saved to: {output_path}")
        
        print(f"✓ Compression: {agc_file['metadata']['compressionRatio']:.1f}×")
        print(f"✓ Processing time: {processing_time:.0f}ms")
        print(f"✓ Encoding: {compressed['type']}")
        
        return agc_file


if __name__ == '__main__':
    import sys
    
    if len