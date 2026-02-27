# Research: Export Canvas as SVG in Electron App

## Status: Complete

## Research Topics

1. Standard approach for embedding Canvas bitmap into SVG
2. Proper SVG file structure wrapping a canvas bitmap
3. Multi-layer SVG structure with opacity and blend modes
4. Canvas2D `globalCompositeOperation` to SVG blend mode mapping
5. Electron dialog filter patterns for SVG
6. Security considerations for base64 image data in SVG
7. NPM packages (preference: no external dependencies)

---

## 1. Embedding Canvas Bitmap into SVG

The standard approach uses the SVG `<image>` element with an inline base64 data URI from `canvas.toDataURL()`.

### Approach

```typescript
const dataUrl = canvas.toDataURL('image/png');
// dataUrl = "data:image/png;base64,iVBORw0KGgo..."
// Embed directly as the href attribute of an SVG <image> element
```

**Key points:**

- `canvas.toDataURL()` returns a base64-encoded data URI string
- Default format is `image/png` (lossless, supports transparency)
- PNG is the recommended format for SVG embedding (lossless, universal support)
- The data URI is placed in the `href` attribute of an SVG `<image>` element
- `xlink:href` is deprecated; use `href` directly (supported Chrome 50+, Firefox 51+, Safari 12.1+)
- For large canvases, `toDataURL()` can produce very large strings — this is acceptable for file export but not for DOM manipulation

### MDN Warning

> `toDataURL()` encodes the whole image in an in-memory string. For larger images, this can have performance implications. `toBlob()` is preferred for in-memory use, but `toDataURL()` is correct for SVG file embedding.

---

## 2. Complete SVG Structure — Single Layer Export

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="1024"
     height="768"
     viewBox="0 0 1024 768">
  <title>Mac Paint Tool Export</title>
  <image href="data:image/png;base64,iVBORw0KGgo..."
         x="0" y="0"
         width="1024" height="768"
         preserveAspectRatio="none" />
</svg>
```

### Required SVG XML Namespaces

| Namespace | URI | Required? |
|---|---|---|
| SVG namespace | `xmlns="http://www.w3.org/2000/svg"` | **Yes** — mandatory for all SVG files |
| XLink namespace | `xmlns:xlink="http://www.w3.org/1999/xlink"` | Optional — only if using deprecated `xlink:href` |

### Key Attributes

- **`width`/`height`**: Match canvas dimensions. Required on `<image>` elements (unlike HTML `<img>`).
- **`viewBox`**: `"0 0 {width} {height}"` — defines the coordinate system.
- **`preserveAspectRatio="none"`**: Ensures the bitmap fills the SVG viewport exactly without letterboxing.
- **`href`**: Points to the data URI. Use `href` (not `xlink:href`).

### XML Declaration

The `<?xml version="1.0" encoding="UTF-8"?>` declaration is recommended for standalone SVG files. It declares encoding and ensures proper parsing by SVG viewers.

---

## 3. Multi-Layer SVG Structure

For a multi-layer canvas app, each visible layer should be a separate `<g>` group containing its own `<image>` element. This preserves layer metadata (name, opacity, blend mode).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="1024"
     height="768"
     viewBox="0 0 1024 768">
  <title>Mac Paint Tool Export</title>
  <style>
    .layer { isolation: isolate; }
  </style>

  <!-- Layer 0: Background -->
  <g class="layer" data-layer-name="Background"
     opacity="1"
     style="mix-blend-mode: normal">
    <image href="data:image/png;base64,iVBORw0K..."
           x="0" y="0" width="1024" height="768"
           preserveAspectRatio="none" />
  </g>

  <!-- Layer 1: Sketch -->
  <g class="layer" data-layer-name="Sketch"
     opacity="0.75"
     style="mix-blend-mode: multiply">
    <image href="data:image/png;base64,AAABBBCC..."
           x="0" y="0" width="1024" height="768"
           preserveAspectRatio="none" />
  </g>

  <!-- Layer 2: Color -->
  <g class="layer" data-layer-name="Color"
     opacity="0.9"
     style="mix-blend-mode: screen">
    <image href="data:image/png;base64,XXYYZZ..."
           x="0" y="0" width="1024" height="768"
           preserveAspectRatio="none" />
  </g>
</svg>
```

### Design Decisions

- **`<g>` groups per layer**: Preserves layer separation, allows downstream editing tools to identify layers.
- **`data-layer-name`**: Custom attribute for layer name (informational; valid in SVG).
- **`opacity` attribute on `<g>`**: Maps directly from `Layer.opacity` (0.0–1.0).
- **`style="mix-blend-mode: ..."` on `<g>`**: Maps from `Layer.blendMode`.
- **`isolation: isolate`**: Prevents layers from blending with content outside the SVG. Applied via a `<style>` block.
- **Only visible layers** should be exported (skip `layer.visible === false`).
- **Layer order**: Bottom layer first (index 0) to top layer last — matches DOM stacking order.

---

## 4. Canvas2D `globalCompositeOperation` → SVG Blend Mode Mapping

The Canvas2D `globalCompositeOperation` values used for blending map to CSS `mix-blend-mode` values. The LayerManager already uses `mix-blend-mode` in its CSS (`canvas.style.mixBlendMode`).

### Direct Mappings (Canvas → SVG `mix-blend-mode`)

| Canvas2D `globalCompositeOperation` | SVG CSS `mix-blend-mode` | Notes |
|---|---|---|
| `source-over` | `normal` | Default compositing — no blending |
| `multiply` | `multiply` | Direct match |
| `screen` | `screen` | Direct match |
| `overlay` | `overlay` | Direct match |
| `darken` | `darken` | Direct match |
| `lighten` | `lighten` | Direct match |
| `color-dodge` | `color-dodge` | Direct match |
| `color-burn` | `color-burn` | Direct match |
| `hard-light` | `hard-light` | Direct match |
| `soft-light` | `soft-light` | Direct match |
| `difference` | `difference` | Direct match |
| `exclusion` | `exclusion` | Direct match |
| `hue` | `hue` | Direct match |
| `saturation` | `saturation` | Direct match |
| `color` | `color` | Direct match |
| `luminosity` | `luminosity` | Direct match |

### Compositing-Only Operations (No blend mode equivalent)

These Canvas2D operations are compositing modes, not blend modes. They have no direct CSS `mix-blend-mode` equivalent:

| Canvas2D Operation | SVG Equivalent | Recommendation |
|---|---|---|
| `source-in` | SVG `<feComposite operator="in">` | Fall back to `normal` |
| `source-out` | SVG `<feComposite operator="out">` | Fall back to `normal` |
| `source-atop` | SVG `<feComposite operator="atop">` | Fall back to `normal` |
| `destination-over` | No direct equivalent | Fall back to `normal` |
| `destination-in` | No direct equivalent | Fall back to `normal` |
| `destination-out` | No direct equivalent | Fall back to `normal` |
| `destination-atop` | No direct equivalent | Fall back to `normal` |
| `lighter` | `plus-lighter` (CSS) | Limited browser support |
| `copy` | No equivalent | Fall back to `normal` |
| `xor` | No direct equivalent | Fall back to `normal` |

### Conversion Function

```typescript
function canvasBlendToSvg(blendMode: GlobalCompositeOperation): string {
  if (blendMode === 'source-over') return 'normal';
  // These blend modes have direct CSS mix-blend-mode equivalents
  const directModes = [
    'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light',
    'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity',
  ];
  if (directModes.includes(blendMode)) return blendMode;
  return 'normal'; // Fallback for compositing-only operations
}
```

### Existing Code Pattern

The LayerManager already does this mapping in `setBlendMode()`:

```typescript
canvas.style.mixBlendMode = mode === 'source-over' ? 'normal' : mode;
```

This same pattern should be reused for SVG export.

### Alternative: SVG `<feBlend>` Filter

SVG also supports blend modes via the `<feBlend>` filter primitive with a `mode` attribute. However, this approach is more complex (requires `<defs>`, `<filter>`, per-element `filter` references) and `mix-blend-mode` on `<g>` elements is simpler and equally well-supported. **Recommendation: use `mix-blend-mode` CSS, not `<feBlend>` filters.**

---

## 5. Electron Dialog Filter for SVG

Based on the existing dialog patterns in `main.ts`:

```typescript
// Existing pattern (for reference):
filters: [
  { name: 'PNG Image', extensions: ['png'] },
  { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
  { name: 'WebP Image', extensions: ['webp'] },
]

// SVG filter:
{ name: 'SVG Image', extensions: ['svg'] }

// Complete filter set for "Export as SVG":
filters: [
  { name: 'SVG Image', extensions: ['svg'] },
]

// Or if adding SVG to the existing save dialog:
filters: [
  { name: 'PNG Image', extensions: ['png'] },
  { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
  { name: 'WebP Image', extensions: ['webp'] },
  { name: 'SVG Image', extensions: ['svg'] },
]
```

### IPC Handler Pattern

For SVG export, the IPC handler should write the SVG string as UTF-8 text (not binary/base64 like raster images):

```typescript
// In main.ts
ipcMain.handle('dialog:saveSvg', async (_event, svgContent: string) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'SVG Image', extensions: ['svg'] }],
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, svgContent, 'utf-8');
  return result.filePath;
});
```

**Key difference from raster export**: SVG content is a UTF-8 text string, not a base64-encoded binary. Use `fs.writeFileSync(path, content, 'utf-8')` instead of `Buffer.from(base64, 'base64')`.

---

## 6. Security Considerations

### Base64 Data URI in SVG — Low Risk for Export

For a **file export** scenario (saving to disk), the security considerations are minimal:

1. **No injection risk**: The base64 data comes from `canvas.toDataURL()` which produces a well-formed data URI. The canvas is fully controlled by the application — no external/untrusted image sources.

2. **No XSS risk in export files**: The SVG file is saved to disk by the user. SVG files can contain `<script>` elements, but since we're generating the SVG programmatically with only `<image>` elements, there's no script injection vector.

3. **Data URI size**: Base64 encoding increases data size by ~33%. A 1024x768 PNG canvas could produce a 1–5 MB data URI depending on content complexity. For multi-layer export, this multiplies per layer. This is a **file size concern**, not a security concern.

4. **MIME type validation**: Always use `'image/png'` as the MIME type for `toDataURL()`. Don't pass user-supplied MIME types.

5. **XML entity injection**: If layer names come from user input, they must be XML-escaped before embedding in SVG attributes:

   ```typescript
   function escapeXml(str: string): string {
     return str
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&apos;');
   }
   ```

   This prevents a layer named `"><script>alert(1)</script>` from injecting SVG content.

6. **File path handling**: The Electron `showSaveDialog` handles path validation. Don't construct file paths from user input directly.

### Summary

| Risk | Level | Mitigation |
|---|---|---|
| Script injection via SVG | Low | Don't embed `<script>` or event handlers; only use `<image>` |
| XML entity injection via layer names | Medium | XML-escape all user-supplied strings |
| Data URI size / DoS | Low | File export, not network — user controls disk |
| MIME type confusion | Low | Hardcode `'image/png'` |
| Path traversal | None | Electron dialog handles path selection |

---

## 7. NPM Packages

### Recommendation: No external dependencies needed

The SVG generation is simple string concatenation/template literals. No DOM library or SVG parser is required:

```typescript
function exportToSvg(layers: Layer[], width: number, height: number): string {
  const images = layers
    .filter(l => l.visible)
    .map(l => {
      const dataUrl = l.canvas.toDataURL('image/png');
      const blendMode = l.blendMode === 'source-over' ? 'normal' : l.blendMode;
      const name = escapeXml(l.name);
      return `  <g class="layer" data-layer-name="${name}" opacity="${l.opacity}" style="mix-blend-mode: ${blendMode}">
    <image href="${dataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" />
  </g>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}">
  <title>Mac Paint Tool Export</title>
${images}
</svg>`;
}
```

### Packages that could help (but are unnecessary here)

| Package | Purpose | Why not needed |
|---|---|---|
| `svgson` | SVG parsing/serialization | We're only generating, not parsing |
| `xmlbuilder2` | XML document construction | Template literals are simpler for this case |
| `canvas2svg` | Canvas API → SVG path conversion | Converts drawing commands, not bitmaps — different use case |
| `svg.js` | SVG DOM manipulation | Over-engineered for bitmap wrapping |

**`canvas2svg`** deserves special mention: it intercepts Canvas 2D API calls and produces SVG vector paths. This is a fundamentally different approach — it would require intercepting all drawing operations at draw time, not at export time. The bitmap-wrapping approach is appropriate for Mac Paint Tool since it's a pixel-based editor.

---

## 8. Implementation Notes for Mac Paint Tool

### Existing Code Integration Points

- **`LayerManager.ts`**: Already has `getExportCanvas()` that flattens all layers. For multi-layer SVG export, use `getLayers()` instead and iterate per layer.
- **`Layer` interface**: Already stores `opacity: number`, `blendMode: GlobalCompositeOperation`, `visible: boolean`, `name: string`, `canvas: HTMLCanvasElement`.
- **`PaintEngine.ts`**: Has `saveFile()` that handles save dialog + file write. SVG export should follow this pattern.
- **`main.ts`**: Has `dialog:save` IPC handler. Need a new `dialog:saveSvg` handler that writes UTF-8 text.
- **`preload.ts`**: Need to expose `saveSvgFile` method.
- **`electron-api.d.ts`**: Need to add `saveSvgFile` type.

### Suggested File Changes

1. **`main.ts`**: Add `dialog:saveSvg` IPC handler
2. **`preload.ts`**: Add `saveSvgFile` bridge method
3. **`electron-api.d.ts`**: Add type declaration
4. **`PaintEngine.ts`** (or new `SvgExporter.ts`): Add `exportToSvg()` method
5. **Menu or UI**: Add "Export as SVG" option

---

## Discovered Topics / Follow-on Research

- [ ] Decide whether to provide both "single-layer flattened SVG" and "multi-layer SVG" export options, or just one
- [ ] Consider adding SVG metadata (`<metadata>` element) for creator info
- [ ] Investigate whether SVG `<desc>` should describe each layer
- [ ] Determine maximum practical file size for multi-layer SVG export (e.g., 10 layers × 5 MB each = 50 MB SVG)
- [ ] Consider optional JPEG compression for layer images to reduce SVG file size (trade-off: transparency lost)

---

## References

- [MDN: SVG `<image>` element](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/image) — attributes: `href`, `width`, `height`, `preserveAspectRatio`
- [MDN: CSS `mix-blend-mode`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mix-blend-mode) — all blend mode values, SVG support confirmed
- [MDN: `HTMLCanvasElement.toDataURL()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) — data URI generation
- [MDN: SVG `<feBlend>` filter](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feBlend) — alternative blend approach (not recommended)
- [SVG 2 Specification: ImageElement](https://svgwg.org/svg2-draft/embedded.html#ImageElement)
- Codebase files: `LayerManager.ts`, `PaintEngine.ts`, `main.ts`, `preload.ts`, `electron-api.d.ts`
