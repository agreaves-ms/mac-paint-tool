<!-- markdownlint-disable-file -->
# Export Canvas as SVG — Implementation Plan

## Overview

Add "Export as SVG…" functionality to Mac Paint Tool, enabling users to export their canvas artwork as SVG files with embedded raster layer data.

### User Requirements

- Export canvas content as a `.svg` file from the File menu
- Preserve layer structure (visible layers as separate SVG groups with opacity and blend mode)
- Single-layer documents export as a flat SVG

### Derived Objectives

- Follow existing 3-layer IPC pattern (main → preload → renderer)
- Add dedicated text-based file write handler (SVG is UTF-8 text, not binary)
- XML-escape user-supplied layer names for security
- Add menu item with standard accelerator

## Context Summary

- Architecture: `.github/copilot-instructions.md` — IPC pattern, PaintEngine conventions
- Commit style: `.github/instructions/commit-message.instructions.md` — conventional commits, past tense

## Implementation Checklist

### Phase 1: IPC and Type Infrastructure <!-- parallelizable: false -->

* [ ] Step 1: Add `writeSvgFile` to `ElectronAPI` interface in `src/shared/electron-api.d.ts`
* [ ] Step 2: Add `onMenuExportSvg` to `ElectronAPI` interface in `src/shared/electron-api.d.ts`
* [ ] Step 3: Add `file:writeSvg` IPC handler in `src/main.ts` (writes UTF-8 text)
* [ ] Step 4: Add `menu-export-svg` menu item in File submenu in `src/main.ts`
* [ ] Step 5: Add `writeSvgFile` and `onMenuExportSvg` to preload bridge in `src/preload.ts`

### Phase 2: SVG Export Logic <!-- parallelizable: false -->

* [ ] Step 1: Add `exportAsSvg()` method to `PaintEngine` in `src/renderer/canvas/PaintEngine.ts`
* [ ] Step 2: Wire `onMenuExportSvg` handler in `src/renderer/app.ts`

## Dependencies

- No external packages required
- Depends on existing `LayerManager.getLayers()` and layer `toDataURL()` APIs

## Success Criteria

- [ ] "Export as SVG…" appears in File menu with Cmd/Ctrl+Shift+E accelerator
- [ ] Clicking it opens a save dialog filtered to `.svg` files
- [ ] Single-layer export produces valid SVG with one `<image>` element
- [ ] Multi-layer export produces SVG with `<g>` groups per visible layer
- [ ] Layer opacity and blend mode preserved in SVG
- [ ] Layer names XML-escaped in SVG group IDs
- [ ] TypeScript compiles without errors
