# Operator Manual � Phase 24A

This document captures the current operator commands, agent registry, and the latest smoke output.

## Commands

- Run Mission Control (Next.js dev):
  - pnpm dev
- Run Drift Publisher (WebSocket + optional Redis):
  - 
ode vault/publisher.js
- Smoke test 4 core agents:
  - pnpm smoke
- Single agent tests:
  - pnpm run test:math
  - pnpm run test:sim

## Intelligence Router

File: src/core/router/IntelligenceRouter.ts

Registered agents and methods:
- echo ? EchoArchivistAgent.deepScan(payload)
- fractal ? FractalwrightAgent.monitor(payload)
- math ? MathwrightAgent.verify(payload)
- sim ? SimwrightAgent.buildPrototype(payload)

## Latest Smoke Output

`
--- AGI-CAD Smoke Runner ---
[EchoArchivist] Running deep scan in auto mode...
[EchoArchivist] Deep scan complete.

EchoArchivist ? {"success":true,"mode":"auto","timestamp":"2025-11-07T11:58:24.977Z","index":{"ai_learning":["FS-QMIX","Canon-Vault Reconciliation Agent"],"simulations":["Plasma Lab","Spectral Lab"]},"novelty":"high","symbol":"IP.SCAN.MOCK"}
[Fractalwright] Monitoring embedding of length 16...
[Fractalwright] Analysis complete.

Fractalwright ? {"success":true,"dimension":1.6344498438940405,"d_var":3.3097278264358105,"lacunarity":0.2554126187366448,"alert":"high_chaos"}
[Mathwright] Verifying equation "1+1=2" of kind "algebra"...

Mathwright ? {"success":true,"valid":true,"note":"Verified trivial identity."}
[Simwright] Building prototype for plasma_lab:stability_check...

Simwright ? {"success":true,"status":"prototype_mock_edge","files":["mock://plasma_lab_stability_check_1762516704979.stub"]}

Smoke Runner Complete

`

## Agent Functions

- EchoArchivistAgent
  - deepScan({ mode }) ? mock deep-scan summary and index
- FractalwrightAgent
  - monitor({ embedding:number[] }) ? d_var, lacunarity, stability alert
- MathwrightAgent
  - verify({ equation, kind }) ? symbolic verification status
- SimwrightAgent
  - buildPrototype({ type, target }) ? mock prototype artifact list

---
This manual will evolve with the Mission Control pipeline (Phase 24+).
