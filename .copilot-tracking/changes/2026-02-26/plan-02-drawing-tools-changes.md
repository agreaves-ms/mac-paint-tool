<!-- markdownlint-disable-file -->
# Release Changes: Plan 02 — P0 Core Drawing Tools

**Related Plan**: plan-02-drawing-tools.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Implement all P0 drawing tools (BrushTool, EraserTool, ShapeTool, FloodFill/FillTool, ColorSelection, UndoManager) as standalone files implementing the Tool interface from Plan 01.

## Changes

### Added

* `src/renderer/tools/BrushTool.ts` — Freehand drawing with `quadraticCurveTo` smoothing, midpoint-based curve interpolation, configurable `lineWidth` and `color`
* `src/renderer/tools/EraserTool.ts` — Eraser using `destination-out` compositing with smooth `quadraticCurveTo` curves, restores `source-over` on stroke end
* `src/renderer/tools/ShapeTool.ts` — Line/rectangle/ellipse with stroke/fill/strokeAndFill modes, shift-constrain for squares/circles/45° lines, overlay canvas for shape preview
* `src/renderer/canvas/FloodFill.ts` — Scanline queue-based flood fill with Euclidean RGBA color distance tolerance, `pop()`-based stack for O(1) operations, optimized seed injection
* `src/renderer/tools/FillTool.ts` — Thin Tool interface wrapper delegating to FloodFill, exposes `tolerance` and `fillColor` properties
* `src/renderer/canvas/ColorSelection.ts` — Full-canvas pixel scan with Euclidean distance gradiance threshold, Path2D boundary computation, dual-color marching ants animation via `requestAnimationFrame`
* `src/renderer/canvas/UndoManager.ts` — ImageData snapshot stack with 50-level default max, undo/redo with `canUndo()`/`canRedo()` helpers, `shift()`-based eviction

### Modified

### Removed

## Additional or Deviating Changes

* ShapeTool overlay canvas uses `position: absolute` + `pointerEvents: none` on a dynamically created canvas element, positioned relative to the main canvas parent container
* ColorSelection builds a `Path2D` boundary once on selection rather than recomputing per-frame, improving animation performance
* No tools were wired into `app.ts` — tool instantiation, keyboard shortcuts, and UndoManager integration are deferred to a later plan (UI wiring)

## Release Summary

Phase 1 complete. 7 files created, 0 modified, 0 removed. All P0 drawing tools implemented as standalone files following the Tool interface. TypeScript compilation passes clean (`npx tsc --noEmit`). PaintEngine.ts unchanged as required by plan boundary.
