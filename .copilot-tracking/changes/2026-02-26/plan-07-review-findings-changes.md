<!-- markdownlint-disable-file -->
# Release Changes: Review Findings Fixes

**Related Plan**: plan-07-review-findings-plan.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Addresses 5 major and 5 minor findings from the Plans 01–06 review. Fixes data safety gaps, wires unreachable features, enables live blend mode rendering, and corrects minor robustness issues.

## Changes

### Added

### Modified

* `src/renderer/canvas/PaintEngine.ts` — Added dirty flag tracking (`dirty`, `markDirty()`, `isDirty()`, `clearDirty()`); rewrote `openFile()` with backup/restore and `img.onerror` error handling; set `dirty = false` after `saveFile()` and `newDocument()`
* `src/renderer/app.ts` — Added `confirmUnsavedChanges()` guard before `newDocument()` and `openFile()` in menu and keyboard handlers; imported and instantiated `BrushEngine` + `BrushPresetPanel`; imported `CurvesDialog` + `Adjustments` with Ctrl+M shortcut; added `engine.markDirty()` on pointerdown
* `src/renderer/canvas/LayerManager.ts` — `setBlendMode()` now applies CSS `mix-blend-mode` on layer canvas; `addLayer()` initializes `mix-blend-mode: normal`
* `src/preload.ts` — All 9 `on*` callbacks now strip `IpcRendererEvent` and return cleanup functions for listener removal
* `src/shared/electron-api.d.ts` — Updated `on*` method return types from `void` to `() => void`
* `src/main.ts` — Added file size validation in `dialog:open` handler rejecting files over 50MB
* `src/renderer/tools/EraserTool.ts` — Save/restore `globalCompositeOperation` instead of hardcoding `source-over`; added `onDeactivate()` method

### Removed

## Additional or Deviating Changes

* Step 4.4 (FillTool hexToRgba) — Skipped. The `hexToRgba` method does not exist in `FillTool.ts`; colors are set directly as `{r,g,b,a}` objects from `app.ts`. The review finding was based on stale analysis.

## Release Summary

7 files modified across 4 phases. All 5 major review findings addressed:
1. **Unsaved changes prompt** — dirty flag tracking + confirm dialog before newDocument/openFile
2. **BrushEngine/BrushPresetPanel** — imported, instantiated, and wired into property panel
3. **CurvesDialog/Adjustments** — imported with Ctrl+M shortcut, apply/cancel callbacks with undo
4. **openFile() correctness** — backup/restore pattern, img.onerror handler, awaits image load
5. **Live blend modes** — CSS mix-blend-mode applied on layer canvases

4 of 5 minor findings addressed (file size validation, IPC cleanup functions, eraser composite op, electron-api types). FillTool hexToRgba skipped (method doesn't exist). TypeScript compiles cleanly (0 errors), lint passes (0 errors, 48 warnings — all pre-existing non-null assertions).
