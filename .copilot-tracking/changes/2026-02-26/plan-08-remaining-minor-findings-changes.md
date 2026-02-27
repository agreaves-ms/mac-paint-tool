<!-- markdownlint-disable-file -->
# Release Changes: Remaining Minor Findings

**Related Plan**: plan-08-remaining-minor-findings-plan.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Addresses 5 remaining minor findings from the Plans 01–06 review: status bar updates after crop/drag-drop, crop-to-selection shortcut, eyedropper color preview tooltip, configurable JPEG/WebP export quality, and symmetry axis overlay.

## Changes

### Added

### Modified

* `src/renderer/canvas/PaintEngine.ts` — Added `onCanvasSizeChange` callback (called from `cropToSelection()` and drop handler); added `_exportQuality` property with getter/setter; replaced hardcoded 0.92 quality with configurable value; added `drawSymmetryOverlay()` method with dedicated overlay canvas for symmetry axis lines
* `src/renderer/app.ts` — Wired canvas size change callback to status bar; added `Ctrl+Shift+K` shortcut for crop-to-selection with undo save; created eyedropper tooltip element and wired to `onColorPreview`; wired export quality slider to PaintEngine; wired symmetry overlay calls in symmetry controls and tool switching
* `src/renderer/tools/EyedropperTool.ts` — Added `onColorPreview` callback; updated `onPointerMove()` to sample pixel color and emit preview; added `onDeactivate()` to hide tooltip on tool switch
* `src/renderer/ui/PropertyPanel.ts` — Added export quality slider section (10–100%, step 1) with `onExportQualityChange` callback
* `src/renderer/styles/app.css` — Added `.eyedropper-tooltip` and `.eyedropper-swatch` tooltip styles; added `.symmetry-overlay` CSS class

### Removed

## Additional or Deviating Changes

* Symmetry overlay uses a dedicated `symmetryCanvas` rather than sharing the grid canvas, avoiding render conflicts between grid and symmetry overlays
* Symmetry overlay does not yet update on zoom/pan — a potential follow-on improvement

## Release Summary

5 files modified across 4 phases. All 5 remaining minor review findings addressed:
1. **Status bar after crop/drag-drop** — onCanvasSizeChange callback keeps canvas dimensions current in status bar
2. **Crop-to-selection shortcut** — Ctrl+Shift+K with undo save
3. **Eyedropper color preview** — live tooltip with color swatch and hex value near cursor
4. **JPEG/WebP export quality** — configurable via property panel slider (default 92%), no longer hardcoded
5. **Symmetry axis overlay** — dashed blue guide lines rendered on dedicated overlay canvas for mirror-h, mirror-v, and rotational symmetry modes

TypeScript compiles cleanly (0 errors), lint passes (0 errors, 49 warnings — all pre-existing non-null assertions).
