<!-- markdownlint-disable-file -->
# Export Canvas as SVG — Planning Log

## Discrepancy Log

- **DR-01**: Details file revision — added `getSvgSavePath` IPC handler (separate dialog with SVG filter) rather than reusing `getSavePath` which has raster-only filters. This is a plan addition, not a research gap.

## Implementation Paths Considered

### Selected: Dedicated SVG export path

- Separate IPC handler for SVG text write (`file:writeSvg`)
- Separate save dialog with SVG filter (`dialog:getSvgSavePath`)
- New `exportAsSvg()` method on PaintEngine
- New "Export as SVG…" menu item

**Rationale**: Clean separation from raster save flow. SVG is text (UTF-8), not binary. Dialog filters differ. Follows convention of adding methods rather than modifying existing ones.

### Alternative: Extend existing save flow

- Add `.svg` extension to existing `getSavePath` dialog filters
- Detect `.svg` extension in `saveFile()` and branch to SVG generation
- Reuse `writeImageFile` with text content

**Rejected**: Mixing binary and text writes in one handler is fragile. Dialog filter list becomes unwieldy. Branching in `saveFile()` increases complexity.

## Suggested Follow-on Work

- Add SVG import support (parse SVG `<image>` elements back to canvas layers)
- Add option to export as flattened SVG (single image, no layers) via checkbox in dialog
- Add SVG metadata (creator tool, document title)
