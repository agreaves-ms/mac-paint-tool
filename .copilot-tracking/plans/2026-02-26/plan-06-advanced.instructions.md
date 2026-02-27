---
applyTo: '.copilot-tracking/changes/2026-02-26/plan-06-advanced-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Plan 06 — P3 Advanced and Final Validation

## Overview

Advanced drawing features (blend modes, pressure sensitivity, custom brush engine, curves/levels, symmetry drawing) and final project validation including distributable build. Zero PaintEngine.ts modifications — all changes target Layer, Brush, and UI files. This is the final plan in the 6-plan series.

## Objectives

### User Requirements

* Simple but powerful paint app (Paint.NET sweet spot between MS Paint and Krita) — Source: User specification (research scope)

### Derived Objectives

* Implement P3 advanced features (blend modes, pressure sensitivity, custom brushes, curves/levels, symmetry) — Derived from: Research P3 tier — satisfaction differentiators that elevate the app beyond basic functionality
* Produce distributable app via `npm run make` — Derived from: Research recommendation (local build and run)
* Comprehensive end-to-end validation of all features across all plans — Derived from: Final plan responsibility to ensure integrated quality

## Context Summary

### Project Files

* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — Primary research: 170+ features, P0–P3 ranking, tech stack recommendation
* `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` — Plan splitting strategy: A-prime selected, Plan 6 covers P3 + final validation
* `.copilot-tracking/research/subagents/2026-02-26/html5-canvas-patterns-research.md` — Canvas API patterns for blend modes, pressure, filters

### Predecessor

* `.copilot-tracking/plans/2026-02-26/plan-05-layers-power.instructions.md` — Plan 05: P2 Power (layers, filters, transforms) — must be complete before Plan 06

## Implementation Checklist

### [x] Implementation Phase 7: Advanced Features

<!-- parallelizable: false -->

* [x] Step 7.1: Implement blend modes — per-layer globalCompositeOperation (Normal, Multiply, Screen, Overlay, Darken, Lighten)
  * Blend mode selector in layer panel, apply during compositing
  * Files: LayerManager.ts (blend mode property), LayerPanel.ts (dropdown)
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 12-40)
* [x] Step 7.2: Implement layer opacity — per-layer transparency slider (0–100%)
  * globalAlpha per layer, opacity slider in layer panel, thumbnail reflects opacity
  * Files: LayerManager.ts (opacity property), LayerPanel.ts (slider)
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 42-66)
* [x] Step 7.3: Implement pressure sensitivity — PointerEvent.pressure for stylus/trackpad
  * Pressure-to-width mapping, variable-width strokes, mouse unchanged
  * Files: BrushTool.ts, EraserTool.ts
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 68-97)
* [x] Step 7.4: Implement custom brush engine — textures, spacing, jitter, presets
  * Stamp brush tip along stroke path, spacing/scatter/rotation controls
  * Files: src/renderer/tools/BrushEngine.ts (new), src/renderer/ui/BrushPresetPanel.ts (new)
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 99-132)
* [x] Step 7.5: Implement curves/levels — color correction with histogram
  * Levels input/output ranges, 256-entry lookup table, draggable curve UI, histogram display
  * Files: src/renderer/canvas/Adjustments.ts (new), src/renderer/ui/CurvesDialog.ts (new)
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 134-173)
* [x] Step 7.6: Implement symmetry drawing — multi-axis mirror mode
  * 1–12 axes, reflect/rotate stroke points, visual axis overlay, toggle in tool options
  * Files: BrushTool.ts (symmetry mode), PropertyPanel.ts (symmetry controls)
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 175-210)
* [x] Step 7.7: Validate Advanced Features — tsc, npm start, test advanced features
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 212-222)

### [x] Implementation Phase 8: Final Validation

<!-- parallelizable: false -->

* [x] Step 8.1: Run full project validation — tsc, lint, make
  * `npx tsc --noEmit`, `npm run lint`, `npm run make`
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 228-237)
* [x] Step 8.2: Fix minor validation issues
  * Iterate on TypeScript errors, build warnings, runtime issues
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 239-241)
* [x] Step 8.3: End-to-end functional testing (comprehensive)
  * Complete workflow, all tools at min/mid/max, tolerance and gradiance ranges, 50+ undo, layers, file I/O
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 243-269)
* [x] Step 8.4: Report blocking issues
  * Document issues, provide next steps, recommend research over inline fixes
  * Details: .copilot-tracking/details/2026-02-26/plan-06-advanced-details.md (Lines 271-278)

## Planning Log

See [plan-06-advanced-log.md](../logs/2026-02-26/plan-06-advanced-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* Plan 05 completion — layer system must exist for blend modes and layer opacity
* Node.js 18+ (20+ recommended)
* Electron Forge CLI (`@electron-forge/cli`)

## Success Criteria

* Blend modes composite correctly (Multiply darkens, Screen lightens) — Traces to: Research P3 feature (blend modes)
* Pressure sensitivity produces variable-width strokes with stylus; mouse works unchanged — Traces to: Research P3 feature (pressure sensitivity)
* Custom brushes stamp along stroke path with spacing and jitter — Traces to: Research P3 feature (custom brush engine)
* Symmetry drawing creates mirrored/rotational patterns — Traces to: Research P3 feature (symmetry)
* Curves/levels adjust color correction with draggable UI — Traces to: Research P3 feature (curves/levels)
* `npm run make` produces distributable app bundle — Traces to: Research recommendation (local build and run)
* E2E tests pass: complete workflow, all tools, all tolerance/gradiance levels, undo/redo, layers, file I/O — Traces to: Final validation responsibility
