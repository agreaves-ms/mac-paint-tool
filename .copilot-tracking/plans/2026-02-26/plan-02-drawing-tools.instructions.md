---
applyTo: '.copilot-tracking/changes/2026-02-26/plan-02-drawing-tools-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Plan 02 — P0 Core Drawing Tools

## Overview

Implement all P0 drawing tools as standalone files implementing the Tool interface from Plan 01. Each tool is a separate TypeScript file under `src/renderer/tools/` or `src/renderer/canvas/`. PaintEngine.ts is NOT modified — this is the cleanest plan boundary with zero hot-file modifications.

## Objectives

### User Requirements

* Paint Bucket with tolerance slider — Source: User feature request (paint bucket with tolerance)
* Color-tolerance selection with gradiance slider — Source: User feature request (color-tolerance selection with gradiance)
* Line size slider on ALL drawing/stroke tools — Source: User feature request (line size slider on all tools)

### Derived Objectives

* Standalone tool files with zero PaintEngine.ts modification — Derived from: plan-splitting-strategy-research.md Section 8, cleanest plan boundary
* Scanline queue-based flood fill with Euclidean color distance — Derived from: mac-paint-app-features-research.md (Lines 343-366), benchmarked as optimal algorithm
* Euclidean color distance for color-tolerance selection — Derived from: mac-paint-app-features-research.md (Lines 377-380), standard and sufficient per DR-06
* UndoManager with 50+ snapshot levels — Derived from: mac-paint-app-features-research.md (Lines 495-495)

## Context Summary

### Project Files

* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — Original feature research (170+ features, P0–P3 ranking)
* `.copilot-tracking/plans/2026-02-26/plan-splitting-plan.instructions.md` — Parent splitting plan
* `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` — Strategy research with Plan 02 breakdown (Lines 158–192)

### Predecessor

* Plan 01 — Foundation and Canvas Engine (must be complete before this plan executes)
* PaintEngine.ts and Tool interface must exist from Plan 01

## Implementation Checklist

### [x] Implementation Phase 1: P0 Drawing Tools

<!-- parallelizable: false -->

* [x] Step 2.3: Implement `BrushTool.ts` — freehand drawing with `quadraticCurveTo` smoothing, line size slider
  * Details: .copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md (Lines 13-47)
* [x] Step 2.4: Implement `EraserTool.ts` — `globalCompositeOperation: 'destination-out'`, line size slider
  * Details: .copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md (Lines 48-72)
* [x] Step 2.5: Implement `ShapeTool.ts` — line, rectangle, ellipse with stroke/fill toggle, line size slider
  * Details: .copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md (Lines 73-106)
* [x] Step 2.6: Implement `FloodFill.ts` and `FillTool.ts` — scanline queue-based flood fill with tolerance parameter, plus thin wrapper implementing Tool interface
  * Details: .copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md (Lines 107-176)
* [x] Step 2.7: Implement `ColorSelection.ts` — full-canvas pixel scan with Euclidean distance, gradiance slider, marching ants overlay
  * Details: .copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md (Lines 177-215)
* [x] Step 2.8: Implement `UndoManager.ts` — `ImageData` snapshot stack (50+ levels) with undo/redo
  * Details: .copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md (Lines 216-245)
* [x] Step 2.9: Validate Phase 2 — all P0 tools draw correctly
  * Details: .copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md (Lines 246-260)

## Planning Log

See [plan-02-drawing-tools-log.md](../logs/2026-02-26/plan-02-drawing-tools-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* Plan 01 completion — PaintEngine.ts and Tool interface must exist
* `src/renderer/tools/Tool.ts` — Tool interface definition (from Plan 01 Step 2.2)
* `src/renderer/canvas/PaintEngine.ts` — Canvas context provider (from Plan 01 Step 2.1)

## Success Criteria

* All P0 tools functional (BrushTool, EraserTool, ShapeTool, FillTool, ColorSelection, UndoManager) — Traces to: User requirements
* PaintEngine.ts unchanged by this plan — Traces to: plan-splitting-strategy-research.md cleanest boundary
* Flood fill works correctly with tolerance 0 (exact match), 32 (anti-alias edges), and 128 (liberal) — Traces to: User requirement (tolerance slider)
* Color selection with gradiance slider selects matching pixels with marching ants — Traces to: User requirement (gradiance slider)
* Undo/redo supports 50+ operations without corruption — Traces to: Derived objective
* All tools honor line size slider value — Traces to: User requirement (line size on all tools)
