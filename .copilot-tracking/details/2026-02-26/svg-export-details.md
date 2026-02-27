<!-- markdownlint-disable-file -->
# Export Canvas as SVG — Implementation Details

## Context References

- Plan: `.copilot-tracking/plans/2026-02-26/svg-export-plan.instructions.md`
- Research: `.copilot-tracking/research/2026-02-26/svg-export-research.md`

## Phase 1: IPC and Type Infrastructure

### Step 1: Add `writeSvgFile` to ElectronAPI interface

**File**: `src/shared/electron-api.d.ts` (line 5, after `writeImageFile`)
**Operation**: Add method signature
```typescript
writeSvgFile: (filePath: string, svgContent: string) => Promise<string | null>;
```

### Step 2: Add `onMenuExportSvg` to ElectronAPI interface

**File**: `src/shared/electron-api.d.ts` (line 15, after `onMenuPaste`)
**Operation**: Add method signature
```typescript
onMenuExportSvg: (callback: () => void) => () => void;
```

### Step 3: Add `file:writeSvg` IPC handler

**File**: `src/main.ts` (after `file:writeImage` handler, ~line 173)
**Operation**: Add new IPC handler
```typescript
ipcMain.handle('file:writeSvg', async (_event, filePath: string, svgContent: string) => {
  fs.writeFileSync(filePath, svgContent, 'utf-8');
  return filePath;
});
```

### Step 4: Add "Export as SVG…" menu item

**File**: `src/main.ts` (in File submenu, after Save As, before separator)
**Operation**: Add menu item
```typescript
{
  label: 'Export as SVG…',
  accelerator: 'CmdOrCtrl+Shift+E',
  click: () => mainWindow.webContents.send('menu-export-svg'),
},
```

### Step 5: Add preload bridge methods

**File**: `src/preload.ts`
**Operation**: Add `writeSvgFile` method and `onMenuExportSvg` listener

```typescript
writeSvgFile: (filePath: string, svgContent: string) => ipcRenderer.invoke('file:writeSvg', filePath, svgContent),
onMenuExportSvg: (callback: () => void) => {
  const handler = () => callback();
  ipcRenderer.on('menu-export-svg', handler);
  return () => { ipcRenderer.removeListener('menu-export-svg', handler); };
},
```

## Phase 2: SVG Export Logic

### Step 1: Add `exportAsSvg()` method to PaintEngine

**File**: `src/renderer/canvas/PaintEngine.ts` (after `exportToBlob()` method, ~line 390)
**Operation**: Add new method

The method should:
1. Show save dialog via `getSavePath()` — but we need a dedicated SVG save dialog. Use a new IPC call or reuse existing pattern with SVG filter.
2. Actually, we'll add a `getSvgSavePath` IPC handler in main that shows dialog with SVG filter only.

**Revision**: Add `dialog:getSvgSavePath` IPC handler in main.ts and `getSvgSavePath` in preload/types too.

Updated Phase 1 additions:
- `getSvgSavePath` in types, preload, and main IPC

```typescript
async exportAsSvg(): Promise<void> {
  const filePath = await window.electronAPI?.getSvgSavePath();
  if (!filePath) return;

  const layerManager = this.getLayerManager();
  let svgContent: string;

  if (layerManager) {
    const layers = layerManager.getLayers();
    const visibleLayers = layers.filter(l => l.visible);
    const width = this.canvas.width;
    const height = this.canvas.height;

    let layerElements = '';
    for (const layer of visibleLayers) {
      const dataUrl = layer.canvas.toDataURL('image/png');
      const escapedName = this.escapeXml(layer.name);
      const blendMode = layer.blendMode === 'source-over' ? 'normal' : layer.blendMode;
      layerElements += `  <g id="${escapedName}" opacity="${layer.opacity}" style="mix-blend-mode: ${blendMode}">\n`;
      layerElements += `    <image href="${dataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" />\n`;
      layerElements += `  </g>\n`;
    }

    svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${layerElements}</svg>\n`;
  } else {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dataUrl = this.canvas.toDataURL('image/png');
    svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <image href="${dataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" />\n</svg>\n`;
  }

  await window.electronAPI?.writeSvgFile(filePath, svgContent);
}

private escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
```

### Step 2: Wire menu event in app.ts

**File**: `src/renderer/app.ts` (after `onMenuPaste` handler, ~line 277)
**Operation**: Add event listener

```typescript
window.electronAPI?.onMenuExportSvg(() => engine.exportAsSvg());
```

## Success Criteria Per Step

- Phase 1 Steps 1-5: TypeScript compiles, IPC channel registered, menu item visible
- Phase 2 Step 1: `exportAsSvg()` generates valid SVG string, writes to file
- Phase 2 Step 2: Menu item triggers export flow end-to-end
