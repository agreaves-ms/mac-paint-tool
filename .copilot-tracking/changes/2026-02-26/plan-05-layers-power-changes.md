<!-- markdownlint-disable-file -->
# Release Changes: Plan 05 — P2 Power: Layers and Effects

**Related Plan**: plan-05-layers-power.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Multi-layer architecture and P2 power features including lasso selection, gradient tool, brush presets, image filters, transform tools, transparency support, dark mode, and grid overlay with status bar.

## Changes

### Added

* src/renderer/canvas/LayerManager.ts — Layer management: add, remove, reorder, flatten, merge down, active tracking, export compositing, reset
* src/renderer/ui/LayerPanel.ts — Layer panel UI with thumbnails, visibility toggle, drag reorder, action buttons
* src/renderer/tools/LassoTool.ts — Freeform path selection with marching ants and Path2D hit testing
* src/renderer/tools/GradientTool.ts — Linear and radial gradient fills with overlay preview
* src/renderer/canvas/Filters.ts — Static filter methods (invert, brightness, contrast, blur, sharpen)
* src/renderer/canvas/Transform.ts — Static transform methods (rotate, flip, scale)

### Modified

* src/renderer/canvas/PaintEngine.ts — Layer integration (context routing, transform on layer stack, composite export, layer-aware clipboard/save/open)
* src/renderer/canvas/UndoManager.ts — Layer-aware undo/redo with layerId stored per snapshot and context resolver
* src/renderer/app.ts — Wired LayerManager, LayerPanel, LassoTool, GradientTool; updated undo/redo with layer resolver; added keyboard shortcuts (A=lasso, D=gradient)
* src/renderer/ui/Toolbar.ts — Added lasso and gradient tool buttons
* src/renderer/ui/PropertyPanel.ts — Added gradient mode toggle (Linear/Radial) section
* src/renderer/styles/app.css — Added layer panel styles
* src/renderer/tools/BrushTool.ts — Added opacity, hardness, preset support, soft brush stamping
* src/renderer/ui/PropertyPanel.ts — Added opacity/hardness sliders, preset buttons, gradient mode toggle
* src/renderer/app.ts — Wired Filters/Transform, opacity/hardness callbacks, filter/transform shortcuts, dark mode toggle, grid init, dynamic zoom display
* src/renderer/canvas/PaintEngine.ts — Transparent bgColor handling, grid overlay canvas, zoom change callback
* src/renderer/styles/app.css — Canvas transparency, data-theme overrides, theme toggle button styles, grid overlay CSS

### Removed

## Additional or Deviating Changes

* Fixed 3 lint errors introduced during implementation (empty methods, inferrable type annotation, unused variable)

## Release Summary

All 10 steps in Phase 1 completed successfully. 6 files added, 6 files modified, 0 files removed.

**Files created:**
* `src/renderer/canvas/LayerManager.ts` — Multi-layer canvas management system
* `src/renderer/ui/LayerPanel.ts` — Layer panel UI component
* `src/renderer/tools/LassoTool.ts` — Freeform lasso selection tool
* `src/renderer/tools/GradientTool.ts` — Linear/radial gradient tool
* `src/renderer/canvas/Filters.ts` — Image filter operations (invert, brightness, contrast, blur, sharpen)
* `src/renderer/canvas/Transform.ts` — Transform operations (rotate, flip, scale)

**Files modified:**
* `src/renderer/canvas/PaintEngine.ts` — Layer routing, transparency, grid overlay, zoom callbacks
* `src/renderer/canvas/UndoManager.ts` — Layer-aware undo/redo
* `src/renderer/app.ts` — Full integration of all new features, tools, keyboard shortcuts, dark mode toggle
* `src/renderer/ui/Toolbar.ts` — Added lasso and gradient tool buttons
* `src/renderer/ui/PropertyPanel.ts` — Brush presets, opacity/hardness sliders, gradient mode toggle
* `src/renderer/tools/BrushTool.ts` — Opacity, hardness, soft brush stamping
* `src/renderer/styles/app.css` — Layer panel styles, transparency, dark mode overrides, grid overlay

**Validation:**
* `npx tsc --noEmit` — passes with no errors
* `npm run lint` — no errors (warnings only, consistent with pre-existing patterns)
