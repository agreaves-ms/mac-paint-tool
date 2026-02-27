<!-- markdownlint-disable-file -->
# Implementation Details: Plan 04 — P1 Features: Content and Canvas

## Context Reference

Sources: `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` (P1 feature ranking), `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` (monolithic details Lines 650–905), `.copilot-tracking/plans/logs/2026-02-26/mac-paint-app-log.md` (DR-04, DR-08, DD-02, DD-03)

## Implementation Phase 1: Selection, Text and Clipboard

<!-- parallelizable: false -->

### Step 4.1: Implement rectangular marquee selection

Selection tool allowing drag-to-select, move, copy, and paste of rectangular regions.

Implementation:
- On `pointerdown`: record start point, begin marquee display
- On `pointermove`: draw selection rectangle on overlay canvas (dashed border)
- On `pointerup`: finalize selection rectangle
- Selected area becomes movable: drag within selection to reposition
- Copy: `getImageData()` from selection bounds, store as `ImageData`
- Paste: `putImageData()` at cursor position
- Delete: fill selection area with background color (or transparent)
- Marching ants on selection boundary using `setLineDash()` with animated offset via `requestAnimationFrame`

Selection state management in PaintEngine:
- `selectionRect: { x, y, width, height } | null`
- `selectionData: ImageData | null`
- `hasSelection(): boolean`
- `getSelectionImageData(): ImageData`
- `clearSelection(): void`

Files:
* `src/renderer/tools/SelectionTool.ts` — Create selection tool with marquee interactions
* `src/renderer/canvas/PaintEngine.ts` — Add selection state management (selectionRect, selectionData, hasSelection, getSelectionImageData, clearSelection)

Success criteria:
* Drag creates a visible selection rectangle with dashed border
* Selected content can be moved by dragging within the selection
* Copy/paste works within the canvas
* Delete clears the selected area with background color
* Marching ants animate on the selection boundary

Context references:
* mac-paint-app-features-research.md (Lines 221-223) — Selection tools

Dependencies:
* Phase 3 completion (Plan 03 — UI components must exist)

### Step 4.2: Implement eyedropper tool

Click canvas to sample the pixel color and set as foreground color.

Implementation:
- On `pointerdown`: `getImageData(x, y, 1, 1)` → extract RGBA → set as foreground color
- Show a preview of the sampled color near the cursor during `pointermove`
- Hold Alt/Option key to temporarily activate eyedropper from any tool
- Color preview: small square tooltip following the cursor showing the color under the pointer

Files:
* `src/renderer/tools/EyedropperTool.ts` — Create eyedropper tool
* `src/renderer/ui/Toolbar.ts` — Add eyedropper button (I key shortcut)

Success criteria:
* Clicking canvas sets the foreground color to the pixel color
* Alt+click works from any tool to temporarily sample
* Color picker UI updates immediately on sample
* Color preview displays near cursor during hover

Context references:
* mac-paint-app-features-research.md (Lines 237-237) — Eyedropper

Dependencies:
* Step 3.1 (ColorPicker from Plan 03) completion

### Step 4.3: Implement text tool

Text placement tool with font, size, and color controls.

Implementation:
- On click: show a text input overlay at click position
- Text input: `contenteditable` div positioned over canvas, styled with selected font/size/color
- On confirm (Enter or click outside): render text to canvas using `ctx.font`, `ctx.fillStyle`, `ctx.fillText()`
- Property panel shows: font family dropdown (system fonts), font size input, bold/italic toggles
- Anti-aliased text rendering via Canvas defaults
- Font string format: `"${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px ${family}"`

PropertyPanel text controls:
- Font family: `<select>` with common fonts (Arial, Helvetica, Times New Roman, Courier New, Georgia, Verdana)
- Font size: `<input type="number">` with range 8–200, default 16
- Bold toggle: `<button>` with B icon
- Italic toggle: `<button>` with I icon

Files:
* `src/renderer/tools/TextTool.ts` — Create text tool with contenteditable overlay
* `src/renderer/ui/PropertyPanel.ts` — Add text-specific controls (font family dropdown, size input, bold/italic toggles)

Success criteria:
* Clicking canvas opens text input overlay at that position
* Text renders to canvas with selected font, size, and color
* Text position matches where the user clicked
* Font family and size controls update the rendered text
* Bold and italic toggles work correctly

Context references:
* mac-paint-app-features-research.md (Lines 245-251) — Text tools

Dependencies:
* Step 3.3 (PropertyPanel from Plan 03) completion

### Step 4.4: Implement clipboard integration

Copy/paste images to and from the system clipboard.

Implementation:
- Copy (Ctrl/⌘+C): if selection exists, `getImageData()` → convert to PNG blob → `navigator.clipboard.write()` with `ClipboardItem`
- Cut (Ctrl/⌘+X): copy + fill selection with background color
- Paste (Ctrl/⌘+V): `navigator.clipboard.read()` → find image/png → create `ImageBitmap` → `ctx.drawImage()` as floating selection
- Paste as new image (Ctrl/⌘+Shift+V): create new canvas from clipboard content
- Electron requires `clipboard` module in main process for full system clipboard access; use IPC bridge

Clipboard IPC bridge:
- `preload.ts`: expose `clipboard.writeImage(dataUrl)` and `clipboard.readImage()` via `contextBridge`
- `main.ts`: handle `clipboard:write-image` and `clipboard:read-image` IPC events
- Fallback to `navigator.clipboard` API for web-standard operations

PaintEngine clipboard methods:
- `copySelection(): Promise<void>` — copy selection to clipboard
- `cutSelection(): Promise<void>` — copy + clear selection
- `pasteFromClipboard(): Promise<void>` — paste as floating selection
- `pasteAsNew(): Promise<void>` — create new canvas from clipboard

Files:
* `src/renderer/canvas/PaintEngine.ts` — Add clipboard methods (copySelection, cutSelection, pasteFromClipboard, pasteAsNew)
* `src/preload.ts` — Add clipboard IPC bridge (writeImage, readImage)
* `src/main.ts` — Add clipboard IPC handlers (clipboard:write-image, clipboard:read-image)

Success criteria:
* Copy from canvas, paste into Preview — image transfers correctly
* Copy from Preview, paste into canvas — image appears as floating selection
* Cut removes the selected area after copying
* Paste as new creates a fresh canvas sized to the clipboard image
* Keyboard shortcuts (Ctrl/⌘+C, X, V, Shift+V) work correctly

Context references:
* mac-paint-app-features-research.md (Lines 321-326) — Clipboard operations

Dependencies:
* Step 4.1 (Selection) completion

### Step 4.5: Validate Phase 1

Validation commands:
* `npx tsc --noEmit` — TypeScript compilation check
* `npm start` — Manual testing of selection, text, clipboard

Test workflow:
1. Select rectangular marquee tool, drag to create selection
2. Move selection by dragging within
3. Copy selection (Ctrl/⌘+C), paste (Ctrl/⌘+V) at new position
4. Delete selection content
5. Use eyedropper tool to sample a color — verify foreground updates
6. Test Alt+click eyedropper from brush tool
7. Use text tool — click, type text, confirm — verify text renders with selected font/size
8. Copy canvas selection, paste into Preview.app — verify image transfers
9. Copy image from Preview.app, paste into canvas — verify image appears

## Implementation Phase 2: Canvas Management and Additional Shapes

<!-- parallelizable: false -->

### Step 5.1: Implement canvas resize/crop

Dialogs for resizing the canvas and cropping to selection.

Implementation:
- Canvas resize: dialog with width/height inputs, anchor position (9-point grid), background color fill for new areas
- 9-point anchor grid: top-left, top-center, top-right, middle-left, center, middle-right, bottom-left, bottom-center, bottom-right
- Crop to selection: resize canvas to selected area bounds
- Use `getImageData()` → create new canvas with new dimensions → `putImageData()` with offset based on anchor position
- Dialog can be an HTML modal overlay similar to NewDocumentDialog

ResizeDialog controls:
- Width: `<input type="number">` with current canvas width as default
- Height: `<input type="number">` with current canvas height as default
- Anchor grid: 3×3 grid of radio buttons, center selected by default
- Background color: `<input type="color">` for fill color of new areas
- OK/Cancel buttons

PaintEngine methods:
- `resizeCanvas(width, height, anchor, bgColor): void`
- `cropToSelection(): void`

Files:
* `src/renderer/canvas/PaintEngine.ts` — Add resize/crop methods (resizeCanvas, cropToSelection)
* `src/renderer/ui/ResizeDialog.ts` — Create resize dialog component with anchor grid

Success criteria:
* Resize dialog opens with current dimensions pre-filled
* Canvas resizes while preserving existing content positioned by anchor
* New areas fill with specified background color
* Crop trims canvas to selection bounds

Context references:
* mac-paint-app-features-research.md (Lines 262-263) — Canvas resize/crop

Dependencies:
* Plan 03 completion (UI infrastructure)

### Step 5.2: Implement export formats

Export to PNG, JPEG, and WebP using `canvas.toBlob()`.

Implementation:
- PNG: `canvas.toBlob(callback, 'image/png')` — default, lossless
- JPEG: `canvas.toBlob(callback, 'image/jpeg', quality)` — quality slider 0.0–1.0
- WebP: `canvas.toBlob(callback, 'image/webp', quality)` — quality slider 0.0–1.0
- Save dialog filter shows all supported formats
- Detect format from file extension in save path
- Quality slider in save dialog for JPEG/WebP (default 0.92)

Format detection:
```typescript
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.png': default: return 'image/png';
  }
}
```

PaintEngine export method:
- `exportToBlob(mimeType: string, quality?: number): Promise<Blob>`

Files:
* `src/main.ts` — Update save dialog filters to include JPEG and WebP
* `src/renderer/canvas/PaintEngine.ts` — Add format-specific export method (exportToBlob)

Success criteria:
* PNG export produces valid PNG files (lossless)
* JPEG export uses quality parameter, produces valid JPEG files
* WebP export works on supported platforms
* Format is determined by file extension in save path
* Quality slider appears for lossy formats

Context references:
* mac-paint-app-features-research.md (Lines 518-518) — Export formats

Dependencies:
* Step 3.5 (file I/O from Plan 03) completion

### Step 5.3: Implement drag-and-drop

Open images by dragging them into the app window.

Implementation:
```typescript
canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file?.type.startsWith('image/')) {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); };
    img.src = URL.createObjectURL(file);
  }
});
```

Additional considerations:
- Add visual drop zone indicator: highlight canvas border on `dragenter`, remove on `dragleave`
- Revoke object URL after image loads to prevent memory leak: `URL.revokeObjectURL(img.src)` in `onload`
- Support multiple image formats: PNG, JPEG, WebP, GIF, BMP
- If canvas has unsaved changes, optionally prompt before replacing

PaintEngine drag-drop handler:
- `setupDragDrop(): void` — attach drag events to canvas element
- Handle `dragenter`, `dragover`, `dragleave`, `drop` events

Files:
* `src/renderer/canvas/PaintEngine.ts` — Add drag-and-drop handlers (setupDragDrop)

Success criteria:
* Dragging an image file from Finder into the window opens it on canvas
* Non-image files are ignored gracefully
* Image displays on canvas at correct size
* Visual drop zone indicator appears during drag-over

Context references:
* mac-paint-app-features-research.md (Lines 519-519) — Drag and drop

Dependencies:
* Phase 1 completion (Plan 01 — PaintEngine canvas init)

### Step 5.4: Implement additional shapes

Rounded rectangle and polygon tools with line size slider.

Implementation:
- Rounded rectangle: `ctx.roundRect(x, y, w, h, radius)` (Canvas API) with adjustable corner radius slider
- Corner radius slider: `<input type="range">` in PropertyPanel, range 0–50, default 10
- Polygon: click to place vertices, double-click or close path to finish
  - `ctx.moveTo()` for first vertex, `ctx.lineTo()` for subsequent vertices
  - Visual preview: draw edges as user clicks, with dashed line to current cursor position
  - Close: double-click or click near first vertex (within 10px threshold)
- Both support stroke/fill toggle and line size slider from existing PropertyPanel

ShapeTool extension:
- Add `shapeType: 'roundedRect' | 'polygon'` to existing shape types
- Rounded rect uses same drag interaction as rectangle
- Polygon uses multi-click interaction with state machine: idle → placing → closed

Files:
* `src/renderer/tools/ShapeTool.ts` — Add rounded rectangle and polygon sub-tools to existing ShapeTool

Success criteria:
* Rounded rectangle draws with adjustable corner radius via slider
* Polygon allows multi-vertex shapes with visual edge preview
* Both respect line size slider
* Both support stroke/fill toggle
* Polygon closes on double-click or clicking near first vertex

Context references:
* mac-paint-app-features-research.md (Lines 524-524) — Rounded rectangle, polygon

Dependencies:
* Step 2.5 (ShapeTool from Plan 02) completion

### Step 5.5: Implement curve/Bézier tool

Quadratic and cubic curve drawing with control points.

Implementation:
- Click to set start point, click to set end point, drag to adjust control point(s)
- Quadratic curve: one control point (3 clicks/drags)
  - Click 1: start point
  - Click 2: end point
  - Drag/click 3: control point position
  - Draws using `ctx.quadraticCurveTo(cpX, cpY, endX, endY)`
- Cubic curve: two control points (4 clicks/drags)
  - Click 1: start point
  - Click 2: end point
  - Drag/click 3: first control point
  - Drag/click 4: second control point
  - Draws using `ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY)`
- Visual control point handles: small circles at control points connected to curve endpoints by thin lines
- Control points are draggable for real-time curve adjustment
- Commit to canvas on Enter or double-click
- Line size slider applies to curve stroke via `ctx.lineWidth`
- PropertyPanel: curve type toggle (quadratic/cubic)

CurveTool state machine:
- `idle` → `setStart` → `setEnd` → `setCP1` → (`setCP2` for cubic) → `adjusting` → `committed`
- ESC cancels and returns to idle
- Enter or double-click commits the curve to canvas

Files:
* `src/renderer/tools/CurveTool.ts` — Create curve tool with quadratic/cubic modes

Success criteria:
* Curves draw smoothly with adjustable control points
* Control point handles are visible and draggable during editing
* Line size slider affects curve stroke width
* Quadratic (3-point) and cubic (4-point) modes both work
* Commit on Enter/double-click renders final curve to canvas
* ESC cancels the current curve

Context references:
* mac-paint-app-features-research.md (Lines 525-525) — Curve/Bézier tool

Dependencies:
* Step 2.2 (Tool interface from Plan 01) completion

### Step 5.6: Validate Phase 2

Validation commands:
* `npx tsc --noEmit` — TypeScript compilation check
* `npm start` — Manual testing of canvas management and shapes

Test workflow:
1. Open canvas resize dialog — verify current dimensions shown
2. Resize canvas larger — verify content preserved, new area filled with bg color
3. Make a selection, crop to selection — verify canvas trims to selection bounds
4. Save as JPEG — verify valid JPEG file with specified quality
5. Save as WebP — verify valid WebP file
6. Save as PNG — verify valid PNG file (lossless)
7. Drag an image from Finder onto canvas — verify it displays
8. Draw a rounded rectangle — adjust corner radius slider — verify shape updates
9. Draw a polygon — click multiple vertices, double-click to close — verify shape renders
10. Draw a quadratic curve — verify 3-click workflow with visible control point
11. Draw a cubic curve — verify 4-click workflow with two control points
12. Adjust line size slider — verify curve stroke width changes
