<!-- markdownlint-disable-file -->
# Release Changes: Plan 04 — P1 Features: Content and Canvas

**Related Plan**: plan-04-p1-features-plan.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Add P1 features: selection tools (rectangular marquee, eyedropper), text tool, clipboard integration, canvas management (resize/crop, export formats, drag-and-drop), additional shapes (rounded rectangle, polygon), and curve/Bézier tool.

## Changes

### Added

* `src/renderer/tools/SelectionTool.ts` — Rectangular marquee selection tool with drag-to-select, marching ants animation, move-by-drag, floating selection support
* `src/renderer/tools/EyedropperTool.ts` — Eyedropper tool with getImageData pixel sampling and callback-based color setting
* `src/renderer/tools/TextTool.ts` — Text tool with contenteditable div overlay and ctx.fillText() rendering

### Modified

* `src/renderer/canvas/PaintEngine.ts` — Added selection state (selectionRect, selectionData), clipboard methods (copySelection, cutSelection, pasteFromClipboard, pasteAsNew), Alt+click eyedropper support
* `src/renderer/ui/Toolbar.ts` — Added marquee (M), eyedropper (I), text (T) tool entries
* `src/renderer/ui/PropertyPanel.ts` — Added text-specific controls (font family dropdown, size input, bold/italic toggles)
* `src/renderer/app.ts` — New tool imports/instances, toolMap entries, color wiring, clipboard shortcuts (⌘C/X/V/⇧V), menu events
* `src/preload.ts` — Added clipboard IPC bridge (writeImage, readImage) and menu events (copy, cut, paste, paste-as-new)
* `src/main.ts` — Added clipboard IPC handlers using Electron nativeImage, Copy/Cut/Paste menu items in Edit menu
* `src/shared/electron-api.d.ts` — Added clipboard and menu type declarations
* `src/renderer/styles/app.css` — Text tool overlay and property panel control styles
* `src/renderer/ui/ResizeDialog.ts` — Canvas resize dialog with 3×3 anchor grid, width/height inputs, background color
* `src/renderer/tools/CurveTool.ts` — Quadratic/cubic Bézier curve tool with click-based state machine and overlay preview

### Modified (Phase 2)

* `src/renderer/canvas/PaintEngine.ts` — Added resizeCanvas(), cropToSelection(), setupDragDrop(), exportToBlob(), refactored saveFile() for format detection
* `src/renderer/tools/ShapeTool.ts` — Extended ShapeType with roundedRect/polygon, added drawRoundedRect(), drawPolygon(), multi-click polygon interaction
* `src/main.ts` — Added getSavePath and writeImage IPC handlers, WebP save filter
* `src/preload.ts` — Added getSavePath and writeImageFile IPC bridges
* `src/shared/electron-api.d.ts` — Added save and resize type declarations
* `src/renderer/ui/PropertyPanel.ts` — Added corner radius slider (roundedRect), curve type toggle (curve), updated STROKE_TOOLS/SHAPE_TOOLS constants
* `src/renderer/ui/Toolbar.ts` — Added roundedRect (▢/U), polygon (⬡/P), curve (〰/C) entries
* `src/renderer/app.ts` — Wired CurveTool, roundedRect, polygon tools; added resize dialog shortcut (⌘⇧R); wired cornerRadius and curveType callbacks
* `src/renderer/styles/app.css` — Added drag-over indicator style

### Removed

## Additional or Deviating Changes

* SelectionTool registered as `marquee` (shortcut M) instead of overriding existing `selection` tool (ColorSelection, shortcut W) to avoid namespace conflict
  * Existing ColorSelection tool retained as-is for color-based selection with gradiance slider
* Clipboard uses navigator.clipboard API as primary with Electron clipboard module as IPC fallback
* Save workflow refactored to two-step IPC (`getSavePath` → `writeImageFile`) for format-aware export supporting JPEG quality and WebP
* `cropToSelection()` implemented but not wired to a keyboard shortcut or menu item (no binding specified in plan)
* Canvas size status bar updated after resize but not automatically after crop or drag-and-drop image load

## Release Summary

**Total files affected:** 16 (5 created, 11 modified, 0 removed)

**Files created:**
* `src/renderer/tools/SelectionTool.ts` — Rectangular marquee selection tool
* `src/renderer/tools/EyedropperTool.ts` — Color sampling tool
* `src/renderer/tools/TextTool.ts` — Text placement tool
* `src/renderer/ui/ResizeDialog.ts` — Canvas resize dialog with anchor grid
* `src/renderer/tools/CurveTool.ts` — Quadratic/cubic Bézier curve tool

**Files modified:**
* `src/renderer/canvas/PaintEngine.ts` — Selection state, clipboard, resize/crop, drag-drop, export
* `src/renderer/tools/ShapeTool.ts` — Rounded rectangle and polygon shapes
* `src/renderer/ui/Toolbar.ts` — 6 new tool entries (marquee, eyedropper, text, roundedRect, polygon, curve)
* `src/renderer/ui/PropertyPanel.ts` — Text controls, corner radius slider, curve type toggle
* `src/renderer/app.ts` — Full wiring for all new tools, shortcuts, callbacks
* `src/main.ts` — Clipboard IPC, format-aware save handlers, WebP filter
* `src/preload.ts` — Clipboard and save IPC bridges
* `src/shared/electron-api.d.ts` — Type declarations for new APIs
* `src/renderer/styles/app.css` — Text overlay, drag-over indicator, property panel styles

**Dependencies:** No new npm packages added.
**Deployment:** `npm start` launches with all P1 features functional.
