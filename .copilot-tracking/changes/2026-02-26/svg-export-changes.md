<!-- markdownlint-disable-file -->
# Export Canvas as SVG — Changes Log

## Related Plan

`.copilot-tracking/plans/2026-02-26/svg-export-plan.instructions.md`

## Implementation Date

2026-02-26

## Summary

Added "Export as SVG…" menu item and full SVG export pipeline to Mac Paint Tool. The feature exports canvas content as SVG files with embedded PNG raster data, supporting multi-layer documents with per-layer opacity and blend modes preserved as SVG groups.

## Changes by Category

### Added

- `src/shared/electron-api.d.ts`: `getSvgSavePath`, `writeSvgFile`, and `onMenuExportSvg` method signatures on `ElectronAPI` interface
- `src/main.ts`: `dialog:getSvgSavePath` IPC handler (save dialog with SVG filter), `file:writeSvg` IPC handler (UTF-8 text write), "Export as SVG…" menu item with `CmdOrCtrl+Shift+E` accelerator
- `src/preload.ts`: `getSvgSavePath`, `writeSvgFile`, and `onMenuExportSvg` bridge methods
- `src/renderer/canvas/PaintEngine.ts`: `exportAsSvg()` method (multi-layer SVG generation with per-layer groups), `escapeXml()` private helper
- `src/renderer/app.ts`: `onMenuExportSvg` event wiring to `engine.exportAsSvg()`

### Modified

None (all changes are additive)

### Removed

None
