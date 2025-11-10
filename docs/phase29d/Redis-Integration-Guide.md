# Redis Integration Guide

**Phase:** 29D
**Status:** ✅ Integration Complete
**Date:** November 9, 2025

---

## Overview

The Redis integration enables real-time task routing updates via WebSocket connections. When tasks are routed to agents, decisions are published to Redis Pub/Sub channels and forwarded to all connected clients.

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Task Router    │─────▶│  Redis Publisher │─────▶│  Redis Server   │
│  (Server-side)  │      │                  │      │  (Pub/Sub)      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                             │
                                                             ▼
                         ┌───────────────────────────────────────────┐
                         │         WebSocket Server                  │
                         │  (Subscribes to Redis channels)           │
                         └───────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
             ┌────────────┐         ┌────────────┐        ┌────────────┐
             │  Client 1  │         │  Client 2  │        │  Client N  │
             │ (Browser)  │         │ (Browser)  │        │ (Browser)  │
             └────────────┘         └────────────┘        └────────────┘
```

---

## Files Created

### 1. Redis Publisher (`src/lib/redis/publisher.ts`)
- **Functions:**
  - `publishRoutingDecision(decision)` - Publish routing decisions
  - `publishAgentStatus(agentId, name, status, load)` - Publish agent status
  - `disconnectPublisher()` - Graceful shutdown
  - `isRedisConnected()` - Check connection status

- **Features:**
  - Lazy connection initialization
  - Automatic retry with exponential backoff
  - Graceful fallback if Redis unavailable
  - Error handling and logging

### 2. TaskRouter Integration (`src/lib/routing/taskRouter.ts`)
- **Changes:**
  - Added `enableRedis` parameter to constructor
  - Integrated `publishRoutingDecision()` in `route()` method
  - Non-blocking Redis publish (continues on failure)

### 3. Test API Endpoint (`src/app/api/routing/test/route.ts`)
- **POST `/api/routing/test`** - Route a task and publish to Redis
  - Request: `{ "text": "Task description" }`
  - Response: Routing decision with selected agent

- **GET `/api/routing/test`** - Get routing statistics
  - Returns: Total routes, agent usage, recent decisions

---

## Setup Instructions

### 1. Install Redis

#### Windows (WSL2)
```bash
# Using WSL2 (recommended)
wsl --install
wsl

# Inside WSL
sudo apt update
sudo apt install redis-server
sudo service redis-server start

# Test
redis-cli ping  # Should return "PONG"
```

#### Windows (Native)
```bash
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use Chocolatey:
choco install redis-64
redis-server
```

#### macOS
```bash
brew install redis
brew services start redis

# Test
redis-cli ping  # Should return "PONG"
```

#### Linux
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server

# Test
redis-cli ping  # Should return "PONG"
```

#### Docker (All Platforms)
```bash
docker run -d -p 6379:6379 --name redis redis:latest

# Test
docker exec -it redis redis-cli ping  # Should return "PONG"
```

---

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and ensure these are set:

```bash
# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=              # Leave empty for local dev

# WebSocket Server
WEBSOCKET_PORT=3001
```

---

### 3. Start the Servers

#### Option 1: Start Both Servers
```bash
npm run dev
```
This starts both:
- Next.js dev server (localhost:3000)
- WebSocket server (localhost:3001)

#### Option 2: Start Separately
```bash
# Terminal 1: Next.js
npm run dev:next

# Terminal 2: WebSocket
npm run dev:ws
```

---

## Testing the Integration

### Test 1: Verify Redis Connection

```bash
# Check if Redis is running
redis-cli ping  # Should return "PONG"

# Monitor Redis pub/sub
redis-cli
> SUBSCRIBE task:routing
> SUBSCRIBE agent:status
```

Keep this terminal open to see published messages.

---

### Test 2: Route a Task via API

```bash
# Send a test task
curl -X POST http://localhost:3000/api/routing/test \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Implement a binary search algorithm in Python with type hints and comprehensive error handling"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "decision": {
    "id": "...",
    "taskId": "...",
    "selectedAgent": {
      "id": "gpt-4",
      "name": "GPT-4",
      "strengths": ["code", "reasoning"],
      "cost": 0.03,
      "latency": 2.5
    },
    "complexityScore": {
      "d_var": 0.652,
      "factors": {
        "length": 118,
        "punctuation": 2,
        "uniqueTokens": 13
      }
    },
    "reason": "High complexity (D_var=0.652): Routed to GPT-4 for advanced reasoning",
    "timestamp": "2025-11-09T..."
  }
}
```

**In Redis Monitor Terminal:**
```
1) "message"
2) "task:routing"
3) "{\"type\":\"routing_decision\",\"payload\":{...}}"
```

---

### Test 3: Get Routing Statistics

```bash
curl http://localhost:3000/api/routing/test
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "totalRoutes": 5,
    "agentUsage": {
      "claude": 2,
      "gpt-4": 2,
      "gemini": 1,
      "llama": 0,
      "mistral": 0
    },
    "recentDecisions": [...]
  }
}
```

---

### Test 4: WebSocket Client Connection

Create a test HTML file or use the browser console:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to WebSocket server');

  // Subscribe to routing decisions
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'task:routing'
  }));

  // Subscribe to agent status
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'agent:status'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

Then route a task via API and watch the browser console for real-time updates.

---

## Message Formats

### Routing Decision Message
Published to: `task:routing`

```json
{
  "type": "routing_decision",
  "payload": {
    "taskId": "uuid-here",
    "agent": {
      "name": "GPT-4",
      "id": "gpt-4",
      "strengths": ["code", "reasoning"],
      "cost": 0.03,
      "latency": 2.5
    },
    "complexityScore": {
      "d_var": 0.652,
      "factors": {
        "length": 118,
        "punctuation": 2,
        "uniqueTokens": 13
      }
    },
    "reason": "High complexity...",
    "timestamp": 1699564800000
  }
}
```

### Agent Status Message
Published to: `agent:status`

```json
{
  "type": "agent_status",
  "payload": {
    "agentId": "gpt-4",
    "name": "GPT-4",
    "status": "busy",
    "load": 0.65,
    "timestamp": 1699564800000
  }
}
```

---

## Troubleshooting

### Redis Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
1. Check if Redis is running: `redis-cli ping`
2. Start Redis: `redis-server` or `sudo service redis-server start`
3. Verify port: `redis-cli -p 6379 ping`

---

### WebSocket Connection Failed
```
Error: WebSocket connection failed
```

**Solution:**
1. Ensure WebSocket server is running: `npm run dev:ws`
2. Check port: `lsof -i :3001` (macOS/Linux) or `netstat -ano | findstr :3001` (Windows)
3. Check firewall settings

---

### No Messages in Redis Monitor
```
(Subscribed to channels but no messages appear)
```

**Solution:**
1. Verify Redis publisher is working: Check server logs for `[Redis Publisher] Published...`
2. Check channel names match: `task:routing` and `agent:status`
3. Test manually: `redis-cli PUBLISH task:routing "test"`

---

## Performance Considerations

### Connection Pooling
- Redis publisher uses a singleton connection
- Lazy initialization avoids startup overhead
- Automatic reconnection with exponential backoff

### Non-Blocking Publish
- Redis publish is non-blocking in TaskRouter
- Routing continues even if Redis fails
- Errors logged but don't affect routing decisions

### Message Size
- Routing decisions: ~500 bytes
- Agent status: ~200 bytes
- Minimal bandwidth impact

---

## Next Steps

1. ✅ **Complete** - Redis publisher utility
2. ✅ **Complete** - TaskRouter integration
3. ✅ **Complete** - Test API endpoint
4. 🔄 **Pending** - UI components for visualization (see Gemini offload package)
5. 🔄 **Pending** - Integration tests
6. 🔄 **Pending** - Production deployment configuration

---

## Related Documentation

- [WebSocket-Redis-Setup.md](./WebSocket-Redis-Setup.md) - Architecture overview
- [FS-QMIX-Architecture.md](./FS-QMIX-Architecture.md) - Routing algorithm details
- [Integration-Checklist.md](./Integration-Checklist.md) - Integration checklist

---

**Status:** ✅ Redis integration complete and ready for testing
**Next:** Install Redis locally and test the full flow

**Time Spent:** ~45 minutes
**Remaining Session 1:** ~15 minutes (review and documentation)
