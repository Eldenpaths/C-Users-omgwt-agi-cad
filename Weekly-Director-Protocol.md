# WEEKLY DIRECTOR PROTOCOL — CLAUDE & RYAN
**Role:** Claude as Director, Ryan as Lead Developer  
**Cadence:** Weekly check-ins (Fridays preferred)  
**Duration:** 30-60 minutes per session  
**Format:** Structured status review + strategic guidance

---

## CLAUDE'S DIRECTOR ROLE

**What I Do:**
- ✅ Maintain big-picture vision across all projects
- ✅ Track phase progression and milestones
- ✅ Identify drift between plan and reality
- ✅ Reconcile work across multiple AI models
- ✅ Strategic decisions (architecture, priorities, IP)
- ✅ Weekly audits and course corrections

**What I Don't Do:**
- ❌ Daily code review (that's GPT's job)
- ❌ Micromanage implementation details
- ❌ Write production code (I guide architecture)
- ❌ Replace other AI models (I orchestrate them)

---

## WEEKLY CHECK-IN FORMAT

### Part 1: Status Report (10 minutes)

**Ryan provides:**
1. **Completed This Week**
   - Systems finished
   - Milestones hit
   - Commits pushed

2. **In Progress**
   - Current focus
   - Estimated completion
   - Any blockers

3. **Discovered Issues**
   - Bugs found
   - Performance problems
   - Architectural concerns

4. **Drift Check**
   - What GPT claimed vs what exists
   - Theory vs reality gaps
   - Documentation lag

**Template:**
```markdown
## WEEKLY STATUS — [DATE]

### Completed ✅
- [System/feature name] - [Brief description]
- [Commits: X] - [Files changed: Y]

### In Progress 🔵
- [Current focus] - [X% complete]
- [ETA: Date]
- [Blockers: None / Description]

### Issues 🔴
- [Issue description] - [Severity: Critical/High/Medium/Low]

### Drift Check ⚠️
- [Theory vs reality gaps]
- [GPT claims vs actual code]
```

---

### Part 2: Strategic Review (20 minutes)

**Claude analyzes:**
1. **Phase Status**
   - Are we on track for current phase?
   - Should we adjust timeline?
   - Ready to move to next phase?

2. **System Integration**
   - Are new systems connecting properly?
   - Any integration debt building up?
   - Dependencies blocking progress?

3. **Innovation Assessment**
   - What's genuinely novel this week?
   - Patent opportunities discovered?
   - Market differentiators strengthened?

4. **Resource Allocation**
   - Is GPT working on right things?
   - Should we delegate to Gemini/Grok?
   - Any tool gaps (missing AI models)?

---

### Part 3: Next Week Planning (10 minutes)

**Claude recommends:**
1. **Priorities** (Top 3 tasks for next week)
2. **AI Model Assignments** (Who does what)
3. **Success Criteria** (How we measure progress)
4. **Risk Mitigation** (What could go wrong)

**Template:**
```markdown
## NEXT WEEK PLAN — [DATE RANGE]

### Priority 1: [Task Name]
- Owner: GPT / GPT Code
- Time: X hours
- Success: [Specific outcome]

### Priority 2: [Task Name]
- Owner: GPT / Gemini / Grok
- Time: X hours
- Success: [Specific outcome]

### Priority 3: [Task Name]
- Owner: GPT / Claude
- Time: X hours
- Success: [Specific outcome]

### Risks
- [Risk description] - Mitigation: [Plan]
```

---

### Part 4: Strategic Decisions (10-20 minutes, as needed)

**Topics that require Claude:**
- Major architectural changes
- Phase progression decisions
- IP protection strategy
- Market positioning
- Investor preparation
- Cross-project coordination

**Decision Framework:**
1. Discuss options
2. Weigh tradeoffs
3. Make decision
4. Document rationale
5. Assign owner
6. Set deadline

---

## BETWEEN CHECK-INS

### Ryan's Autonomy
**You operate independently on:**
- Daily coding with GPT/GPT Code
- Implementation details
- Bug fixes
- UI polish
- Performance optimization
- Testing

**No permission needed for:**
- Routine development work
- Following established protocols
- Staying within current phase scope

---

### When to Escalate to Claude

**Immediate escalation (don't wait for weekly):**
- 🚨 Critical blocker (can't proceed)
- 🚨 Major architectural issue discovered
- 🚨 Security vulnerability found
- 🚨 Drift accumulation (theory >> reality)
- 🚨 Resource constraint (need different AI model)

**Examples:**
- "WebGPU requires complete rewrite" → Escalate
- "Function needs refactoring" → Handle with GPT
- "GPT built 10 systems that don't exist" → Escalate
- "Minor bug in UI" → Handle with GPT

---

### Mid-Week Check-In (Optional)

**If needed, quick async update:**
```markdown
@Claude - Mid-week update:

Quick status:
- [Major milestone hit or major blocker]

Need guidance on:
- [Specific decision needed]

Otherwise proceeding with plan.
```

**Claude responds within 24 hours with:**
- Guidance on decision
- Course correction if needed
- Confirmation to proceed

---

## CROSS-PROJECT COORDINATION

### When Working on Multiple Projects

**Ryan's projects:**
- AGI-CAD (primary focus)
- PAC Fire
- Cosmoshabby
- CookedByBots
- SwapAI / BarterCoin
- Elden Engine

**Claude tracks:**
- Which project is active this week
- Cross-project dependencies
- Shared innovations (e.g., FS-QMIX across projects)
- Resource allocation across projects

**Protocol for project switches:**
1. Announce: "Switching to [Project] for [Duration]"
2. Claude acknowledges and loads project context
3. Work proceeds
4. Weekly check-in includes all active projects

---

## PROJECT ANALYSIS TEMPLATE (For Future Use)

**When starting work on a new project:**

**Step 1: Upload Project Materials**
- Screenshots of GPT/Grok conversations
- Any existing documentation
- Code samples (if available)
- Design mockups

**Step 2: Claude Analyzes**
- What's been built vs discussed
- Innovation assessment
- Drift detection
- Integration opportunities with other projects

**Step 3: Claude Delivers**
- Real Systems Inventory (like AGI-CAD)
- Phase plan (like Phase 25)
- Build protocol (like GPT Code Smash)
- Strategic recommendations

**Example for Elden Paths:**
```
Upload:
- Elden Paths GPT conversation screenshots
- World-building documents
- Any prototype code

Claude creates:
- Elden-Paths-Real-Systems-Inventory.md
- Elden-Paths-Phase-X-Plan.md
- Elden-Paths-Build-Protocol.md
```

---

## DOCUMENTATION STANDARDS

### Claude Maintains
- ✅ Phase progression tracking
- ✅ System inventories (what's real vs theory)
- ✅ Strategic roadmaps
- ✅ Cross-project insights
- ✅ Innovation cataloging
- ✅ IP protection recommendations

### Ryan Maintains (with GPT)
- ✅ Code documentation
- ✅ API docs
- ✅ Commit messages
- ✅ Test documentation
- ✅ Deployment notes

---

## COMMUNICATION STYLE

### From Ryan to Claude
**Good:**
- Direct, military-style brevity
- Specific questions
- Status-first, context-second
- "Here's the situation, what's the move?"

**Example:**
```
Status: WebGPU complete. LearningCore 80% done. Blocker: Firestore batch writes timing out.

Question: Should I finish LearningCore or move to Nexus polish?

ETA: 4 hours to finish LearningCore, 2 days for Nexus.
```

**Avoid:**
- Lengthy explanations without questions
- Vague updates ("working on stuff")
- Asking permission for routine decisions

---

### From Claude to Ryan
**Good:**
- Actionable recommendations
- Clear priorities
- Specific success criteria
- No fluff, just decisions

**Example:**
```
Decision: Finish LearningCore first.

Rationale: Firestore integration is critical for demo. Nexus polish can wait.

Action: Debug timeout issue (likely batch size). Test with smaller batches (100 vs 500).

ETA: Should unblock within 2 hours. If not, escalate.

Next: After LearningCore, start Nexus polish (Week 2 priority).
```

**Avoid:**
- Long explanations of obvious things
- Philosophical discussions without actions
- Hedging ("maybe", "possibly", "might")

---

## SUCCESS METRICS

### Weekly Check-In Quality
- ✅ Clear priorities for next week
- ✅ Drift identified and addressed
- ✅ Strategic decisions made
- ✅ No surprises in status report

### Overall Partnership
- ✅ AGI-CAD progressing on schedule
- ✅ Theory vs reality gap minimized
- ✅ Multi-AI coordination smooth
- ✅ Innovation captured and cataloged
- ✅ Investor materials ready on time

---

## FIRST WEEKLY CHECK-IN

**Schedule:** Friday, Nov 15, 2025

**Agenda:**
1. Review Phase 25 Week 1 progress
2. Assess WebGPU + LearningCore completion
3. Plan Week 2 tasks (Nexus polish, testing)
4. Identify any drift or blockers

**Preparation:**
- Ryan: Complete Week 1 tasks (or document why not)
- Ryan: Fill out Status Report template
- Claude: Review commits, analyze progress

---

## EMERGENCY PROTOCOL

**Critical Blocker:**
```
@Claude - CRITICAL BLOCKER

Issue: [Description]
Impact: [What's blocked]
Attempts: [What you've tried]
Need: [What decision/guidance needed]

Status: HALTED / DEGRADED / AT RISK
```

**Claude responds within 4 hours with:**
- Immediate guidance
- Alternative approaches
- Decision on proceeding
- Resource reallocation if needed

---

## LONG-TERM VISION

### Phase Milestones
- **Phase 25:** Production hardening (current)
- **Phase 26:** Feature expansion
- **Phase 27:** Scale & performance
- **Phase 28:** Commercialization
- **Phase 29:** Multi-project coordination
- **Phase 30:** Ecosystem building

### Claude's Role Evolution
- **Now:** Weekly director, strategic guidance
- **Phase 26+:** Cross-project orchestration
- **Phase 28+:** Investor/market strategy
- **Phase 30+:** Ecosystem architecture

---

## PROTOCOL VERSION CONTROL

**V1.0 (Current):** Nov 8, 2025
- Initial protocol
- Weekly check-ins established
- Director role defined

**Future Updates:**
- Add sections as needed
- Refine based on what works
- Version in git with docs

---

## TOOLS FOR CHECK-INS

### Required
- Real-Systems-Inventory.md (current state)
- Phase-X-Plan.md (current plan)
- Git commit history (actual work)

### Optional
- Screenshots (for complex issues)
- Performance metrics (when relevant)
- GPT conversation summaries (if drift suspected)

---

## FINAL NOTES

**This is YOUR protocol.**

Modify as needed. If weekly is too frequent, we can adjust. If you need more Claude time, say so. If GPT needs better guidance, tell me.

The goal: Keep you building efficiently, minimize drift, maximize innovation capture.

**You're the builder. I'm the architect. GPT is the construction crew.**

---

**END OF WEEKLY DIRECTOR PROTOCOL**

**First Check-In:** Friday, Nov 15, 2025  
**Next Update:** As needed based on experience

