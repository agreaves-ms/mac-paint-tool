<!-- markdownlint-disable-file -->
# Implementation Details: Review Findings Fixes

**Related Plan**: `plan-07-review-findings-plan.instructions.md`

## Phase 1: Data Safety — Unsaved Changes and File Open Correctness

### Step 1.1: Add dirty flag tracking to PaintEngine

In `src/renderer/canvas/PaintEngine.ts`:
- Add a private `dirty = false` field
- Add `markDirty()` method that sets `dirty = true`
- In `newDocument()`, set `dirty = false` after completing
- In `saveFile()`, set `dirty = false` after successful write

### Step 1.2: Add isDirty() and confirmUnsavedChanges()

In `src/renderer/canvas/PaintEngine.ts`:
- Add `isDirty(): boolean` public method returning `this.dirty`
- Add `clearDirty(): void` public method setting `this.dirty = false`

In `src/renderer/app.ts`:
- Add a standalone `confirmUnsavedChanges(): boolean` function that checks `engine.isDirty()` and shows `confirm('You have unsaved changes. Continue?')` returning the result

### Step 1.3: Guard newDocument() calls

In `src/renderer/app.ts`:
- In the `onMenuNew` callback, check `confirmUnsavedChanges()` before showing NewDocumentDialog
- In the Ctrl+N keyboard shortcut handler, check `confirmUnsavedChanges()` before showing NewDocumentDialog

### Step 1.4: Guard openFile() calls

In `src/renderer/app.ts`:
- In the `onMenuOpen` callback, check `confirmUnsavedChanges()` before calling `engine.openFile()`
- In the Ctrl+O keyboard shortcut handler, check `confirmUnsavedChanges()` before calling `engine.openFile()`

### Step 1.5: Save undo state before openFile clears canvas; add error handling

In `src/renderer/canvas/PaintEngine.ts` `openFile()`:
- Accept an optional `undoManager` parameter (or add an undo callback)
- Before clearing the canvas, save undo state
- Wrap image load in a Promise that resolves on `img.onload` and rejects on `img.onerror`
- On error, restore the previous canvas state from undo

Actually, a simpler approach: have `openFile()` save the current ImageData before clearing, and restore on error.

In `PaintEngine.openFile()`:
```typescript
async openFile(): Promise<void> {
  const result = await window.electronAPI?.openFile();
  if (!result) return;

  const drawCtx = this.getContext();
  // Save current state for recovery
  const backup = drawCtx.getImageData(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      const binary = atob(result.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes]);
      img.src = URL.createObjectURL(blob);
    });
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.drawImage(img, 0, 0);
    URL.revokeObjectURL(img.src);
    this.dirty = false;
  } catch {
    // Restore backup on failure
    drawCtx.putImageData(backup, 0, 0);
  }
}
```

In `src/renderer/app.ts`:
- Set dirty flag on pointerdown (already saves undo state): add `engine.markDirty()` after undo save

## Phase 2: Wire BrushEngine/BrushPresetPanel and CurvesDialog/Adjustments

### Step 2.1: Wire BrushEngine + BrushPresetPanel

In `src/renderer/app.ts`:
- Import `BrushEngine` and `BrushPresetPanel`
- Instantiate `const brushEngine = new BrushEngine();`
- Instantiate `new BrushPresetPanel(document.getElementById('property-panel')!, brushEngine);`

### Step 2.2: Import CurvesDialog and add keyboard shortcut

In `src/renderer/app.ts`:
- Import `CurvesDialog` from `'./ui/CurvesDialog'`
- Import `Adjustments` from `'./canvas/Adjustments'`
- Instantiate `const curvesDialog = new CurvesDialog();`
- Add Ctrl+M keyboard shortcut in the keydown handler:
```typescript
if (isMeta && e.key === 'm' && !e.shiftKey) {
  e.preventDefault();
  const ctx = engine.getContext();
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  undoManager.saveState(ctx, engine.getLayerManager()?.getActiveLayerId());
  const backup = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  curvesDialog.show(
    imageData,
    (lutR, lutG, lutB) => {
      const newData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      Adjustments.applyCurvesPerChannel(newData, lutR, lutG, lutB);
      ctx.putImageData(newData, 0, 0);
    },
    () => {
      ctx.putImageData(backup, 0, 0);
    }
  );
  return;
}
```

### Step 2.3: Wire curves dialog apply

Already handled in step 2.2 — the apply callback uses Adjustments.applyCurvesPerChannel to modify active layer context.

## Phase 3: Live Blend Mode Rendering

### Step 3.1: Update setBlendMode to apply CSS mix-blend-mode

In `src/renderer/canvas/LayerManager.ts`, `setBlendMode()`:
```typescript
setBlendMode(id: string, mode: GlobalCompositeOperation): void {
  const layer = this.layers.find((l) => l.id === id);
  if (layer) {
    layer.blendMode = mode;
    layer.canvas.style.mixBlendMode = mode;
    this.onChangeCallback?.();
  }
}
```

Note: `GlobalCompositeOperation` values like `'multiply'`, `'screen'`, `'overlay'`, `'darken'`, `'lighten'` map directly to CSS `mix-blend-mode` values. The `'source-over'` default maps to `'normal'` in CSS, so we need to handle that mapping.

Mapping:
- `'source-over'` → `'normal'`
- All others: use the value directly (they match CSS mix-blend-mode names)

### Step 3.2: Initialize CSS mix-blend-mode in addLayer

In `addLayer()`, after creating the canvas element, set `canvas.style.mixBlendMode = 'normal'` (since default blendMode is `'source-over'`).

## Phase 4: Minor Fixes

### Step 4.1: Fix preload IPC on callbacks

In `src/preload.ts`, change each `on` method to strip the IpcRendererEvent and return a cleanup function:
```typescript
onMenuNew: (callback: () => void) => {
  const handler = () => callback();
  ipcRenderer.on('menu-new', handler);
  return () => ipcRenderer.removeListener('menu-new', handler);
},
```

Apply this pattern for all 9 `on` listeners.

### Step 4.2: Add file size validation

In `src/main.ts`, in the `dialog:open` handler:
```typescript
const stats = fs.statSync(filePath);
if (stats.size > 50 * 1024 * 1024) {
  return null; // Reject files over 50MB
}
```

### Step 4.3: Fix EraserTool compositeOperation restoration

In `src/renderer/tools/EraserTool.ts`:
- Add a `private savedCompositeOp: GlobalCompositeOperation = 'source-over'` field
- In `onPointerDown`, save `ctx.globalCompositeOperation` before setting `destination-out`
- In `onPointerUp`, restore the saved value instead of hardcoding `source-over`
- Add `onDeactivate()` method that ensures reset if tool is switched mid-stroke

### Step 4.4: Fix FillTool hexToRgba

In `src/renderer/tools/FillTool.ts`, update `hexToRgba` to handle 3-digit hex:
```typescript
private hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
  }
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
    a: 255,
  };
}
```

### Step 4.5: Update electron-api.d.ts

In `src/shared/electron-api.d.ts`, update the `on*` method signatures to return cleanup functions:
```typescript
onMenuNew: (callback: () => void) => () => void;
```
