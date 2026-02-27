---
applyTo: '.copilot-tracking/changes/2026-02-26/plan-splitting-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Split Monolithic Mac Paint Plan into 6 Focused Plans

## Overview

Decompose the monolithic mac-paint-app-plan.instructions.md (8 phases, 54 steps) into 6 independent implementation plans following the A-prime Modified Priority Tier strategy identified in plan-splitting-strategy-research.md.

## Objectives

### User Requirements

* Split the monolithic plan into multiple focused plans — Source: User request ("determine how best to split up and create multiple plans")
* Be thorough — Source: User request ("Be thorough")
* Each plan must be independently implementable — Source: User expectation (Task Implementor workflow)

### Derived Objectives

* Follow the A-prime strategy (6 plans) recommended by research — Derived from: plan-splitting-strategy-research.md Section 4, scoring 3.65 weighted
* Each plan produces a testable artifact (runnable app state) — Derived from: Research success criteria
* No plan exceeds ~15 implementation steps — Derived from: Research constraint for manageable Task Implementor sessions
* Preserve all content from the monolithic plan and details files — Derived from: No information loss during split
* Each split plan gets its own plan, details, and log file — Derived from: Task Planner file conventions
* Archive the monolithic plan files after split — Derived from: Research Section 9, Implementation Guidance

## Context Summary

### Project Files

* `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` — Primary research: 4 strategies evaluated, A-prime selected, detailed 6-plan breakdown with file dependency analysis
* `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` — Monolithic plan to split (8 phases, 54 steps, 240 lines)
* `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` — Monolithic details to split (1492 lines)
* `.copilot-tracking/plans/logs/2026-02-26/mac-paint-app-log.md` — Existing log with 10 DRs, 3 DDs
* `.copilot-tracking/research/subagents/2026-02-26/file-dependency-analysis.md` — 41 files × 8 phases, hot file identification
* `.copilot-tracking/research/subagents/2026-02-26/splitting-strategy-analysis.md` — Strategy comparison and A-prime recommendation

### References

* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — Original feature research (170+ features, P0–P3 ranking)

### Standards References

* Task Planner mode instructions — Plan/details/log file structure and naming conventions

## Implementation Checklist

### [x] Implementation Phase 1: Create Plan 01 — Foundation and Canvas Engine

<!-- parallelizable: true -->

* [x] Step 1.1: Create `plan-01-foundation.instructions.md`
  * Extract monolithic plan Phase 1 (Steps 1.1–1.4) and Phase 2 Steps 2.1–2.2
  * 6 steps total, sequential execution
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 11-65)
* [x] Step 1.2: Create `plan-01-foundation-details.md`
  * Extract monolithic details Lines 10–260 (Phase 1 and Steps 2.1–2.2)
  * Preserve all code snippets, file lists, success criteria, and context references
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 67-90)
* [x] Step 1.3: Create `plan-01-foundation-log.md`
  * Seed with relevant DRs/DDs from monolithic log
  * Document that this plan has zero PaintEngine.ts conflict risk
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 92-110)

### [x] Implementation Phase 2: Create Plan 02 — P0 Core Drawing Tools

<!-- parallelizable: true -->

* [x] Step 2.1: Create `plan-02-drawing-tools.instructions.md`
  * Extract monolithic plan Steps 2.3–2.9 (7 steps)
  * Key: PaintEngine.ts is NOT modified — all tools are standalone files
  * Include FillTool.ts wrapper in Step 2.6 (addresses research gap)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 115-165)
* [x] Step 2.2: Create `plan-02-drawing-tools-details.md`
  * Extract monolithic details Lines 260–500 (Steps 2.3–2.9)
  * Preserve flood fill algorithm, color selection algorithm, undo manager implementation
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 167-190)
* [x] Step 2.3: Create `plan-02-drawing-tools-log.md`
  * Include DR-06 (Euclidean vs perceptual color distance)
  * Document cleanest plan boundary (zero hot-file modifications)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 192-210)

### [x] Implementation Phase 3: Create Plan 03 — P0 MVP UI, File I/O and Polish

<!-- parallelizable: true -->

* [x] Step 3.1: Create `plan-03-mvp-ui.instructions.md`
  * Extract monolithic plan Phase 3 (Steps 3.1–3.9, 9 steps)
  * Note: PaintEngine.ts modified 3× (zoom, file I/O, new doc) — all additive methods
  * Include DR-10 resolution (New Document dialog implemented as Step 3.6)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 215-265)
* [x] Step 3.2: Create `plan-03-mvp-ui-details.md`
  * Extract monolithic details Lines 500–730 (Phase 3)
  * Preserve IPC handler code, preload bridge, keyboard shortcut map, CSS layout
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 267-290)
* [x] Step 3.3: Create `plan-03-mvp-ui-log.md`
  * Include DR-10 (New Document — now addressed in this plan)
  * Document PaintEngine.ts modification risk as medium
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 292-310)

### [x] Implementation Phase 4: Create Plan 04 — P1 Features: Content and Canvas

<!-- parallelizable: true -->

* [x] Step 4.1: Create `plan-04-p1-features.instructions.md`
  * Extract monolithic plan Phases 4–5 (Steps 4.1–5.6, 11 steps)
  * Note: PaintEngine.ts modified 5× — heaviest modification load, all additive
  * Include DD-02 and DD-03 context (sequential execution required)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 315-370)
* [x] Step 4.2: Create `plan-04-p1-features-details.md`
  * Extract monolithic details Lines 730–1050 (Phases 4–5)
  * Preserve selection tool, eyedropper, text tool, clipboard IPC, resize, export, drag-drop, shapes, curves
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 372-395)
* [x] Step 4.3: Create `plan-04-p1-features-log.md`
  * Include DD-02, DD-03 (sequential P1 phases, shared PaintEngine.ts)
  * Include DR-04 (pen/Bézier path editing deferred), DR-08 (advanced selection deferred)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 397-420)

### [x] Implementation Phase 5: Create Plan 05 — P2 Power: Layers and Effects

<!-- parallelizable: true -->

* [x] Step 5.1: Create `plan-05-layers-power.instructions.md`
  * Extract monolithic plan Phase 6 (Steps 6.1–6.10, 10 steps)
  * Include architectural disruption warning: Step 6.1 changes drawing routing and undo state
  * Reference DrawingContext abstraction mitigation from research Section 8
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 425-480)
* [x] Step 5.2: Create `plan-05-layers-power-details.md`
  * Extract monolithic details Lines 1050–1300 (Phase 6)
  * Preserve layer architecture, lasso, gradient, brush presets, filters, transforms, transparency, dark mode, grid
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 482-510)
* [x] Step 5.3: Create `plan-05-layers-power-log.md`
  * Include DR-01 (native format deferred — layers now exist), DR-05 (non-destructive filters deferred)
  * Document critical PaintEngine.ts boundary risk (Step 6.1 is architecturally disruptive)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 512-535)

### [x] Implementation Phase 6: Create Plan 06 — P3 Advanced and Final Validation

<!-- parallelizable: true -->

* [x] Step 6.1: Create `plan-06-advanced.instructions.md`
  * Extract monolithic plan Phases 7–8 (Steps 7.1–8.4, 11 steps)
  * Note: Zero PaintEngine.ts modifications — cleanest plan
  * Include full validation suite (tsc, lint, make, E2E testing)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 540-595)
* [x] Step 6.2: Create `plan-06-advanced-details.md`
  * Extract monolithic details Lines 1300–1492 (Phases 7–8)
  * Preserve blend modes, pressure sensitivity, custom brush engine, curves/levels, symmetry, validation steps
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 597-620)
* [x] Step 6.3: Create `plan-06-advanced-log.md`
  * Include DR-03 (animation deferred), DR-07 (color management deferred), DR-09 (batch processing deferred)
  * Document cleanest boundary — zero hot-file modifications
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 622-645)

### [x] Implementation Phase 7: Archive and Cross-Reference Validation

<!-- parallelizable: false -->

* [x] Step 7.1: Archive monolithic plan files
  * Rename `mac-paint-app-plan.instructions.md` to `mac-paint-app-plan.instructions.md.archived`
  * Rename `mac-paint-app-details.md` to `mac-paint-app-details.md.archived`
  * Rename `mac-paint-app-log.md` to `mac-paint-app-log.md.archived`
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 650-670)
* [x] Step 7.2: Validate all cross-references
  * Verify each plan references correct details file line ranges
  * Verify each plan references correct predecessor plan as dependency
  * Verify each log references correct research items
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 672-695)
* [x] Step 7.3: Validate plan coverage
  * Confirm all 54 monolithic steps are covered across the 6 plans
  * Confirm no steps are duplicated
  * Confirm step counts match research recommendation (6, 7, 9, 11, 10, 11)
  * Details: .copilot-tracking/details/2026-02-26/plan-splitting-details.md (Lines 697-720)

## Planning Log

See [plan-splitting-log.md](../logs/2026-02-26/plan-splitting-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* Existing monolithic plan file: `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md`
* Existing monolithic details file: `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md`
* Existing monolithic log file: `.copilot-tracking/plans/logs/2026-02-26/mac-paint-app-log.md`
* Plan-splitting research: `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md`

## Success Criteria

* 6 plan files created at `.copilot-tracking/plans/2026-02-26/plan-0{1-6}-*.instructions.md` — Traces to: User requirement (multiple plans)
* 6 details files created at `.copilot-tracking/details/2026-02-26/plan-0{1-6}-*-details.md` — Traces to: Task Planner conventions
* 6 log files created at `.copilot-tracking/plans/logs/2026-02-26/plan-0{1-6}-*-log.md` — Traces to: Task Planner conventions
* All 54 original steps covered with no gaps or duplicates — Traces to: Derived objective (no information loss)
* Step counts per plan: 6, 7, 9, 11, 10, 11 — Traces to: Research A-prime recommendation
* Monolithic files archived — Traces to: Research Section 9
* Each plan has correct dependency chain (Plan N depends on Plan N-1) — Traces to: Research Section 6 dependency graph
