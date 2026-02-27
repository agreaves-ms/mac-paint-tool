<!-- markdownlint-disable-file -->
# Release Changes: Plan 03 — P0 MVP UI, File I/O and Polish

**Related Plan**: plan-03-mvp-ui-plan.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Implement all P0 MVP UI components (ColorPicker, Toolbar, PropertyPanel), file I/O, new document dialog, keyboard shortcuts, zoom/pan, and CSS styling to complete the P0 MVP milestone.

## Changes

### Added

* `src/renderer/ui/ColorPicker.ts` — Two `<input type="color">` elements with fg/bg overlapping swatch pattern, swap API, change callback
* `src/renderer/ui/Toolbar.ts` — 7 tool buttons (Brush/Eraser/Fill/Selection/Line/Rectangle/Ellipse) with Unicode icons, active state highlighting, tool change callback
* `src/renderer/ui/PropertyPanel.ts` — Context-sensitive property controls: line size slider (1-100), tolerance slider (0-255), gradiance slider (0-255), shape mode toggle (stroke/fill/strokeAndFill), brush size cursor preview
* `src/renderer/ui/NewDocumentDialog.ts` — Modal overlay dialog with preset sizes (800×600, 1024×768, 1920×1080), custom width/height inputs, white/transparent background toggle

### Modified

* `src/renderer/canvas/PaintEngine.ts` — Added zoom/pan (CSS transform, cursor-centered wheel zoom, Space+drag pan), file I/O (saveFile/openFile via electronAPI), newDocument method, mapCoordinates updated for zoom
* `src/renderer/app.ts` — Full rewrite: all component wiring (tools, UI, undo, keyboard shortcuts, Electron menu events, status bar), ColorSelection Tool wrapper, selectTool function
* `src/renderer/ui/PropertyPanel.ts` — Added setLineSize callback trigger for keyboard shortcut brush size changes
* `src/renderer/styles/app.css` — Appended ~145 lines: color picker swatches, toolbar buttons, property panel sliders and mode buttons

### Removed

## Additional or Deviating Changes

## Release Summary

Phase 1 complete. All 9 steps implemented. 5 files created, 3 files modified, 0 removed.

Files created:
* `src/renderer/ui/ColorPicker.ts` — fg/bg color picker with swap
* `src/renderer/ui/Toolbar.ts` — 7-tool toolbar palette
* `src/renderer/ui/PropertyPanel.ts` — context-sensitive property controls
* `src/renderer/ui/NewDocumentDialog.ts` — new document modal dialog

Files modified:
* `src/renderer/canvas/PaintEngine.ts` — zoom/pan, file I/O, newDocument (67 → 206 lines)
* `src/renderer/app.ts` — full component wiring with keyboard shortcuts (10 → 196 lines)
* `src/renderer/ui/PropertyPanel.ts` — setLineSize callback trigger
* `src/renderer/styles/app.css` — component styling (118 → 265 lines)

Validation: `npx tsc --noEmit` passed with zero errors. P0 MVP is structurally complete with all tools, UI, file I/O, keyboard shortcuts, zoom/pan, and new document wired together.
