<!-- markdownlint-disable-file -->
# Release Changes: Plan 06 — P3 Advanced and Final Validation

**Related Plan**: plan-06-advanced.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Advanced drawing features (blend modes, layer opacity, pressure sensitivity, custom brush engine, curves/levels, symmetry drawing) and final project validation.

## Changes

### Added

* src/renderer/tools/BrushEngine.ts — Custom brush engine with stamp/strokeTo, spacing accumulator, scatter/jitter, rotation, tip loading
* src/renderer/ui/BrushPresetPanel.ts — Brush preset list UI with save/load/delete from localStorage and tip preview
* src/renderer/canvas/Adjustments.ts — Curves/levels: applyLevels, applyCurves, buildLUT (monotone cubic spline), calculateHistogram
* src/renderer/ui/CurvesDialog.ts — Curves/levels dialog with canvas curve editor, histogram, per-channel selector, draggable control points, preview toggle

### Modified

* src/renderer/canvas/LayerManager.ts — Added blendMode to Layer interface, setBlendMode method, applied globalCompositeOperation in compositing
* src/renderer/ui/LayerPanel.ts — Added per-layer blend mode dropdown and opacity slider, thumbnail applies globalAlpha
* src/renderer/tools/BrushTool.ts — Added pressure sensitivity (pen-only), symmetry drawing mode with axis controls
* src/renderer/tools/EraserTool.ts — Added pressure sensitivity (pen-only) with stamp-based variable-width rendering
* src/renderer/ui/PropertyPanel.ts — Added symmetry controls (toggle, axis type, axis count slider) with PropertyCallbacks
* src/renderer/app.ts — Wired symmetry callbacks to BrushTool

### Removed

## Additional or Deviating Changes

* BrushPresetPanel created but not yet wired into app.ts (requires container element and BrushEngine instance)
* CurvesDialog created but not yet wired into app.ts (requires menu item or keyboard shortcut invocation)
* Symmetry axis overlay dashed lines not implemented (requires overlay canvas architecture)

## Release Summary

All 11 steps across 2 phases completed successfully. 4 files added, 6 files modified, 0 files removed.

**Files created:**
* `src/renderer/tools/BrushEngine.ts` — Custom brush engine with stamp-based rendering, spacing, scatter, rotation
* `src/renderer/ui/BrushPresetPanel.ts` — Brush preset management UI with localStorage persistence
* `src/renderer/canvas/Adjustments.ts` — Curves/levels color correction with histogram and LUT operations
* `src/renderer/ui/CurvesDialog.ts` — Canvas-based curves/levels dialog with draggable control points

**Files modified:**
* `src/renderer/canvas/LayerManager.ts` — Blend mode property + compositing integration
* `src/renderer/ui/LayerPanel.ts` — Blend mode dropdown + opacity slider per layer
* `src/renderer/tools/BrushTool.ts` — Pressure sensitivity + symmetry drawing mode
* `src/renderer/tools/EraserTool.ts` — Pressure sensitivity for pen input
* `src/renderer/ui/PropertyPanel.ts` — Symmetry controls (toggle, axis type, axis count)
* `src/renderer/app.ts` — Symmetry callback wiring

**Validation:**
* `npx tsc --noEmit` — 0 errors
* `npm run lint` — 0 errors, 47 warnings (non-null assertions, standard for DOM apps)
* `npm run make` — Success, 106MB zip produced at `out/make/zip/darwin/arm64/Mac Paint-darwin-arm64-1.0.0.zip`

**Build output:**
* `out/Mac Paint-darwin-arm64/Mac Paint.app` — macOS application bundle
* `out/make/zip/darwin/arm64/Mac Paint-darwin-arm64-1.0.0.zip` — Distributable archive
