# WebSocket and Redis Setup for Real-Time Sync in AGI-CAD

## 1. Architecture

This document outlines the architecture for real-time synchronization of task routing and agent status using WebSockets and Redis Pub/Sub.

```
+-----------------+      +-----------------+      +-----------------+
|  AGI-CAD Client |<---->|  WebSocket Server |<---->|  Redis Pub/Sub  |
+-----------------+      +-----------------+      +-----------------+
       ^
       |
       v
+-----------------+
|  Routing Engine |
+-----------------+
```

- **AGI-CAD Client**: The user interface that connects to the WebSocket server to receive real-time updates.
- **WebSocket Server**: Manages WebSocket connections and broadcasts messages from Redis to connected clients.
- **Redis Pub/Sub**: A messaging system that allows the routing engine to publish updates to multiple subscribers (i.e., WebSocket servers).
- **Routing Engine**: The FS-QMIX algorithm that makes routing decisions and publishes updates to Redis.

## 2. Redis Channel Structure

Redis channels are used to broadcast messages to different parts of the system.

- **`task:routing`**: This channel is used to broadcast routing decisions made by the FS-QMIX algorithm.
- **`agent:status`**: This channel is used to broadcast updates on the status of each agent (e.g., availability, current load).

## 3. WebSocket Message Protocol

WebSocket messages are sent in JSON format.

### Routing Decision Message

```json
{
  "type": "routing_decision",
  "payload": {
    "taskId": "...",
    "agent": {
      "name": "...",
      "strengths": ["..."],
      "cost": 0.0,
      "latency": 0.0
    },
    "timestamp": 1234567890
  }
}
```

### Agent Status Message

```json
{
  "type": "agent_status",
  "payload": {
    "name": "...",
    "status": "available" | "busy" | "offline",
    "load": 0.0
  }
}
```

## 4. Connection Lifecycle

1. The AGI-CAD client establishes a WebSocket connection to the WebSocket server.
2. The WebSocket server subscribes to the `task:routing` and `agent:status` Redis channels.
3. When the routing engine publishes a message to a Redis channel, the WebSocket server receives the message and broadcasts it to all connected clients.
4. The AGI-CAD client receives the WebSocket message and updates the UI accordingly.