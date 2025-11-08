# GPT CODE SMASH PROTOCOL — NOV 8, 2025
**Session:** All-Day Build  
**Focus:** Phase 25 Week 1 Tasks  
**Goal:** Complete WebGPU adaptive workgroups + LearningCore optimization

---

## SESSION BRIEF

**Reality Check:**
- Most of your 20-thread discussions were theoretical (not built)
- Actual codebase has 7 operational systems
- Current focus: WebGPU + LearningCore (Nov 7-8 commits)
- Phase: 25 (Production Hardening)

**Today's Mission:**
- **Task 1:** Complete WebGPU adaptive workgroups (4-6 hours)
- **Task 2:** Optimize LearningCore Firestore sync (2-3 hours)
- **Task 3:** Clean up and commit (30 min)

---

## TASK 1: WEBGPU ADAPTIVE WORKGROUPS

### Current State
**File:** `src/components/neuroevolution/WebGPUFullPath.tsx`  
**Status:** 85% complete (adaptive logic partially logged to console)  
**Branch:** `v29d-governor-integration`

**Recent commits (Nov 7-8):**
- 16f→8-bit fallback working
- Vector field visualization operational
- WS texture streaming implemented
- FPS + WG/s overlay added
- Resolution + Vector Cells controls with persistence

### What's Missing
1. Full adaptive workgroup implementation
2. Overlay update to show actual workgroup dimensions
3. Testing across different GPU types
4. UI for workgroup tuning (manual override)

---

### Subtask 1.1: Implement Adaptive Workgroup Logic

**Goal:** Dynamically adjust workgroup sizes based on complexity

**Logic:**
```typescript
// Pseudo-code for adaptive workgroup sizing
function computeOptimalWorkgroupSize(
  densityThreshold: number,
  gradientComplexity: number,
  gpuCapabilities: GPUCapabilities
): [number, number] {
  // Start with default
  let workgroupX = 8;
  let workgroupY = 8;
  
  // Adjust based on density
  if (densityThreshold > 0.8) {
    workgroupX = 16;
    workgroupY = 16;
  } else if (densityThreshold < 0.3) {
    workgroupX = 4;
    workgroupY = 4;
  }
  
  // Adjust based on gradient complexity
  if (gradientComplexity > 0.7) {
    // More complex gradients need smaller workgroups
    workgroupX = Math.max(4, workgroupX / 2);
    workgroupY = Math.max(4, workgroupY / 2);
  }
  
  // Respect GPU limits
  const maxWorkgroupSize = gpuCapabilities.maxComputeWorkgroupSize;
  workgroupX = Math.min(workgroupX, maxWorkgroupSize[0]);
  workgroupY = Math.min(workgroupY, maxWorkgroupSize[1]);
  
  return [workgroupX, workgroupY];
}
```

**Implementation Steps:**
1. Add `computeOptimalWorkgroupSize` function to `WebGPUFullPath.tsx`
2. Call it before each compute dispatch
3. Update pipeline with new workgroup dimensions
4. Log to console for debugging: `console.log('[WebGPU] Using workgroup:', workgroupX, 'x', workgroupY)`

**Testing:**
- Low density (0.2) → Should use 4x4 or 8x8
- High density (0.9) → Should use 16x16
- Complex gradient → Should reduce workgroup size

---

### Subtask 1.2: Update Overlay with Workgroup Info

**Goal:** Show actual workgroup dimensions in overlay

**Current Overlay:**
```
FPS: 60
WG/s: 1200
```

**Target Overlay:**
```
FPS: 60
WG: 8x8 (16f)
WG/s: 1200
```

**Implementation:**
1. Track current workgroup size in state: `const [workgroupSize, setWorkgroupSize] = useState([8, 8])`
2. Update overlay JSX:
```tsx
<div className="performance-overlay">
  <div>FPS: {fps.toFixed(0)}</div>
  <div>WG: {workgroupSize[0]}x{workgroupSize[1]} ({computeMode})</div>
  <div>WG/s: {wgPerSecond.toFixed(0)}</div>
</div>
```
3. Update state when workgroup size changes

---

### Subtask 1.3: Add Workgroup Tuning UI

**Goal:** Allow manual override for debugging

**UI Controls (add to TaskSpace3D.tsx):**
```tsx
<div className="workgroup-controls">
  <label>
    Workgroup Mode:
    <select value={workgroupMode} onChange={(e) => setWorkgroupMode(e.target.value)}>
      <option value="auto">Auto (Adaptive)</option>
      <option value="4">4x4 (Low)</option>
      <option value="8">8x8 (Medium)</option>
      <option value="16">16x16 (High)</option>
    </select>
  </label>
</div>
```

**Implementation:**
1. Add workgroupMode state to TaskSpace3D.tsx
2. Pass to WebGPUFullPath as prop
3. If mode !== 'auto', use fixed size
4. Persist mode in localStorage

**Testing:**
- Switch between Auto/4/8/16
- Verify overlay updates
- Verify performance changes

---

### Subtask 1.4: Test Across GPUs

**Test on:**
1. **Integrated GPU** (if available)
   - Expect: 8-bit fallback
   - Workgroups: 4x4 or 8x8
   
2. **Dedicated GPU** (if available)
   - Expect: 16f mode
   - Workgroups: 8x8 or 16x16

**Document:**
- GPU model
- Compute mode (16f vs 8-bit)
- Workgroup sizes used
- FPS achieved

---

## TASK 2: LEARNINGCORE FIRESTORE OPTIMIZATION

### Current State
**Files:**
- `src/lib/learning/learningCore.ts`
- `src/app/api/learning/ingest/route.ts`

**Status:** 95% complete (individual writes working)

### What's Missing
1. Batch write optimization
2. Retry logic with exponential backoff
3. Telemetry for Firestore operations
4. Integration tests

---

### Subtask 2.1: Implement Batch Writes

**Goal:** Reduce Firestore costs by 80-90%

**Current (Inefficient):**
```typescript
// Writing one at a time
for (const data of dataPoints) {
  await db.collection('experiments').add(data);
}
```

**Target (Efficient):**
```typescript
// Batch writes (up to 500 per batch)
const batch = db.batch();
dataPoints.forEach((data, index) => {
  const docRef = db.collection('experiments').doc();
  batch.set(docRef, data);
  
  // Firestore limit: 500 writes per batch
  if ((index + 1) % 500 === 0 || index === dataPoints.length - 1) {
    await batch.commit();
    batch = db.batch(); // Start new batch
  }
});
```

**Implementation:**
1. Update `src/app/api/learning/ingest/route.ts`
2. Group data points into batches of 500
3. Commit each batch
4. Log batch statistics: `console.log('[Firestore] Committed batch:', batchSize, 'writes in', duration, 'ms')`

**Testing:**
- Test with 100 data points (1 batch)
- Test with 1000 data points (2 batches)
- Test with 1500 data points (3 batches)
- Verify all data saved correctly

---

### Subtask 2.2: Add Retry Logic

**Goal:** Handle transient Firestore errors

**Implementation:**
```typescript
async function batchWriteWithRetry(
  batch: WriteBatch,
  maxRetries: number = 3
): Promise<void> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await batch.commit();
      return; // Success
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        console.error('[Firestore] Max retries exceeded:', error);
        throw error; // Give up
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
      console.warn(`[Firestore] Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Testing:**
- Mock Firestore error
- Verify retry attempts
- Verify exponential backoff timing
- Verify final error thrown after max retries

---

### Subtask 2.3: Add Telemetry

**Goal:** Track Firestore operation metrics

**Metrics to Track:**
- Write latency (p50, p95, p99)
- Batch sizes
- Error rates
- Retry attempts

**Implementation:**
```typescript
// In learningCore.ts
interface FirestoreTelemetry {
  writesTotal: number;
  writesSucceeded: number;
  writesFailed: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
}

function updateTelemetry(
  duration: number,
  success: boolean
): void {
  // Update running statistics
  // Expose via getTelemetry() function
}
```

**Display in UI:**
- Add telemetry section to LearningPanel
- Show: Write rate, latency, error rate
- Alert if error rate > 5%

---

### Subtask 2.4: Write Integration Tests

**Goal:** Ensure Firestore operations work correctly

**Test Cases:**
```typescript
describe('LearningCore Firestore', () => {
  it('should batch write 100 data points', async () => {
    // Test implementation
  });

  it('should retry on transient errors', async () => {
    // Mock Firestore error
    // Verify retry attempts
  });

  it('should handle batch overflow (>500 items)', async () => {
    // Test with 1500 data points
    // Verify 3 batches committed
  });

  it('should update telemetry correctly', async () => {
    // Write data
    // Check telemetry metrics
  });
});
```

**Run tests:**
```bash
npm test -- src/lib/learning
```

---

## TASK 3: CLEAN UP & COMMIT

### Cleanup
1. **Delete untracked files:**
   ```powershell
   rm temp_webgpu.txt
   ```

2. **Check for console.log statements:**
   - Keep diagnostic logs (with `[WebGPU]` or `[Firestore]` prefix)
   - Remove debugging logs

3. **Run type check:**
   ```bash
   pnpm tsc --noEmit
   ```

4. **Format code:**
   ```bash
   pnpm format
   ```

---

### Commit Strategy

**Commit 1: WebGPU adaptive workgroups**
```bash
git add src/components/neuroevolution/WebGPUFullPath.tsx
git add src/components/neuroevolution/TaskSpace3D.tsx

git commit -m "feat(WebGPU): complete adaptive workgroups with overlay [Phase 25]

- Implement dynamic workgroup sizing based on density + gradient complexity
- Update overlay to show actual workgroup dimensions (e.g., '8x8')
- Add workgroup tuning UI (Auto/4/8/16)
- Test on integrated + dedicated GPUs
- Document performance characteristics"
```

**Commit 2: LearningCore optimization**
```bash
git add src/lib/learning/
git add src/app/api/learning/ingest/route.ts
git add src/components/learning/LearningPanel.tsx

git commit -m "feat(LearningCore): optimize Firestore batch writes + retry logic [Phase 25]

- Implement batch writes (up to 500 per batch)
- Add retry logic with exponential backoff (3 attempts)
- Add telemetry tracking (write rate, latency, error rate)
- Write integration tests for Firestore operations
- Display telemetry in LearningPanel UI"
```

**Push:**
```bash
git push origin v29d-governor-integration
```

---

## CODE QUALITY STANDARDS

### TypeScript
- ✅ Explicit types (no `any`)
- ✅ Interfaces for complex objects
- ✅ JSDoc comments for public functions
- ✅ No TypeScript errors (`pnpm tsc --noEmit`)

### React
- ✅ Typed props with interfaces
- ✅ Proper hooks usage
- ✅ Error boundaries
- ✅ Clean component structure

### Testing
- ✅ Unit tests for pure functions
- ✅ Integration tests for Firebase
- ✅ Mock external dependencies
- ✅ 95%+ coverage target

---

## COMMUNICATION PROTOCOL

### Progress Updates (Every 2 Hours)
**Format:**
```
[TIME] Progress Update

Completed:
- [Task/subtask name] ✅

In Progress:
- [Current task] (X% done)

Blockers:
- [Any blockers or questions]

Next:
- [Next task]

ETA: [Estimated time to completion]
```

**Example:**
```
[2:00 PM] Progress Update

Completed:
- Adaptive workgroup logic ✅
- Overlay update ✅

In Progress:
- Workgroup tuning UI (60% done)

Blockers:
- None

Next:
- GPU testing
- LearningCore batch writes

ETA: 3 hours remaining
```

---

## ERROR HANDLING

### Build Fails
1. Run `pnpm tsc --noEmit`
2. Fix type errors one by one
3. Don't use `@ts-ignore` (fix the root cause)

### Tests Fail
1. Read error message carefully
2. Fix root cause (not just test)
3. Verify fix doesn't break other tests

### Performance Issues
1. Use browser DevTools profiler
2. Identify bottleneck
3. Optimize critical path
4. Document tradeoffs

---

## SESSION GOALS

### Minimum (Must Complete)
- ✅ Adaptive workgroup logic implemented
- ✅ Overlay updated with workgroup info
- ✅ Firestore batch writes working
- ✅ Code committed and pushed

### Target (Ideal)
- ✅ Everything in Minimum
- ✅ Workgroup tuning UI complete
- ✅ Retry logic implemented
- ✅ Telemetry tracking added
- ✅ Integration tests written

### Stretch (If Time Permits)
- ✅ Everything in Target
- ✅ GPU testing documented
- ✅ Performance benchmarks recorded
- ✅ Documentation updated

---

## END-OF-DAY DELIVERABLES

**Files Modified:**
1. `src/components/neuroevolution/WebGPUFullPath.tsx`
2. `src/components/neuroevolution/TaskSpace3D.tsx`
3. `src/lib/learning/learningCore.ts`
4. `src/app/api/learning/ingest/route.ts`
5. `src/components/learning/LearningPanel.tsx`

**Git Status:**
- All changes committed
- Pushed to remote
- No untracked files (except intentional)

**Documentation:**
- Add comments to complex logic
- Update inline docs if APIs changed

**Testing:**
- All tests pass
- No TypeScript errors
- Manual testing complete

---

## SUCCESS CRITERIA

**WebGPU:**
- ✅ Adaptive workgroups functional
- ✅ Overlay shows accurate info
- ✅ 60 FPS maintained
- ✅ Tested on 2+ GPU types

**LearningCore:**
- ✅ Batch writes implemented
- ✅ <100ms write latency (p95)
- ✅ Retry logic tested
- ✅ Telemetry visible in UI

**Quality:**
- ✅ No TypeScript errors
- ✅ All tests pass
- ✅ Code formatted
- ✅ Clean git history

---

**END OF PROTOCOL — LET'S BUILD** 🚀

**First Task:** Adaptive workgroup logic in WebGPUFullPath.tsx  
**Time Budget:** 4-6 hours  
**Start Time:** [Record when you begin]
