---
applyTo: '.copilot-tracking/changes/2026-02-26/plan-05-layers-power-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Plan 05 — P2 Power: Layers and Effects

## Overview

Introduce multi-layer architecture and P2 power features including lasso selection, gradient tool, brush presets, image filters, transform tools, transparency support, dark mode, and grid overlay with status bar.

> **ARCHITECTURAL WARNING:** Step 6.1 is the most architecturally disruptive step in the entire project. It changes PaintEngine.ts drawing routing (routes drawing through active layer instead of single canvas) and UndoManager state management (switches from single-canvas snapshots to per-layer or composite snapshots). All disruption is contained within this plan. PaintEngine.ts is modified 3× in this plan (layers, transparency, grid).

**Mitigation:** If Plan 01 implemented a `DrawingContext` abstraction (wrapping `CanvasRenderingContext2D`), this transition is transparent to all tools — only PaintEngine's context provider changes. See plan-splitting-strategy-research.md (Lines 300–320).

## Objectives

### User Requirements

* Simple but powerful paint app with layers — Source: User specification (research scope)

### Derived Objectives

* Multi-canvas layer system with stacked `<canvas>` elements — Derived from: Research identifying layers as #1 differentiator between simple and powerful paint apps
* Image filters via pixel manipulation — Derived from: Research P2 feature ranking
* Transform tools (rotate, flip, scale) — Derived from: Research P2 feature ranking
* Dark mode following macOS system preference — Derived from: Research P2 feature ranking
* Grid overlay and status bar for precision work — Derived from: Research P2 feature ranking

## Context Summary

### Project Files

* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — Primary research: 170+ features, P0–P3 ranking
* `.copilot-tracking/research/subagents/2026-02-26/html5-canvas-patterns-research.md` — Layer implementation patterns, Canvas API patterns
* `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` — Plan 5 breakdown (Lines 269–302), DrawingContext mitigation (Lines 300–320)
* `.copilot-tracking/research/subagents/2026-02-26/file-dependency-analysis.md` — File dependency and hot-file analysis

### Predecessor

* Plan 04 — P1 Features: Content and Canvas (all P1 features and 5 PaintEngine methods must exist)

### Standards References

* HTML5 Canvas 2D API standard patterns
* Electron Forge Vite TypeScript template conventions

## Implementation Checklist

### [x] Implementation Phase 1: Layers and Power Features

<!-- parallelizable: false -->

* [x] Step 6.1: Implement layer system — multiple `<canvas>` elements, layer panel UI, add/remove/reorder
  * **ARCHITECTURAL WARNING:** This step changes PaintEngine.ts drawing routing and UndoManager state management. Routes drawing through active layer instead of single canvas. Per-layer or composite snapshots for undo.
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 12-56)
* [x] Step 6.2: Implement lasso selection — freeform path-based selection
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 57-81)
* [x] Step 6.3: Implement gradient tool — `createLinearGradient()`/`createRadialGradient()`
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 82-106)
* [x] Step 6.4: Implement brush presets — opacity, hardness, preset library
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 107-131)
* [x] Step 6.5: Implement image filters — blur, sharpen, brightness/contrast, invert via pixel manipulation
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 132-175)
* [x] Step 6.6: Implement transform tools — rotate, flip, scale via canvas transform + `drawImage()`
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 176-201)
* [x] Step 6.7: Implement transparency support — alpha channel editing, checkerboard background
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 202-223)
* [x] Step 6.8: Implement dark mode — CSS `prefers-color-scheme` + manual toggle
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 224-252)
* [x] Step 6.9: Implement grid overlay and status bar — pixel grid at high zoom, cursor position, zoom %, canvas size
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 253-280)
* [x] Step 6.10: Validate Phase 6 — tsc, npm start, test layers/filters/transforms/dark mode/grid
  * Details: .copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md (Lines 281-302)

## Planning Log

See [plan-05-layers-power-log.md](../logs/2026-02-26/plan-05-layers-power-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* Plan 04 completion — all P1 features (selection, text, clipboard, canvas management, shapes, curves) and 5 PaintEngine.ts additive methods must exist
* Node.js 18+ (20+ recommended)
* npm (bundled with Node.js)
* Electron Forge CLI (`@electron-forge/cli`)

## Success Criteria

* 5 layers can be created and drawn on independently — Traces to: Research identifying layers as #1 differentiator
* Layer visibility toggles hide/show layers correctly — Traces to: User requirement (powerful app)
* Layer reorder changes compositing order — Traces to: User requirement (powerful app)
* Image filters (invert, blur, sharpen, brightness, contrast) apply correctly — Traces to: Derived objective (P2 filters)
* Transform tools (rotate, flip, scale) work on layer or selection — Traces to: Derived objective (P2 transforms)
* Dark mode follows system preference and manual toggle works — Traces to: Derived objective (P2 dark mode)
* Grid appears at zoom ≥ 800% with lines aligned to pixel boundaries — Traces to: Derived objective (P2 grid)
* Status bar shows cursor position, zoom %, and canvas dimensions — Traces to: Derived objective (P2 status bar)
* `npx tsc --noEmit` passes — Traces to: TypeScript compilation requirement
* `npm start` launches app with all P2 features functional — Traces to: User requirement (local run)
