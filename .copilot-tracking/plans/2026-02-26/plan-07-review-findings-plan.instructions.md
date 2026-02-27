<!-- markdownlint-disable-file -->
# Implementation Plan: Review Findings Fixes

**Source**: `.copilot-tracking/reviews/2026-02-26/plans-01-06-review.md`
**Date**: 2026-02-26

## Phase 1: Data Safety — Unsaved Changes and File Open Correctness

Addresses Major findings 1 and 4: missing unsaved changes prompt and openFile lacking undo save / error handling.

Dependencies: None

* [x] Step 1.1: Add dirty flag tracking to PaintEngine — set a `dirty` boolean on any drawing operation (pointerdown save) and clear on save/new/open completion
* [x] Step 1.2: Add `isDirty()` method to PaintEngine and a `confirmUnsavedChanges()` helper that shows a confirm dialog
* [x] Step 1.3: Guard `newDocument()` calls in app.ts (both menu and Ctrl+N) with unsaved changes confirmation
* [x] Step 1.4: Guard `openFile()` call in app.ts (both menu and Ctrl+O) with unsaved changes confirmation
* [x] Step 1.5: Save undo state before `openFile()` clears canvas and add `img.onerror` handler to restore on failure

## Phase 2: Wire BrushEngine/BrushPresetPanel and CurvesDialog/Adjustments

Addresses Major findings 2 and 3: fully implemented but unreachable features.

Dependencies: None (independent of Phase 1)

* [x] Step 2.1: Import and instantiate BrushEngine + BrushPresetPanel in app.ts, wire into property panel container
* [x] Step 2.2: Import CurvesDialog and Adjustments in app.ts, add Ctrl+M keyboard shortcut to show curves dialog
* [x] Step 2.3: Wire curves dialog apply callback to modify active layer via Adjustments.applyCurvesPerChannel with undo save

## Phase 3: Live Blend Mode Rendering

Addresses Major finding 5: blend modes stored but not visually applied via CSS.

Dependencies: None (independent of Phases 1-2)

* [x] Step 3.1: Update `LayerManager.setBlendMode()` to apply CSS `mix-blend-mode` on the layer canvas element
* [x] Step 3.2: Ensure `addLayer()` initializes CSS mix-blend-mode from the layer's blendMode property

## Phase 4: Minor Fixes

Addresses Minor findings 1-5 (excluding cosmetic-only findings 6-7).

Dependencies: None (independent of Phases 1-3)

* [x] Step 4.1: Fix preload IPC `on` callbacks to strip the IpcRendererEvent parameter and return cleanup functions
* [x] Step 4.2: Add file size validation in main process dialog:open handler — reject files over 50MB
* [x] Step 4.3: Fix EraserTool compositeOperation restoration — save/restore previous compositeOperation to handle interrupted strokes
* [x] Step 4.4: Fix FillTool hexToRgba to handle 3-digit shorthand hex strings
* [x] Step 4.5: Update electron-api.d.ts to match new preload signatures (cleanup functions)
