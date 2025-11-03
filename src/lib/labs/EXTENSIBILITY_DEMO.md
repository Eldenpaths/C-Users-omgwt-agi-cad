# Lab Registry System - Extensibility Demo

## 🎯 How Easy Is It To Add A New Lab?

**Answer: 3 simple steps, ~30 lines of code**

---

## Example: Adding a "Crypto Token Simulator"

### Step 1: Create the Lab Component (20 lines)

```tsx
// src/lib/labs/components/TokenSimulator.tsx
'use client';
import { useState } from 'react';

export default function TokenSimulator() {
  const [supply, setSupply] = useState(1000000);
  const [price, setPrice] = useState(1.0);

  return (
    <div className="p-6 bg-black/30 border border-amber-500/20 rounded-lg">
      <h3 className="text-xl text-amber-300 mb-4">Token Economics Simulator</h3>

      <div className="space-y-4">
        <div>
          <label className="text-amber-400">Supply: {supply.toLocaleString()}</label>
          <input
            type="range"
            min="100000"
            max="10000000"
            value={supply}
            onChange={(e) => setSupply(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <div className="text-2xl text-emerald-400">
          Market Cap: ${(supply * price).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Register the Lab (8 lines)

```tsx
// In src/lib/labs/system-labs.ts

import TokenSimulator from './components/TokenSimulator';

// Add to initializeSystemLabs():
registerLab({
  id: 'token-simulator',
  name: 'Token Economics Lab',
  description: 'Model token supply, demand, and market dynamics',
  icon: '💰',
  creator: 'system',
  category: 'crypto',
  component: TokenSimulator,
  permissions: [],
  tags: ['tokenomics', 'defi', 'economics'],
  version: '1.0.0',
});
```

### Step 3: Add to Area (1 line)

```tsx
// In src/lib/labs/system-labs.ts

// Update the crypto area:
registerArea({
  id: 'crypto',
  name: 'Crypto',
  description: 'Blockchain, tokenomics, and decentralized systems',
  icon: '₿',
  color: 'emerald',
  labs: ['token-simulator'], // ← Add here
});
```

**DONE!** The lab now appears in the Crypto area, fully functional.

---

## For User-Created Labs (Phase 3+)

```tsx
// Same pattern, but stored in Firestore instead of code:

const userLab = {
  id: `user-${userId}-music-theory`,
  name: 'Music Theory Lab',
  creator: 'user',
  userId: userId,
  componentCode: '...', // Sandboxed React component as string
  ...
};

await firestoreClient.saveUserLab(userLab);
// System dynamically loads and sandboxes the component
```

---

## Architecture Benefits

✅ **Labs are isolated** - One lab can't break another
✅ **Labs are portable** - Easy to share/export
✅ **VAULT is universal** - Stores experiments from ANY lab
✅ **Easy to test** - Each lab is self-contained
✅ **Future-proof** - User labs use the same pattern

---

## What's Next?

### Phase 19-20 (Weeks 2-4)
- Multi-agent coordination
- Cross-lab workflows (Science → Crypto → Design)

### Phase 23 (Months 4-6) 🎯 SANDBOX
- **Agent Training Ground** - `/sos/sandbox`
- **Lab Builder UI** - Visual editor for creating labs
- **User Lab Marketplace** - Discover and install community labs

### Phase 24 (Year 1) 🚀 FULL EXTENSIBILITY
- Developer SDK
- Revenue sharing for lab creators
- "App Store" for SOS labs

---

## Current Architecture (Built Today)

```
/sos
├── Registry System ✅
│   ├── Lab metadata
│   ├── Area groupings
│   └── Dynamic loading
├── System Labs ✅
│   ├── Plasma Lab
│   └── Spectral Lab
├── Areas ✅
│   ├── Science (2 labs)
│   ├── Crypto (ready for labs)
│   ├── Design (ready for labs)
│   └── Custom (user labs)
└── VAULT ✅
    └── Lab-agnostic storage
```

**Foundation: COMPLETE ✓**
**Extensibility: PROVEN ✓**
**Ready for: User labs, Agent sandbox, Lab builder**
