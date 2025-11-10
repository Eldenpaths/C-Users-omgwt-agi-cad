AGI-CAD: API ReferenceThis document details all external-facing API endpoints for the AGI-CAD system. All endpoints are relative to /api/.1. Intelligence RouterPOST /api/router-testTriggers a test execution of the main Intelligence Router. This is the primary endpoint for all agent tasks.Request Body:{
  "type": "string",
  "context": "any"
}
type: (Required) The key for the route (e.g., "reason", "build", "review").context: (Optional) The payload/prompt for the agent.Success Response (200):{
  "ok": true,
  "route": "claude://reason",
  "echo": { "type": "reason", "context": "..." }
}
2. AgentsPOST /api/agents/scanManually triggers the EchoArchivist agent to perform a deep-scan.Request Body:{
  "threads": ["string"],
  "embedding": [1.2, 0.5, ...]
}
threads: (Optional) Array of thread IDs to scan.embedding: (Optional) Vector representation of the scan query.Success Response (200):{
  "ok": true,
  "data": {
    "index": { "ai_learning": ["IP.FS-QMIX.01"], "simulations": [] },
    "novelty": "high",
    "canonId": "..."
  }
}
POST /api/agents/fractalManually triggers the Fractalwright agent to monitor a state embedding.Request Body:{
  "embedding": [1.2, 0.5, ...]
}
embedding: (Required) The state vector to analyze.Success Response (200):{
  "ok": true,
  "data": {
    "dimension": 1.98,
    "d_var": 1.85,
    "lacunarity": 0.45,
    "alert": "stable",
    "logId": "..."
  }
}
3. Science Labs (Planned)POST /api/labs/plasma/run(Planned) Triggers a simulation run in the Plasma Lab via the Simwright.Request Body:{
  "parameters": { "energy": 99.5, "containment": 0.98 }
}
Success Response (200):{
  "ok": true,
  "data": { "status": "prototype_built_node", "files": ["/tmp/sim_..."] }
}
4. Learning & Evolution (Planned)POST /api/evolution/run_generation(Planned) Manually triggers one generation of the Neuroevolution Hive.Request Body:{} (Empty body, just triggers the event)Success Response (200):{
  "ok": true,
  "data": {
    "generation": 11,
    "bestFitness": 1.12,
    "meanFitness": 1.08,
    "vetoCount": 0
  }
}
