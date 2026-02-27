<!-- markdownlint-disable-file -->
# Implementation Plan: Remaining Minor Findings

**Source**: `.copilot-tracking/reviews/2026-02-26/plans-01-06-review.md`
**Date**: 2026-02-26

## Phase 1: Status Bar Updates and Crop Shortcut

Addresses: status bar not updated after crop/drag-drop and cropToSelection has no keyboard shortcut.

Dependencies: None

* [x] Step 1.1: Add `onCanvasSizeChange` callback to PaintEngine — call it from `cropToSelection()` and the `drop` handler after canvas dimensions change
* [x] Step 1.2: Wire `onCanvasSizeChange` in app.ts to update `canvasSizeEl` text content
* [x] Step 1.3: Add `Ctrl+Shift+K` keyboard shortcut in app.ts for crop-to-selection — save undo state before crop

## Phase 2: Eyedropper Color Preview

Addresses: eyedropper color preview tooltip not implemented while hovering.

Dependencies: None (independent of Phase 1)

* [x] Step 2.1: Update `EyedropperTool.onPointerMove()` to sample color under cursor and emit via a new `onColorPreview` callback
* [x] Step 2.2: Create a tooltip element in app.ts positioned near cursor that shows color swatch and hex value when eyedropper tool is active

## Phase 3: JPEG/WebP Export Quality

Addresses: export quality hardcoded at 0.92 with no user control.

Dependencies: None (independent of Phases 1-2)

* [x] Step 3.1: Add `exportQuality` property to PaintEngine with getter/setter (default 0.92, range 0.1–1.0)
* [x] Step 3.2: Use `this.exportQuality` in `saveFile()` instead of hardcoded 0.92
* [x] Step 3.3: Add quality slider to PropertyPanel that binds to PaintEngine's exportQuality — visible when file format supports quality (JPEG/WebP)

## Phase 4: Symmetry Axis Overlay

Addresses: symmetry drawing works but no dashed overlay lines show axis positions.

Dependencies: None (independent of Phases 1-3)

* [x] Step 4.1: Add `drawSymmetryOverlay()` method to PaintEngine that renders dashed lines on the grid/overlay canvas based on BrushTool's symmetry settings
* [x] Step 4.2: Call `drawSymmetryOverlay()` when symmetry is toggled on/off and when symmetry parameters change — clear overlay when symmetry is disabled
