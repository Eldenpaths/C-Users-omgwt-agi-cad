# Phase 27 Integration Guide

**Status**: ✅ Complete

Phase 27 introduces comprehensive security and task routing enhancements to AGI-CAD:

1. **Soul ID**: Persistent user identity with EdDSA signatures
2. **Glyph Language**: Symbolic encoding + AES-256 encryption
3. **Task Routing**: FS-QMIX with D_var complexity scoring
4. **Real-time Sync**: WebSocket + Redis Pub/Sub
5. **Automated Backups**: Firestore snapshots with delta diffs

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Soul ID System](#soul-id-system)
- [Glyph Language Encryption](#glyph-language-encryption)
- [Task Routing](#task-routing)
- [Real-time Synchronization](#real-time-synchronization)
- [Automated Backups](#automated-backups)
- [API Reference](#api-reference)
- [React Integration](#react-integration)
- [Security Best Practices](#security-best-practices)

---

## Architecture Overview

```
┌─────────────────┐
│   Nexus Chat    │
│   Components    │
└────────┬────────┘
         │
         │ useSoulID()
         │ useWebSocket()
         ▼
┌─────────────────────────────────────────────┐
│           Phase 27 Integration Layer         │
├─────────────────────────────────────────────┤
│  • Soul ID Authentication (EdDSA)           │
│  • Glyph Language Encryption (AES-256)      │
│  • Signed Task Router (FS-QMIX + D_var)     │
│  • WebSocket Real-time Sync                 │
│  • Firestore Backup Manager                 │
└────────┬───────────────────────┬────────────┘
         │                       │
         ▼                       ▼
  ┌─────────────┐        ┌─────────────┐
  │  Firestore  │        │    Redis    │
  │   Database  │        │   Pub/Sub   │
  └─────────────┘        └─────────────┘
```

---

## Soul ID System

### Overview

Soul ID provides cryptographic identity for each user using EdDSA (Ed25519) signatures. Each user generates a unique keypair, and their Soul ID is derived from their public key.

### Key Features

- **EdDSA Signatures**: Ed25519 cryptographic signing
- **Persistent Identity**: Soul ID derived from public key hash
- **Auditability**: All actions logged with Soul ID
- **Data Integrity**: Signatures prevent tampering

### Usage

#### Generating a Soul ID

```typescript
import { generateSoulID } from '@/lib/security/soulId';

const { soulId, keyPair } = await generateSoulID({
  username: 'alice',
  email: 'alice@example.com'
});

console.log(soulId.id); // soul_a3f2d8e9c1b4...
```

#### Signing Data

```typescript
import { signData } from '@/lib/security/soulId';

const data = { taskId: '123', action: 'submit' };
const signedData = await signData(data, keyPair.privateKey, soulId.id);

// signedData contains:
// - data: original data
// - signature: EdDSA signature
// - soulId: signer's Soul ID
// - timestamp: signing time
```

#### Verifying Signatures

```typescript
import { verifySignature } from '@/lib/security/soulId';

const isValid = await verifySignature(signedData, soulId.publicKey);
console.log('Signature valid:', isValid);
```

### React Hook

```tsx
import { useSoulID } from '@/hooks/useSoulID';

function MyComponent() {
  const {
    soulId,
    isInitialized,
    generateNewSoulID,
    signDataWithSoulID,
    registerSoulID
  } = useSoulID();

  const handleGenerate = async () => {
    await generateNewSoulID({ username: 'alice' });
    await registerSoulID(); // Store in Firestore
  };

  const handleSign = async () => {
    const signed = await signDataWithSoulID({ message: 'Hello' });
    console.log(signed);
  };

  return (
    <div>
      {soulId ? (
        <>
          <p>Soul ID: {soulId.id}</p>
          <button onClick={handleSign}>Sign Data</button>
        </>
      ) : (
        <button onClick={handleGenerate}>Generate Soul ID</button>
      )}
    </div>
  );
}
```

---

## Glyph Language Encryption

### Overview

Glyph Language provides symbolic obfuscation combined with AES-256-GCM encryption for sensitive data.

### Key Features

- **Symbolic Encoding**: Converts text to mystical glyphs
- **AES-256-GCM**: Industry-standard encryption
- **PBKDF2 Key Derivation**: Secure key generation from passwords
- **Access Control**: Glyph-based keys for unlocking actions

### Usage

#### Encrypting Data

```typescript
import { encryptWithGlyphs } from '@/lib/security/glyphLanguage';

const sensitiveData = {
  apiKey: 'sk_live_abc123',
  userId: 'user_456'
};

const encrypted = await encryptWithGlyphs(
  sensitiveData,
  'mySecurePassword',
  true // Use glyph encoding
);

// encrypted contains:
// - ciphertext: encrypted data
// - iv: initialization vector
// - salt: PBKDF2 salt
// - glyphEncoded: true
// - timestamp: encryption time
```

#### Decrypting Data

```typescript
import { decryptWithGlyphs } from '@/lib/security/glyphLanguage';

const decrypted = await decryptWithGlyphs(encrypted, 'mySecurePassword');
console.log(decrypted); // Original data
```

#### Glyph Keys for Access Control

```typescript
import { createGlyphKey, verifyGlyphKey } from '@/lib/security/glyphLanguage';

// Admin creates a glyph key
const adminKey = createGlyphKey('OpenSesame', {
  hint: 'Ancient phrase to unlock the vault'
});

// User provides phrase to unlock
const userPhrase = 'OpenSesame';
const isValid = verifyGlyphKey(userPhrase, adminKey);

if (isValid) {
  // Grant access
  console.log('Access granted!');
}
```

---

## Task Routing

### Overview

Task routing uses the FS-QMIX algorithm with D_var complexity scoring to intelligently delegate tasks to the best AI agent (Claude, Gemini, GPT-4, etc.).

### D_var Complexity Scoring

D_var analyzes task text to determine complexity:

```
D_var = w_l * L_norm + w_p * P_norm + w_u * U_norm

Where:
- L_norm: Normalized text length
- P_norm: Normalized punctuation count
- U_norm: Unique token ratio
- w_l, w_p, w_u: Weights (0.5, 0.2, 0.3)
```

### Routing Logic

- **Low complexity (< 0.3)**: Fast, cost-effective agents (e.g., Llama)
- **Medium complexity (0.3-0.6)**: General-purpose agents (e.g., GPT-4, Gemini)
- **High complexity (> 0.6)**: Advanced reasoning agents (e.g., Claude)

### Usage

#### Standard Routing

```typescript
import { globalRouter } from '@/lib/routing/taskRouter';

const taskRequest = {
  id: '123',
  text: 'Explain quantum entanglement',
  metadata: {},
  createdAt: new Date()
};

const decision = await globalRouter.route(taskRequest);

console.log(decision.selectedAgent.name); // Claude
console.log(decision.complexityScore.d_var); // 0.72
console.log(decision.reason); // High complexity: routed to Claude...
```

#### Signed Routing with Soul ID

```typescript
import { globalSignedRouter } from '@/lib/routing/signedTaskRouter';

const taskRequest = {
  id: '123',
  text: 'Explain quantum entanglement',
  metadata: { soulId: 'soul_abc123' },
  createdAt: new Date()
};

const decision = await globalSignedRouter.routeWithSigning(
  taskRequest,
  privateKey // Optional: signs the routing decision
);

// decision includes:
// - signature: EdDSA signature
// - soulId: user's Soul ID
// - logged in Firestore for auditability
```

### API Endpoints

#### POST /api/route/task

Basic task routing (no authentication):

```bash
curl -X POST http://localhost:3000/api/route/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Explain quantum physics",
    "metadata": {
      "sessionId": "session_123",
      "outputFormat": "markdown"
    }
  }'
```

#### POST /api/route/task-signed

Signed task routing with Soul ID:

```bash
curl -X POST http://localhost:3000/api/route/task-signed \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Explain quantum physics",
    "signedData": {
      "data": { "action": "submit_task" },
      "signature": "base64_signature",
      "soulId": "soul_abc123",
      "timestamp": "2025-01-09T..."
    },
    "metadata": { "sessionId": "session_123" }
  }'
```

---

## Real-time Synchronization

### Overview

WebSocket + Redis Pub/Sub provide low-latency real-time communication for task routing updates and agent coordination.

### Architecture

```
Client (React)
    │
    │ useWebSocket()
    ▼
WebSocket Server (port 3001)
    │
    │ Subscribe/Publish
    ▼
Redis Pub/Sub
    │
    │ Channel: session:*:routing
    ▼
Routing Decisions → Clients
```

### Usage

#### React Component

```tsx
import { useWebSocket } from '@/hooks/useWebSocket';

function TaskMonitor() {
  const { isConnected, lastMessage, subscribe } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      subscribe('session:abc123:routing');
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    if (lastMessage?.type === 'message') {
      console.log('Routing update:', lastMessage.data);
    }
  }, [lastMessage]);

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {lastMessage && (
        <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
      )}
    </div>
  );
}
```

#### Starting the WebSocket Server

```bash
npm run dev:ws

# Or with Next.js dev server:
npm run dev
```

### Channels

- `session:<sessionId>:routing` - Routing decisions for a session
- `agent:<agentId>:status` - Agent availability updates
- `system:health` - System health metrics

---

## Automated Backups

### Overview

Firestore backup system with full snapshots and delta diffs for efficient storage and fast recovery.

### Features

- **Full Snapshots**: Complete backup of collections
- **Delta Backups**: Incremental changes only
- **Encryption**: AES-256 with Glyph Language
- **Signatures**: EdDSA signing for integrity
- **Pruning**: Automatic cleanup of old backups

### Usage

#### Creating a Full Backup

```typescript
import { BackupManager } from '@/lib/storage/firestoreBackup';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const backupManager = new BackupManager(db, 'encryption_password');

const snapshot = await backupManager.createFullSnapshot(
  ['users', 'tasks', 'routing_decisions'],
  'soul_abc123', // Optional Soul ID
  privateKey // Optional signing key
);

console.log(snapshot.id); // snapshot_1704835200000
console.log(snapshot.documentCount); // 1523
console.log(snapshot.size); // 2048576 bytes
```

#### Creating a Delta Backup

```typescript
const deltaSnapshot = await backupManager.createDeltaBackup(
  ['users', 'tasks'],
  'snapshot_1704835200000', // Parent snapshot
  'soul_abc123',
  privateKey
);

console.log(deltaSnapshot.type); // delta
console.log(deltaSnapshot.size); // 102400 bytes (much smaller!)
```

#### Restoring from Backup

```typescript
const restoredCount = await backupManager.restoreFromSnapshot(
  'snapshot_1704835200000',
  ['users'] // Optional: restore specific collections
);

console.log(`Restored ${restoredCount} documents`);
```

### API Endpoints

#### POST /api/backup

Create a backup:

```bash
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{
    "type": "full",
    "collections": ["users", "tasks"]
  }'
```

#### GET /api/backup

List backups:

```bash
curl http://localhost:3000/api/backup?limit=10
```

#### PUT /api/backup

Restore from backup:

```bash
curl -X PUT http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{
    "snapshotId": "snapshot_1704835200000",
    "targetCollections": ["users"]
  }'
```

#### DELETE /api/backup

Prune old backups:

```bash
curl -X DELETE "http://localhost:3000/api/backup?keepCount=3"
```

---

## API Reference

### Soul ID

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/soul-id/register` | POST | Register a new Soul ID |

### Task Routing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/route/task` | POST | Route a task (no auth) |
| `/api/route/task` | GET | Get routing statistics |
| `/api/route/task-signed` | POST | Route with Soul ID signing |
| `/api/route/task-signed` | GET | Get Soul ID routing analytics |

### Backup

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backup` | POST | Create full/delta backup |
| `/api/backup` | GET | List backups or get metadata |
| `/api/backup` | PUT | Restore from backup |
| `/api/backup` | DELETE | Prune old backups |

---

## React Integration

### Complete Example Component

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSoulID } from '@/hooks/useSoulID';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function Phase27Example() {
  const {
    soulId,
    isInitialized,
    generateNewSoulID,
    signDataWithSoulID,
    registerSoulID
  } = useSoulID();

  const {
    isConnected,
    lastMessage,
    subscribe,
    send
  } = useWebSocket();

  const [taskText, setTaskText] = useState('');
  const [routingResult, setRoutingResult] = useState<any>(null);

  // Initialize Soul ID
  useEffect(() => {
    if (!isInitialized) return;

    if (!soulId) {
      generateNewSoulID({ username: 'demo-user' })
        .then(() => registerSoulID());
    }
  }, [isInitialized, soulId, generateNewSoulID, registerSoulID]);

  // Subscribe to routing updates
  useEffect(() => {
    if (isConnected && soulId) {
      subscribe(`session:${soulId.id}:routing`);
    }
  }, [isConnected, soulId, subscribe]);

  // Handle routing updates
  useEffect(() => {
    if (lastMessage?.type === 'message') {
      console.log('Routing update:', lastMessage.data);
    }
  }, [lastMessage]);

  const handleSubmitTask = async () => {
    if (!soulId || !taskText) return;

    // Sign the task data
    const signedData = await signDataWithSoulID({ action: 'submit_task' });
    if (!signedData) return;

    // Submit to signed routing endpoint
    const response = await fetch('/api/route/task-signed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: taskText,
        signedData,
        metadata: { sessionId: soulId.id }
      })
    });

    const result = await response.json();
    setRoutingResult(result);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Phase 27 Integration Demo</h1>

      {/* Soul ID Status */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">Soul ID Status</h2>
        {soulId ? (
          <p className="text-sm">✅ ID: {soulId.id.substring(0, 20)}...</p>
        ) : (
          <p className="text-sm">⏳ Generating Soul ID...</p>
        )}
      </div>

      {/* WebSocket Status */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">Real-time Sync</h2>
        <p className="text-sm">
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </p>
      </div>

      {/* Task Submission */}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Submit Task</h2>
        <textarea
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Enter task description..."
          className="w-full p-2 border rounded"
          rows={4}
        />
        <button
          onClick={handleSubmitTask}
          disabled={!soulId || !taskText}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Submit with Soul ID
        </button>
      </div>

      {/* Routing Result */}
      {routingResult && (
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-semibold">Routing Result</h2>
          <p>Agent: {routingResult.routingDecision.selectedAgent.name}</p>
          <p>Complexity: {routingResult.routingDecision.complexityScore.d_var.toFixed(3)}</p>
          <p>Verified: {routingResult.verified ? '✅' : '❌'}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Security Best Practices

### Production Considerations

1. **Never store private keys in localStorage**
   - Use secure key storage (e.g., hardware wallets, secure enclaves)
   - Consider server-side key management

2. **Rotate encryption passwords regularly**
   - Use environment variables for sensitive credentials
   - Implement key rotation strategies

3. **Validate all signatures**
   - Always verify Soul ID signatures on the server
   - Never trust client-provided verification results

4. **Use HTTPS in production**
   - Encrypt WebSocket connections (wss://)
   - Enforce secure transport for all API calls

5. **Rate limit API endpoints**
   - Prevent abuse of routing and backup endpoints
   - Implement throttling for expensive operations

6. **Monitor Soul ID actions**
   - Regularly audit action logs
   - Set up alerts for suspicious patterns

7. **Encrypt backups**
   - Always use encryption for production backups
   - Store backup encryption keys securely

8. **Test backup restoration**
   - Regularly test backup/restore procedures
   - Maintain disaster recovery plans

---

## Next Steps

1. **Integrate with Nexus Chat** - Add Phase 27 features to chat interface
2. **Set up monitoring** - Track routing decisions and backup health
3. **Implement rate limiting** - Protect API endpoints
4. **Add analytics dashboard** - Visualize Soul ID and routing metrics
5. **Deploy WebSocket server** - Scale for production traffic

---

**Phase 27 Status**: ✅ **COMPLETE**

All core systems implemented and ready for integration!
