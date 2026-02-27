<!-- markdownlint-disable-file -->
# Export Canvas as SVG — Research Document

## Scope

Add an "Export as SVG…" menu item to Mac Paint Tool that exports the current canvas (with layer support) as an SVG file embedding raster image data.

## Assumptions

- SVG export embeds canvas bitmap(s) as base64 PNG `<image>` elements (raster export, not vector tracing)
- Multi-layer documents export each visible layer as a separate `<g>` group preserving opacity and blend mode
- Single-layer documents export a flat SVG with one `<image>` element
- No external dependencies required

## Success Criteria

- File > Export as SVG… menu item opens a save dialog filtered to `.svg`
- Single-layer canvas exports as valid SVG with embedded PNG
- Multi-layer canvas exports with per-layer `<g>` groups, opacity, and mix-blend-mode
- Layer names appear as group IDs (XML-escaped)
- Exported SVG renders identically to the canvas in any SVG viewer

## Evidence Log

### IPC Pattern (3-layer bridge)
- **Main** (`src/main.ts` L131-173): `ipcMain.handle('dialog:save', ...)` writes base64-decoded binary. SVG needs UTF-8 text write instead.
- **Preload** (`src/preload.ts` L3-8): `contextBridge.exposeInMainWorld('electronAPI', {...})`
- **Types** (`src/shared/electron-api.d.ts`): `ElectronAPI` interface with 15 methods

### PaintEngine Export Architecture
- `saveFile()` (L351): Gets path → determines MIME → `getExportCanvas().toDataURL()` → `writeImageFile()`
- `getExportCanvas()` (L574): Delegates to `LayerManager.getExportCanvas()` if layers exist
- Convention: "Prefer adding methods over refactoring existing ones"

### LayerManager
- `Layer` interface: `{ id, name, canvas, ctx, visible, opacity, blendMode }`
- `getExportCanvas()`: Composites all visible layers with opacity + blendMode onto temp canvas
- `getLayers()`: Returns layer array for per-layer access
- Canvas blend modes map 1:1 to CSS `mix-blend-mode` (except `source-over` → `normal`)

### SVG Structure
- Single layer: `<svg><image href="data:image/png;base64,..."/></svg>`
- Multi layer: `<svg><g id="layer-name" opacity="0.8" style="mix-blend-mode: multiply"><image .../></g></svg>`

### Security
- XML-escape layer names before embedding in SVG attributes (`&`, `<`, `>`, `"`, `'`)
- Base64 from `toDataURL()` is application-controlled, safe

## Selected Approach

Add a dedicated SVG export path (separate from raster save) with:
1. New IPC handler `file:writeSvg` that writes UTF-8 text
2. New preload method `writeSvgFile`
3. New `exportAsSvg()` method on PaintEngine
4. New "Export as SVG…" menu item in File submenu
5. New menu event channel `menu-export-svg`

**Rationale**: Separate from raster save because SVG requires text file write (not binary) and different dialog filters. Follows existing pattern of adding methods rather than modifying existing save flow.

## Rejected Alternatives

1. **Add .svg to existing Save As filters**: Rejected because SVG write is fundamentally different (text vs binary), and mixing concerns makes the save method complex.
2. **Vector tracing (potrace/bitmap-to-SVG)**: Too complex, lossy, and not what users expect from a pixel editor export.
3. **External SVG library**: Unnecessary — simple template literal string construction is sufficient.
