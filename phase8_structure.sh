#!/bin/bash
# AGI-CAD Phase 8 Mono-Repo Setup Script

# Root structure
mkdir -p agi-cad && cd agi-cad

# Create directory tree
mkdir -p {frontend,backend,packages/types,functions,docs,tests}

# Frontend (Next.js 14)
mkdir -p frontend/{src/{app,components,lib,hooks,types},public}
mkdir -p frontend/src/app/{api,viewer,gallery}
mkdir -p frontend/src/components/{ui,glyph,telemetry}

# Backend (Python Compressor)
mkdir -p backend/{src/{codecs,preprocessor,utils},tests,models}

# Cloud Functions
mkdir -p functions/{src,tests}

# Shared Types
mkdir -p packages/types/src

# Documentation
mkdir -p docs/{specs,audits,phase-plans}

# Test fixtures
mkdir -p tests/{fixtures/{stl,agc},e2e}

echo "✓ Directory structure created"

# Initialize package.json at root (pnpm workspace)
cat > package.json << 'EOF'
{
  "name": "agi-cad-monorepo",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "frontend",
    "functions",
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm --filter frontend dev",
    "dev:functions": "pnpm --filter functions dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
EOF

# Initialize pnpm workspace
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'frontend'
  - 'functions'
  - 'packages/*'
EOF

echo "✓ Workspace configuration created"

# Frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "@agi-cad/frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.8.0",
    "@webgpu/types": "^0.1.40",
    "three": "^0.160.0",
    "zustand": "^4.5.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0"
  }
}
EOF

# Backend requirements.txt
cat > backend/requirements.txt << 'EOF'
trimesh==4.0.10
numpy==1.26.3
scipy==1.11.4
pyvista==0.43.2
Flask==3.0.0
google-cloud-storage==2.14.0
google-cloud-firestore==2.14.0
python-dotenv==1.0.0
pytest==7.4.4
black==23.12.1
mypy==1.8.0
EOF

# Python setup.py
cat > backend/setup.py << 'EOF'
from setuptools import setup, find_packages

setup(
    name="agi-cad-backend",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.10",
    install_requires=[
        "trimesh>=4.0.10",
        "numpy>=1.26.3",
        "scipy>=1.11.4",
        "pyvista>=0.43.2",
    ],
)
EOF

# Cloud Functions package.json
cat > functions/package.json << 'EOF'
{
  "name": "@agi-cad/functions",
  "version": "0.1.0",
  "private": true,
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.6.0",
    "@google-cloud/storage": "^7.7.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.5",
    "firebase-functions-test": "^3.1.1"
  }
}
EOF

# Shared types package.json
cat > packages/types/package.json << 'EOF'
{
  "name": "@agi-cad/types",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

echo "✓ Package files created"
echo ""
echo "Next steps:"
echo "1. cd agi-cad"
echo "2. pnpm install"
echo "3. cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "4. firebase init (select Functions, Firestore, Storage)"
echo "5. pnpm dev (starts Next.js dev server)"
