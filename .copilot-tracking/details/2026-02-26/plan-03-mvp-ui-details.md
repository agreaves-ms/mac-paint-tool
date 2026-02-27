<!-- markdownlint-disable-file -->
# Implementation Details: Plan 03 — P0 MVP UI, File I/O and Polish

## Context Reference

Sources: `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` (Lines 450–770, monolithic Phase 3), `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` (P0 UI features), `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` (Plan 3 breakdown, Lines 193–227)

## Implementation Phase 1: UI, File I/O and Polish

<!-- parallelizable: false -->

### Step 3.1: Implement ColorPicker.ts

Color picker with foreground/background color system and swap functionality.

Implementation:
- Primary: `<input type="color">` for foreground color
- Secondary: `<input type="color">` for background color
- Swap button and X keyboard shortcut to swap foreground/background
- Display two overlapping color squares (foreground on top, background behind) — classic MSPaint/Photoshop pattern
- Default: foreground = black (#000000), background = white (#ffffff)

Files:
* `src/renderer/ui/ColorPicker.ts` — Color picker component

Success criteria:
* Color picker opens native color dialog
* Foreground/background colors display correctly
* X key swaps colors
* Tools use current foreground color for drawing

Context references:
* mac-paint-app-features-research.md (Lines 237–241) — Color tools

Dependencies:
* Plan 02 completion

### Step 3.2: Implement Toolbar.ts

Tool palette sidebar with tool buttons and active state highlighting.

Implementation:
- Vertical sidebar on the left side of the window
- Tool buttons with icons (can use Unicode symbols or simple CSS icons initially)
- Active tool highlighted with border/background
- Tools: Brush (B), Eraser (E), Fill Bucket (G), Color Selection (W), Shape: Line (L), Shape: Rectangle (R), Shape: Ellipse (O)
- Click to select tool, or use keyboard shortcut
- Emit tool change events to PaintEngine

Files:
* `src/renderer/ui/Toolbar.ts` — Toolbar component

Success criteria:
* All P0 tools appear in the toolbar
* Clicking a tool activates it
* Active tool has visual highlight
* PaintEngine receives tool change notifications

Context references:
* mac-paint-app-features-research.md (Lines 325–325) — Toolbar

Dependencies:
* Plan 02 completion

### Step 3.3: Implement PropertyPanel.ts

Contextual tool options panel with line size slider and tolerance/gradiance slider.

Implementation:
- Line size slider: `<input type="range" min="1" max="100" value="3">` — visible for all stroke tools
- Tolerance slider: `<input type="range" min="0" max="255" value="32">` — visible for Fill Bucket tool
- Gradiance slider: `<input type="range" min="0" max="255" value="32">` — visible for Color Selection tool
- Shape mode buttons: Stroke / Fill / Stroke+Fill — visible for Shape tools
- Numeric display showing current slider values
- Panel updates when active tool changes (show relevant controls)

Slider binding: when slider value changes, update the active tool's `lineWidth` property or tolerance parameter.

Brush size preview cursor: Generate a circle cursor matching the current brush diameter.
```typescript
// Create cursor from canvas data URL
const cursorCanvas = document.createElement('canvas');
const size = lineWidth + 2;
cursorCanvas.width = size;
cursorCanvas.height = size;
const cctx = cursorCanvas.getContext('2d')!;
cctx.beginPath();
cctx.arc(size/2, size/2, lineWidth/2, 0, Math.PI * 2);
cctx.stroke();
canvas.style.cursor = `url(${cursorCanvas.toDataURL()}) ${size/2} ${size/2}, crosshair`;
```

Files:
* `src/renderer/ui/PropertyPanel.ts` — Property panel component

Success criteria:
* Line size slider adjusts stroke width in real-time
* Tolerance slider is visible only for Fill Bucket
* Gradiance slider is visible only for Color Selection
* Shape mode toggle works for shape tools
* Cursor preview matches current brush size

Context references:
* mac-paint-app-features-research.md (Lines 396–410) — Line size slider, brush size cursor
* mac-paint-app-features-research.md (Lines 343–366) — Tolerance slider

Dependencies:
* Plan 02 completion

### Step 3.4: Implement zoom/pan

Canvas zoom and pan using CSS transforms and mouse/trackpad events.

Implementation:
- Zoom: transform `scale()` on the canvas container. Levels: 25%, 50%, 100%, 200%, 400%, 800%, 1600%
- Mouse wheel zoom: `wheel` event with `deltaY` to zoom in/out, centered on cursor position
- Trackpad pinch zoom: same `wheel` event with `ctrlKey` modifier (browsers report pinch as ctrl+wheel)
- Pan: scroll events on the canvas container, or hold Space + drag
- Fit to window: calculate scale to fit canvas within container
- Keyboard: `Ctrl/⌘ + +` zoom in, `Ctrl/⌘ + -` zoom out, `Ctrl/⌘ + 0` fit to window
- Update coordinate mapping in PaintEngine to account for zoom and offset

Files:
* `src/renderer/canvas/PaintEngine.ts` — Add zoom/pan methods and coordinate transforms

Success criteria:
* Mouse wheel zooms in/out centered on cursor
* Trackpad pinch zoom works
* Zoomed canvas can be panned
* Coordinate mapping is accurate at all zoom levels (drawing appears at cursor position)

Context references:
* mac-paint-app-features-research.md (Lines 496–496) — Zoom/Pan via CSS transform

Dependencies:
* Step 2.1 (PaintEngine) completion

### Step 3.5: Implement file I/O

File open and save using Electron's native dialog APIs and Canvas blob export.

Main process (IPC handlers):
```typescript
// In main.ts — register IPC handlers
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
  });
  if (!result.canceled) {
    return fs.readFileSync(result.filePaths[0]);  // Return Buffer
  }
});

ipcMain.handle('dialog:saveFile', async (_, data: Buffer, defaultName: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [
      { name: 'PNG', extensions: ['png'] },
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] }
    ]
  });
  if (!result.canceled) {
    fs.writeFileSync(result.filePath!, data);
  }
});
```

Preload script (contextBridge):
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: Buffer, name: string) => ipcRenderer.invoke('dialog:saveFile', data, name),
});
```

Renderer (save):
```typescript
canvas.toBlob((blob) => {
  const reader = new FileReader();
  reader.onload = () => {
    window.electronAPI.saveFile(Buffer.from(reader.result as ArrayBuffer), 'untitled.png');
  };
  reader.readAsArrayBuffer(blob!);
}, 'image/png');
```

Renderer (open):
```typescript
const buffer = await window.electronAPI.openFile();
if (buffer) {
  const blob = new Blob([buffer]);
  const img = new Image();
  img.onload = () => { ctx.drawImage(img, 0, 0); };
  img.src = URL.createObjectURL(blob);
}
```

Files:
* `src/main.ts` — Add IPC handlers for file dialogs
* `src/preload.ts` — Expose file I/O APIs via contextBridge
* `src/renderer/canvas/PaintEngine.ts` — Add save/open methods

Success criteria:
* Open dialog shows native macOS file picker
* Opening a PNG/JPEG image displays it on canvas
* Save dialog lets user choose location and format
* Saved file is a valid PNG/JPEG that can be reopened

Context references:
* mac-paint-app-features-research.md (Lines 494–494) — Electron dialog + toBlob

Dependencies:
* Phase 1 completion (Electron shell with preload)

### Step 3.6: Implement New Document action

File > New / Ctrl+N action to create a fresh canvas with user-specified dimensions.

Implementation:
- Menu item: File > New (Ctrl/⌘+N)
- Show dialog with: width input, height input, background color (white/transparent), preset sizes (e.g., 800×600, 1024×768, 1920×1080)
- On confirm: clear canvas (or all layers), resize to specified dimensions, reset undo history
- If unsaved changes exist, prompt "Save changes?" dialog before proceeding
- Dialog can be a simple HTML modal overlay

Files:
* `src/renderer/ui/NewDocumentDialog.ts` — Create new document dialog
* `src/renderer/canvas/PaintEngine.ts` — Add `newDocument(width, height, bgColor)` method
* `src/main.ts` — Add File > New menu item with accelerator

Success criteria:
* Ctrl/⌘+N opens the new document dialog
* Selecting dimensions creates a blank canvas of that size
* Unsaved changes prompt before clearing
* Undo history resets for the new document

Context references:
* mac-paint-app-features-research.md (Feature #56) — New Document with custom size

Dependencies:
* Step 3.5 (file I/O infrastructure) completion

### Step 3.7: Implement keyboard shortcuts

Keyboard shortcut system for tool switching and common operations.

Implementation:
```typescript
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const isMeta = e.metaKey || e.ctrlKey;

  if (isMeta && e.key === 'z' && !e.shiftKey) { undo(); e.preventDefault(); }
  if (isMeta && e.key === 'z' && e.shiftKey) { redo(); e.preventDefault(); }
  if (isMeta && e.key === 'y') { redo(); e.preventDefault(); }
  if (isMeta && e.key === 's') { save(); e.preventDefault(); }
  if (isMeta && e.key === 'o') { open(); e.preventDefault(); }

  // Single-key tool switching (only when not typing in input)
  if (!e.metaKey && !e.ctrlKey && !e.altKey && !(e.target instanceof HTMLInputElement)) {
    switch (e.key.toLowerCase()) {
      case 'b': selectTool('brush'); break;
      case 'e': selectTool('eraser'); break;
      case 'g': selectTool('fill'); break;
      case 'w': selectTool('colorSelection'); break;
      case 'l': selectTool('line'); break;
      case 'r': selectTool('rectangle'); break;
      case 'o': selectTool('ellipse'); break;
      case 'x': swapColors(); break;
      case '[': decreaseBrushSize(); break;
      case ']': increaseBrushSize(); break;
    }
  }
});
```

Files:
* `src/renderer/app.ts` — Keyboard event handling

Success criteria:
* Ctrl/⌘+Z undoes, Ctrl/⌘+Shift+Z redoes
* Single-key shortcuts switch tools
* X swaps foreground/background colors
* [ and ] adjust brush size
* Shortcuts don't fire when typing in input fields

Context references:
* mac-paint-app-features-research.md (Lines 497–497) — Keyboard shortcuts

Dependencies:
* Plan 02 completion (undo manager, tools)

### Step 3.8: Implement app.css

Base styling for the paint app layout, toolbar, property panel, and canvas container.

Key styles:
- CSS Grid layout: toolbar (left, 48px), canvas-container (center, flex), property-panel (right, 200px)
- Toolbar: vertical button stack, 40×40px tool buttons, hover/active states
- Canvas container: overflow scroll for panning, centered canvas element
- Property panel: slider groups with labels and numeric displays
- Color picker: overlapping foreground/background squares
- Status bar: bottom, fixed height, flex row
- Checkerboard background pattern for transparency indication (on canvas container behind the canvas)

Files:
* `src/renderer/styles/app.css` — Complete layout and component styles

Success criteria:
* Layout is responsive to window resizing
* Toolbar tools are clickable with visual feedback
* Sliders are usable and display current values
* Canvas is scrollable when larger than the container

Dependencies:
* Phase 1 completion

### Step 3.9: Validate Phase 3 — Complete P0 MVP

Full end-to-end validation of the P0 MVP.

Test workflow:
1. Launch app (`npm start`)
2. Select brush tool, adjust line size, draw strokes
3. Switch to eraser, erase part of the drawing
4. Draw shapes (line, rectangle, ellipse) with line size slider
5. Use paint bucket to fill a region — test tolerance at 0, 32, 128
6. Use color-tolerance selection — test gradiance slider
7. Create a new document (Ctrl/⌘+N) with custom dimensions
8. Undo several operations, then redo
9. Save file as PNG, close and reopen it
10. Test keyboard shortcuts (B, E, G, W, X, Ctrl+Z, Ctrl+S, Ctrl+N)

Validation commands:
* `npx tsc --noEmit` — TypeScript compilation
* `npm start` — Full MVP testing

Success criteria:
* All P0 tools draw correctly on canvas
* File save and open produce valid files
* New Document creates fresh canvas with correct dimensions
* Undo/redo works across all operations
* All keyboard shortcuts are functional
* Layout is styled and responsive
