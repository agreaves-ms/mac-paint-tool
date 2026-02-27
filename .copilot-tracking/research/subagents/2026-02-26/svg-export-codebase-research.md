# SVG Export Feature — Codebase Research

## Status: Complete

## Research Topics

1. Project conventions and architecture patterns from instruction files
2. Existing file save/export IPC patterns
3. PaintEngine architecture and export methods
4. Preload bridge pattern and API surface
5. Main process IPC handler pattern
6. Existing SVG-related code
7. Type definitions and shared types
8. Canvas rendering approach (layers, contexts)

---

## 1. Applicable Conventions and Instruction Files

### Instruction Files

| File | Description |
|------|-------------|
| `.github/copilot-instructions.md` | Master project conventions, architecture, tech stack, testing |
| `.github/instructions/commit-message.instructions.md` | Conventional commits (past-tense, `feat`/`fix`/`chore`/`docs`) |

### Key Conventions for SVG Export Feature

- **IPC Pattern**: `ipcMain.handle()` in main → `contextBridge.exposeInMainWorld()` in preload → `window.electronAPI.method()` in renderer
- **PaintEngine rule**: "Prefer adding methods over refactoring existing ones" — add `exportAsSvg()` method
- **File I/O**: PaintEngine owns File I/O via Electron IPC
- **Menu items**: Defined in `main.ts` menu template, dispatched via `webContents.send()`
- **Commit style**: `feat: added SVG export via File menu with dialog:saveSvg IPC handler`

---

## 2. Existing File Save/Export IPC Pattern

### Main Process (`src/main.ts`)

**Save dialog handler** (lines 141–155):

```typescript
ipcMain.handle('dialog:save', async (_event, dataUrl: string) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      { name: 'WebP Image', extensions: ['webp'] },
    ],
  });
  if (result.canceled || !result.filePath) return null;
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(result.filePath, Buffer.from(base64, 'base64'));
  return result.filePath;
});
```

**Get-save-path handler** (lines 157–167):

```typescript
ipcMain.handle('dialog:getSavePath', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      { name: 'WebP Image', extensions: ['webp'] },
    ],
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
});
```

**Write image file handler** (lines 169–173):

```typescript
ipcMain.handle('file:writeImage', async (_event, filePath: string, dataUrl: string) => {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return filePath;
});
```

**Menu template** (lines 32–54) — File submenu:

```typescript
{
  label: 'File',
  submenu: [
    { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new') },
    { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu-open') },
    { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-save') },
    { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-save-as') },
    { type: 'separator' },
    { role: 'quit' },
  ],
},
```

### Preload (`src/preload.ts`)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveFile: (dataUrl: string) => ipcRenderer.invoke('dialog:save', dataUrl),
  getSavePath: () => ipcRenderer.invoke('dialog:getSavePath'),
  writeImageFile: (filePath: string, dataUrl: string) => ipcRenderer.invoke('file:writeImage', filePath, dataUrl),
  // ... clipboard and menu handlers
});
```

### Renderer (`src/renderer/app.ts`, lines 271–272)

```typescript
window.electronAPI?.onMenuSave(() => engine.saveFile());
window.electronAPI?.onMenuSaveAs(() => engine.saveFile());
```

---

## 3. PaintEngine Architecture and Export Methods

### File: `src/renderer/canvas/PaintEngine.ts` (720 lines)

#### `saveFile()` method (lines 351–377)

```typescript
async saveFile(): Promise<void> {
  const filePath = await window.electronAPI?.getSavePath();
  if (!filePath) return;

  const ext = filePath.split('.').pop()?.toLowerCase();
  let mimeType = 'image/png';
  let quality: number | undefined;

  switch (ext) {
    case 'jpg': case 'jpeg':
      mimeType = 'image/jpeg';
      quality = this._exportQuality;
      break;
    case 'webp':
      mimeType = 'image/webp';
      quality = this._exportQuality;
      break;
  }

  const exportCanvas = this.getExportCanvas();
  const dataUrl = quality !== undefined
    ? exportCanvas.toDataURL(mimeType, quality)
    : exportCanvas.toDataURL(mimeType);

  await window.electronAPI?.writeImageFile(filePath, dataUrl);
  this.dirty = false;
}
```

#### `exportToBlob()` method (lines 379–387)

```typescript
exportToBlob(mimeType: string, quality?: number): Promise<Blob> {
  const exportCanvas = this.getExportCanvas();
  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      mimeType, quality,
    );
  });
}
```

#### `getExportCanvas()` method (line 574)

```typescript
private getExportCanvas(): HTMLCanvasElement {
  if (this.layerManager) {
    return this.layerManager.getExportCanvas();
  }
  return this.canvas;
}
```

#### `getCanvas()` and `getContext()` accessors (lines 548, 581)

```typescript
getContext(): CanvasRenderingContext2D {
  if (this.layerManager) {
    const layerCtx = this.layerManager.getActiveContext();
    if (layerCtx) return layerCtx;
  }
  return this.ctx;
}

getCanvas(): HTMLCanvasElement {
  return this.canvas;
}
```

#### Export quality getter/setter (lines 452–458)

```typescript
get exportQuality(): number { return this._exportQuality; }
set exportQuality(q: number) { this._exportQuality = Math.max(0.1, Math.min(1.0, q)); }
```

---

## 4. LayerManager Export Canvas

### File: `src/renderer/canvas/LayerManager.ts`

#### `Layer` interface (lines 1–9)

```typescript
export interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
}
```

#### `getExportCanvas()` method (lines 245–260)

Composites all visible layers with their blend modes and opacity:

```typescript
getExportCanvas(): HTMLCanvasElement {
  const temp = document.createElement('canvas');
  temp.width = this.width;
  temp.height = this.height;
  const ctx = temp.getContext('2d')!;

  for (const layer of this.layers) {
    if (!layer.visible) continue;
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    ctx.drawImage(layer.canvas, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  return temp;
}
```

---

## 5. Type Definitions

### `src/shared/electron-api.d.ts`

```typescript
export interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; data: string } | null>;
  saveFile: (dataUrl: string) => Promise<string | null>;
  getSavePath: () => Promise<string | null>;
  writeImageFile: (filePath: string, dataUrl: string) => Promise<string | null>;
  writeClipboardImage: (dataUrl: string) => Promise<void>;
  readClipboardImage: () => Promise<string | null>;
  onMenuNew: (callback: () => void) => () => void;
  onMenuOpen: (callback: () => void) => () => void;
  onMenuSave: (callback: () => void) => () => void;
  onMenuSaveAs: (callback: () => void) => () => void;
  onMenuUndo: (callback: () => void) => () => void;
  onMenuRedo: (callback: () => void) => () => void;
  onMenuCopy: (callback: () => void) => () => void;
  onMenuCut: (callback: () => void) => () => void;
  onMenuPaste: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### `src/shared/types.ts`

```typescript
export interface Color { r: number; g: number; b: number; a: number; }
export interface Point { x: number; y: number; }
export enum ToolType {
  Brush = 'brush', Eraser = 'eraser', Fill = 'fill',
  Selection = 'selection', Shape = 'shape', Text = 'text',
  Eyedropper = 'eyedropper',
}
```

---

## 6. Tool Interface

### `src/renderer/tools/Tool.ts`

```typescript
export interface Tool {
  name: string;
  cursor: string;
  lineWidth: number;
  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onActivate?(): void;
  onDeactivate?(): void;
}
```

---

## 7. Existing SVG-Related Code

**No SVG export/generation code exists in the codebase.** All SVG references found are in research/planning documents only:

- `.copilot-tracking/research/` — mentions SVG as a potential format in feature comparisons
- `.copilot-tracking/plans/logs/` — DR-02 deferred SVG format support
- `package-lock.json` — unrelated base64 hash strings

---

## 8. Canvas Rendering Approach

### Architecture Overview

1. **Single-canvas mode**: `PaintEngine` owns one `HTMLCanvasElement` with `willReadFrequently: true`
2. **Multi-layer mode**: `LayerManager` creates a layer stack with per-layer `<canvas>` elements, each with their own `CanvasRenderingContext2D`
3. **Event canvas**: Original canvas becomes a transparent event-capture surface (z-index 9999)
4. **Layer compositing**: Each layer has `visible`, `opacity`, and `blendMode` properties
5. **Export**: `getExportCanvas()` composites all visible layers onto a temporary canvas

### Key Canvas Properties

- Default size: 1024×768 (based on `newDocument` usage)
- Context: `{ willReadFrequently: true }` for pixel manipulation
- Pixel rendering: `image-rendering: pixelated` on layer canvases
- Zoom: CSS transforms on layer stack (`translate + scale`)

---

## Implementation Pattern for SVG Export

Based on the existing patterns, an SVG export feature would require changes to these files:

| File | Change |
|------|--------|
| `src/main.ts` | Add `ipcMain.handle('dialog:saveSvg', ...)` with `.svg` filter; optionally add "Export as SVG…" menu item |
| `src/preload.ts` | Add `saveSvgFile: (svgContent: string) => ipcRenderer.invoke('dialog:saveSvg', svgContent)` |
| `src/shared/electron-api.d.ts` | Add `saveSvgFile: (svgContent: string) => Promise<string \| null>` |
| `src/renderer/canvas/PaintEngine.ts` | Add `exportAsSvg(): Promise<void>` method that rasterizes canvas to data URL, wraps in `<svg><image>` element, and saves via IPC |
| `src/renderer/app.ts` | Wire menu event: `window.electronAPI?.onMenuExportSvg(() => engine.exportAsSvg())` |

### IPC Pattern to Follow

```
main.ts:     ipcMain.handle('dialog:saveSvg', handler)     — writes SVG string to file
preload.ts:  saveSvgFile: () => ipcRenderer.invoke(...)     — bridges renderer to main
renderer:    window.electronAPI.saveSvgFile(svgString)      — calls from PaintEngine
```

### SVG Export Approaches

1. **Raster embed**: Wrap `canvas.toDataURL()` in `<svg><image href="data:..."/></svg>` — simple, preserves exact pixel content
2. **True vectorization**: Trace bitmap pixels into SVG paths — complex, lossy for raster art
3. **Hybrid**: Support both; default to raster embed since this is a bitmap paint app

---

## Discovered Topics (Not Researched Further)

- Canvas-to-SVG vectorization libraries (e.g., `potrace`, `imagetracerjs`)
- SVG metadata (viewBox, dimensions, color profile)
- Multi-layer SVG export (each layer as a separate `<g>` group)

---

## Clarifying Questions

1. **Raster vs. vector SVG?** Should the SVG embed the canvas as a raster `<image>` element, or attempt bitmap-to-vector tracing?
2. **Layer preservation?** Should multi-layer documents export each layer as a separate SVG group, or flatten first?
3. **Menu placement?** Should "Export as SVG" be a new File menu item, or integrated into the existing Save As dialog with an SVG filter?
