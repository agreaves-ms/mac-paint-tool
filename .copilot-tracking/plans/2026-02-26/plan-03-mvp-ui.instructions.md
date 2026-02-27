---
applyTo: '.copilot-tracking/changes/2026-02-26/plan-03-mvp-ui-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Plan 03 — P0 MVP UI, File I/O and Polish

## Overview

Complete the P0 MVP with UI components, file I/O, keyboard shortcuts, and styling. After this plan completes, the app is a fully usable paint application (P0 MVP milestone). This plan extracts monolithic plan Phase 3 (Steps 3.1–3.9).

## Objectives

### User Requirements

* Simple but powerful paint app that runs locally on Mac — Source: User request
* Complete P0 feature set — Source: User expectation (MVP milestone)

### Derived Objectives

* Implement all remaining P0 UI: color picker, toolbar, property panel — Derived from: monolithic plan Phase 3
* Add file I/O (open/save) and New Document — Derived from: monolithic plan Steps 3.5–3.6
* Add keyboard shortcuts for all tools and operations — Derived from: monolithic plan Step 3.7
* Style the application with CSS Grid layout — Derived from: monolithic plan Step 3.8
* PaintEngine.ts receives 3 additive method additions (zoom/pan, file I/O, new document) — Derived from: file-dependency-analysis.md

## Context Summary

### Project Files

* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — Feature research (170+ features, P0–P3 ranking)
* `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` — A-prime strategy, Plan 3 breakdown (Lines 193–227)
* `.copilot-tracking/research/subagents/2026-02-26/file-dependency-analysis.md` — PaintEngine.ts modification tracking
* `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` — Monolithic plan Phase 3 (Lines 93–131)
* `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` — Monolithic details (Lines 450–770)

### Predecessor Plans

* Plan 02 — P0 Core Drawing Tools: All P0 tools (Brush, Eraser, Line, Rectangle, Ellipse, FillTool, ColorSelection, UndoManager) must exist before this plan begins

## Implementation Checklist

### [ ] Implementation Phase 1: UI, File I/O and Polish

<!-- parallelizable: false -->

* [ ] Step 3.1: Implement `ColorPicker.ts` — `<input type="color">` + foreground/background swap (X key)
  * Primary and secondary color inputs with classic overlapping squares pattern
  * Default: fg=#000000, bg=#ffffff
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 12-37)
* [ ] Step 3.2: Implement `Toolbar.ts` — tool palette sidebar with icons and active state
  * Vertical sidebar left, tool buttons with icons, active tool highlighted
  * Tools: Brush(B), Eraser(E), Fill(G), ColorSelection(W), Line(L), Rectangle(R), Ellipse(O)
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 38-64)
* [ ] Step 3.3: Implement `PropertyPanel.ts` — line size slider, tolerance slider, fill mode toggle
  * Line size 1-100, tolerance 0-255, gradiance 0-255, shape mode toggle
  * Brush size cursor preview via canvas data URL
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 65-109)
* [ ] Step 3.4: Implement zoom/pan — CSS transform scale + mouse wheel/trackpad pinch zoom
  * Zoom levels 25%-1600%, cursor-centered zoom, Space+drag pan
  * Update PaintEngine coordinate mapping for zoom offset
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 110-137)
* [ ] Step 3.5: Implement file I/O — Electron `dialog` + Canvas blob export
  * Main process IPC handlers for open/save dialogs
  * Preload contextBridge for electronAPI
  * Renderer save (canvas.toBlob) and open (Image + drawImage)
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 138-214)
* [ ] Step 3.6: Implement New Document action — File > New / Ctrl+N with dimension dialog
  * Width/height inputs, bg color, presets, unsaved changes prompt
  * PaintEngine.newDocument() method, reset undo history
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 215-242)
* [ ] Step 3.7: Implement keyboard shortcuts — undo/redo, tool switching, brush size
  * Ctrl/⌘+Z/Y undo/redo, single-key tool switching, X swap colors, [] brush size
  * Guard against firing in input fields
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 243-291)
* [ ] Step 3.8: Implement `app.css` — layout styling, tool icons, slider styling
  * CSS Grid: toolbar 48px left, canvas center, property panel 200px right
  * Toolbar buttons 40x40, canvas overflow scroll, checkerboard transparency
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 292-316)
* [ ] Step 3.9: Validate Phase 3 — complete P0 MVP end-to-end
  * 10-step manual test workflow: draw, fill, select, new doc, undo/redo, save/open, keyboard shortcuts
  * Commands: `npx tsc --noEmit`, `npm start`
  * Details: .copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md (Lines 317-343)

## Planning Log

See [plan-03-mvp-ui-log.md](../logs/2026-02-26/plan-03-mvp-ui-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* Plan 02 completion — all P0 drawing tools must exist (Brush, Eraser, Line, Rectangle, Ellipse, FillTool, ColorSelection, UndoManager)
* Phase 1 Electron shell with preload bridge — required for file I/O IPC handlers
* Node.js 18+, npm, Electron Forge

## Success Criteria

* ColorPicker renders with fg/bg swap and X key shortcut — Traces to: monolithic Step 3.1
* Toolbar shows all P0 tools with active state highlighting — Traces to: monolithic Step 3.2
* PropertyPanel shows context-sensitive sliders per tool — Traces to: monolithic Step 3.3
* Zoom/pan works at all levels with accurate coordinate mapping — Traces to: monolithic Step 3.4
* File open/save shows native macOS dialogs and produces valid PNG/JPEG — Traces to: monolithic Step 3.5
* New Document creates fresh canvas with user-specified dimensions — Traces to: monolithic Step 3.6
* All keyboard shortcuts functional, guarded from input fields — Traces to: monolithic Step 3.7
* CSS Grid layout with responsive toolbar, canvas, and property panel — Traces to: monolithic Step 3.8
* Complete P0 MVP end-to-end: draw, fill, select colors, zoom, save/open files, new doc, keyboard shortcuts — Traces to: monolithic Step 3.9
* PaintEngine.ts has 3 additive methods (zoom/pan, save/open, newDocument) — Traces to: file-dependency-analysis.md
