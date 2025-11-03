# Agent Integration API

## Overview
RESTful API for AI agents to control AGI-CAD Science Labs programmatically.

## Base URL
```
http://localhost:3001/api/labs/command
```

## Authentication
Currently: None (development mode)
Production: Will require API keys

---

## Endpoints

### POST /api/labs/command
Execute a command on a specific lab.

**Request Body:**
```json
{
  "lab": "plasma",
  "command": "heat",
  "params": {
    "flux": 2000
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "lab": "plasma",
  "command": "heat",
  "params": { "flux": 2000 },
  "result": {
    "success": true,
    "labId": "plasma",
    "command": "heat",
    "timestamp": 1762095209608
  },
  "state": {
    "T": 5432.15,
    "P": 101325,
    "I": 67.5,
    "H": 0.94,
    "He": 0.06,
    "timestamp": 1762095209708
  },
  "timestamp": 1762095209708
}
```

**Response (Error - Lab Not Found):**
```json
{
  "success": false,
  "error": "Lab 'plasma' not found",
  "availableLabs": []
}
```

**Response (Error - Missing Fields):**
```json
{
  "success": false,
  "error": "Missing required fields: lab and command are required",
  "example": {
    "lab": "plasma",
    "command": "heat",
    "params": { "flux": 2000 }
  }
}
```

---

### GET /api/labs/command
Get current state of lab(s).

**Get All Labs:**
```bash
GET /api/labs/command
```

**Response:**
```json
{
  "success": true,
  "registeredLabs": ["plasma", "spectral"],
  "labs": {
    "plasma": {
      "T": 5432.15,
      "P": 101325,
      "I": 67.5,
      "H": 0.94,
      "He": 0.06,
      "timestamp": 1762095209708
    },
    "spectral": {
      "temperature": 3500,
      "velocity": 0,
      "lines": [...],
      "timestamp": 1762095209708
    }
  },
  "timestamp": 1762095209708
}
```

**Get Specific Lab:**
```bash
GET /api/labs/command?lab=plasma
```

**Response:**
```json
{
  "success": true,
  "lab": "plasma",
  "state": {
    "T": 5432.15,
    "P": 101325,
    "I": 67.5,
    "H": 0.94,
    "He": 0.06,
    "timestamp": 1762095209708
  },
  "timestamp": 1762095209708
}
```

---

## Lab Commands

### Plasma Lab

**Lab ID:** `plasma`

**Commands:**
- `heat` - Heat the plasma
  - Params: `{ flux: number }` (default: 1500)
- `stop` - Stop heating
  - Params: none
- `vent` - Vent the chamber (decrease pressure)
  - Params: none
- `refill` - Refill fuel composition
  - Params: none

**Example:**
```bash
curl -X POST http://localhost:3001/api/labs/command \
  -H "Content-Type: application/json" \
  -d '{"lab":"plasma","command":"heat","params":{"flux":3000}}'
```

---

### Spectral Lab

**Lab ID:** `spectral`

**Commands:**
- `heat` - Heat the spectral source
  - Params: `{ temperature: number }` (default: 5000)
- `cool` - Cool down the source
  - Params: none
- `setVelocity` - Set Doppler velocity
  - Params: `{ velocity: number }` (m/s, positive = redshift)

**Example:**
```bash
curl -X POST http://localhost:3001/api/labs/command \
  -H "Content-Type: application/json" \
  -d '{"lab":"spectral","command":"setVelocity","params":{"velocity":1000}}'
```

---

## Natural Language Processing

The Agent Demo page (`/agent-demo`) includes a simple NLP parser for common commands:

**Supported Phrases:**
- "heat plasma" or "heat plasma to 5000" → `{ lab: "plasma", command: "heat", params: { flux: 500 } }`
- "cool plasma" → `{ lab: "plasma", command: "stop" }`
- "vent plasma" → `{ lab: "plasma", command: "vent" }`
- "refill plasma" → `{ lab: "plasma", command: "refill" }`
- "heat spectral" or "heat spectral to 6000" → `{ lab: "spectral", command: "heat", params: { temperature: 6000 } }`
- "cool spectral" → `{ lab: "spectral", command: "cool" }`
- "set velocity 500" → `{ lab: "spectral", command: "setVelocity", params: { velocity: 500 } }`

---

## Integration Examples

### Python (requests)
```python
import requests

# Heat plasma
response = requests.post(
    'http://localhost:3001/api/labs/command',
    json={
        'lab': 'plasma',
        'command': 'heat',
        'params': {'flux': 2000}
    }
)

print(response.json())

# Get plasma state
response = requests.get('http://localhost:3001/api/labs/command?lab=plasma')
print(response.json())
```

### JavaScript (fetch)
```javascript
// Heat plasma
const response = await fetch('http://localhost:3001/api/labs/command', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    lab: 'plasma',
    command: 'heat',
    params: { flux: 2000 }
  })
});

const data = await response.json();
console.log(data);

// Get plasma state
const stateResponse = await fetch('http://localhost:3001/api/labs/command?lab=plasma');
const stateData = await stateResponse.json();
console.log(stateData);
```

### cURL
```bash
# Heat plasma
curl -X POST http://localhost:3001/api/labs/command \
  -H "Content-Type: application/json" \
  -d '{"lab":"plasma","command":"heat","params":{"flux":2000}}'

# Get plasma state
curl http://localhost:3001/api/labs/command?lab=plasma

# Get all lab states
curl http://localhost:3001/api/labs/command
```

---

## Error Handling

**400 Bad Request:**
- Missing required fields (lab or command)

**404 Not Found:**
- Lab not registered
- Lab ID doesn't exist

**500 Internal Server Error:**
- Command execution failed
- Lab simulator error

All error responses include:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Lab Registration

Labs must register with the LabRouter when they mount:

```typescript
import { labRouter } from '@/lib/science-labs/LabRouter';

useEffect(() => {
  const simulator = new PlasmaSimulator();
  labRouter.registerLab('plasma', simulator);

  return () => {
    labRouter.unregisterLab('plasma');
  };
}, []);
```

---

## Rate Limiting

Currently: None
Production: 100 requests/minute per IP

---

## Webhooks (Coming Soon)

Future feature: Subscribe to lab state changes via webhooks.

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["state_change", "command_complete"],
  "labs": ["plasma", "spectral"]
}
```

---

## Testing

Visit `/agent-demo` to test commands via the web UI:
- http://localhost:3001/agent-demo

Or use the API routes directly:
- POST http://localhost:3001/api/labs/command
- GET http://localhost:3001/api/labs/command

---

## Architecture

```
┌──────────────┐
│  AI Agent    │
│ (GPT/Claude) │
└──────┬───────┘
       │ HTTP POST
       ▼
┌──────────────────┐
│   API Route      │
│ /api/labs/command│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Lab Router     │
│ (Orchestration)  │
└──────┬───────────┘
       │
       ├─────► Plasma Lab Simulator
       ├─────► Spectral Lab Simulator
       └─────► (Future Labs...)
```

---

## Status

- ✅ API endpoints functional
- ✅ Lab Router enhanced with async methods
- ✅ Error handling implemented
- ✅ Natural language demo page
- ⏳ Authentication (planned)
- ⏳ Rate limiting (planned)
- ⏳ Webhooks (planned)
- ⏳ GPT-4 integration (planned)
