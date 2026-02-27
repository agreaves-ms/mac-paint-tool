<!-- markdownlint-disable-file -->
# Planning Log: Split Monolithic Mac Paint Plan into 6 Focused Plans

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan. Validated 2026-02-26 by Plan Validator — 4 DRs and 2 DDs active.

### Unaddressed Research Items

* DR-01: DrawingContext abstraction timing not enforced in Plan 01
  * Source: plan-splitting-strategy-research.md (Lines 300–320) — Mitigation Recommendations
  * Reason: Research recommends implementing DrawingContext wrapper in Plan 1 Step 2.1, but this adds architectural complexity to the simplest plan; documented as follow-on in Plan 01 log instead
  * Impact: medium — if omitted, Plan 05 Step 6.1 (layers) will require refactoring all tool context references

* DR-02: Sub-manager extraction timing not enforced in Plan 03
  * Source: plan-splitting-strategy-research.md (Lines 310–320) — Sub-manager extraction recommendation
  * Reason: Research suggests extracting ZoomManager/FileManager during Plan 3 to reduce Plan 4–5 pressure; adds 1–2 steps but is optional
  * Impact: low — PaintEngine.ts grows but all additions are additive methods

* DR-03: Automated testing strategy not addressed in any plan
  * Source: plan-splitting-strategy-research.md (Lines 375–375) — Potential Next Research
  * Reason: Research identifies zero test files across all plans; all validation is manual
  * Impact: medium — no regression safety net between plans

* DR-04: Plan-to-details line references are approximate across all 21 steps
  * Source: Plan Validator analysis — offsets range 1–26 lines from actual section boundaries
  * Reason: Line numbers were estimated during plan creation; Step 7.2 (cross-reference validation) will correct them during implementation
  * Impact: low — section heading references are correct; line numbers will be fixed during Phase 7

* DR-04: Plan-to-details line references are inaccurate across all 21 checklist steps
  * Source: Cross-reference verification of plan-splitting-plan.instructions.md against plan-splitting-details.md section headings
  * Reason: Every `Details: ... (Lines X-Y)` reference in the plan checklist is offset from the actual section boundaries by 1–26 lines; offsets compound in later phases (e.g., Step 6.2 claims Lines 597–620, actual section is Lines 571–602)
  * Impact: low — Step 7.2 already includes cross-reference validation as a dedicated implementation step, and the Task Implementor can navigate by section headings; however, inaccurate references may cause initial confusion during implementation

### Plan Deviations from Research

* DD-01: Meta-plan creates files rather than implementing application code
  * Research recommends: 6 application implementation plans
  * Plan implements: A meta-plan whose "implementation" is creating 18 tracking files
  * Rationale: User requested "create multiple plans" — the deliverable is the planning files themselves, not application code

* DD-02: Archival uses `.archived` suffix instead of moving to subdirectory
  * Research recommends: Archive designation (Section 9)
  * Plan implements: `.archived` file suffix
  * Rationale: Simpler than creating archive subdirectory; files remain discoverable in same date folder

* DD-03: Plan 06 generated with local step numbering requiring post-creation correction
  * Plan specifies: Global step numbering (7.1-7.7, 8.1-8.4) consistent with monolithic plan
  * Implementation generated: Local step numbering (1.1-1.7, 2.1-2.4)
  * Rationale: Phase-implementor subagent used local phase numbering convention; corrected during Phase 7 cross-reference validation

## Implementation Paths Considered

### Selected: Strategy A-prime — Modified Priority Tier (6 Plans)

* Approach: Split P0 tier into 3 plans (foundation, tools, MVP), keep P1/P2/P3 as individual plans; 6 plans total with step counts 6, 7, 9, 11, 10, 11
* Rationale: Scored highest (3.65) across 5 weighted criteria; fixes Strategy A's 22-step Plan 1 problem; every plan produces a testable artifact
* Evidence: plan-splitting-strategy-research.md (Lines 93–115) — Scored comparison and Section 4 selection rationale

### IP-01: Strategy A — Pure Priority Tier (4 Plans)

* Approach: P0 as one plan (22 steps), P1 (11), P2 (10), P3 (11)
* Trade-offs: Natural P0–P3 alignment but Plan 1 (22 steps) far exceeds ~15 step target
* Rejection rationale: Plan 1 too large for a single Task Implementor session

### IP-02: Strategy C — Functional Milestone (5 Plans)

* Approach: Bootstrap+Engine (6), Tools+UI (16), P1 (11), P2 (10), P3 (11)
* Trade-offs: Clear milestones but Plan 2 (16 steps) still exceeds target
* Rejection rationale: Plan 2 slightly over limit; scored 3.35 vs A-prime's 3.65

### IP-03: Strategy B — Technical Concern (6 Plans)

* Approach: Scaffold (4), Engine (9), UI (9), Content (11), Layers (10), Advanced (11)
* Trade-offs: Well-balanced step counts but Engine plan has no UI — cannot test tools manually
* Rejection rationale: Two plans deliver no user-visible value; scored 2.65

### IP-04: Strategy D — Fine-Grained (8+ Plans)

* Approach: 10 tiny plans, some 1–3 steps
* Trade-offs: Small plans but 4 deliver no testable app state; excessive file maintenance overhead
* Rejection rationale: Not independently testable; scored 2.10

## Suggested Follow-On Work

Items identified during planning that fall outside current scope.

* WI-01: DrawingContext abstraction decision — Decide whether to add DrawingContext wrapper to Plan 01 Step 2.1 before implementation begins; affects Plan 05 layer integration complexity (high priority)
  * Source: plan-splitting-strategy-research.md Section 8
  * Dependency: Must decide before Plan 01 implementation starts

* WI-02: Automated test strategy — Research unit/integration test framework (Vitest, Playwright) and add test steps to each plan (medium priority)
  * Source: plan-splitting-strategy-research.md Section 9, Potential Next Research
  * Dependency: None — can be added to any plan

* WI-03: Sub-manager extraction evaluation — Assess whether extracting ZoomManager/FileManager from PaintEngine during Plan 03 is worthwhile given 1–2 additional steps (low priority)
  * Source: plan-splitting-strategy-research.md Section 8
  * Dependency: Plan 03 must not have started

* WI-04: app.ts wiring quantification — Count implicit app.ts modifications across all steps and ensure they are captured in each plan's file list (low priority)
  * Source: plan-splitting-strategy-research.md Section 9, Potential Next Research
  * Dependency: None
