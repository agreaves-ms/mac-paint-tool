# Mac Paint Tool - Codebase Research

## Status: Complete

## Research Topics

1. App structure and initialization
2. Drawing tools and Tool interface
3. PaintEngine architecture
4. SVG export capability
5. Existing regression tests
6. Test project setup
7. HTML structure
8. Toolbar buttons and shortcuts
9. Canvas export/save functionality
10. ShapeTool details
11. Package.json scripts and dependencies

---

## 1. App Structure & Initialization (`src/renderer/app.ts`)

### Canvas Setup

- Canvas element: `document.getElementById('paint-canvas')` — ID is `paint-canvas`
- Canvas container: `document.getElementById('canvas-container')`
- Default canvas size: **1024×768** (`new PaintEngine(canvas, 1024, 768)`)
- Initially filled with **white background** before layer init

### Initialization Order

1. Get canvas and container from DOM
2. Create `PaintEngine(canvas, 1024, 768)`
3. Fill with white background
4. Initialize `LayerManager`
5. Set LayerManager on engine
6. Create all tool instances (BrushTool, EraserTool, FillTool, ShapeTool, SelectionTool, EyedropperTool, TextTool, CurveTool, LassoTool, GradientTool, ColorSelection, BrushEngine, CurvesDialog)
7. Wire eyedropper and selection tool into PaintEngine
8. Create `UndoManager(canvas.width, canvas.height)`
9. Create UI components: ColorPicker, Toolbar, PropertyPanel, LayerPanel, BrushPresetPanel
10. Wire tool change callbacks, color callbacks, toolbar, keyboard shortcuts
11. Default tool: `selectTool('brush')`

### Tool Map

```typescript
const toolMap: Record<string, Tool> = {
  brush: brushTool,
  eraser: eraserTool,
  fill: fillTool,
  gradient: gradientTool,
  selection: selectionToolWrapper, // ColorSelection wrapper
  marquee: selectionTool,
  lasso: lassoTool,
  eyedropper: eyedropperTool,
  text: textTool,
  line: shapeTool,
  rectangle: shapeTool,
  ellipse: shapeTool,
  roundedRect: shapeTool,
  polygon: shapeTool,
  curve: curveTool,
};
```

### Keyboard Shortcuts (Single-Key)

| Key | Tool |
|-----|------|
| B | Brush |
| E | Eraser |
| G | Fill |
| D | Gradient |
| W | Selection (color) |
| M | Marquee |
| A | Lasso |
| I | Eyedropper |
| T | Text |
| L | Line |
| R | Rectangle |
| O | Ellipse |
| U | Rounded Rect |
| P | Polygon |
| C | Curve |
| X | Swap colors |
| [ | Decrease line size |
| ] | Increase line size |

### Meta Key Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Cmd+Y | Redo |
| Cmd+S | Save |
| Cmd+O | Open |
| Cmd+C | Copy |
| Cmd+X | Cut |
| Cmd+V | Paste |
| Cmd+Shift+V | Paste as New |
| Cmd+N | New Document |
| Cmd+Shift+R | Resize Canvas |
| Cmd+' | Toggle Grid |
| Cmd+I | Invert colors |
| Cmd+M | Curves dialog |
| Cmd+Shift+K | Crop to selection |
| Cmd+Shift+H | Flip horizontal |
| Cmd+Shift+J | Flip vertical |

---

## 2. Tool Interface (`src/renderer/tools/Tool.ts`)

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

- Uses `PointerEvent` (not MouseEvent)
- Tools receive `CanvasRenderingContext2D` directly
- Optional lifecycle hooks: `onActivate()` and `onDeactivate()`

---

## 3. PaintEngine Architecture (`src/renderer/canvas/PaintEngine.ts`)

### Constructor

- Takes `canvas`, `width`, `height`
- Creates 2D context with `{ willReadFrequently: true }`
- Sets up event listeners (pointer, wheel, keyboard) and drag-drop

### Key Responsibilities

1. **Canvas initialization** — sets width/height, gets 2D context
2. **Event dispatch** — pointerdown/move/up dispatched to active tool
3. **Zoom/pan** — zoom levels 0.25–16, pan via space+drag, zoom via wheel/pinch
4. **Active tool management** — `setActiveTool(tool)`, calls `onActivate`/`onDeactivate`
5. **Coordinate mapping** — `mapCoordinates(e)` accounts for zoom/pan
6. **File I/O** — `saveFile()`, `openFile()`, `exportAsSvg()` via Electron IPC
7. **Layer routing** — `getContext()` returns active layer context if LayerManager exists
8. **Grid overlay** — pixel grid at ≥8x zoom
9. **Symmetry overlay** — mirror-h, mirror-v, rotational
10. **Selection/clipboard** — copy, cut, paste, crop to selection
11. **Document management** — `newDocument()`, `resizeCanvas()`
12. **Dirty tracking** — `markDirty()`, `isDirty()`
13. **Export quality** — configurable 0.1–1.0 for JPEG/WebP

### Key Methods

- `getContext()` — returns active layer context (or main canvas context)
- `setActiveTool(tool)` — switches active tool
- `mapCoordinates(e)` — maps PointerEvent to canvas coordinates
- `saveFile()` — save via Electron dialog
- `exportAsSvg()` — SVG export via Electron dialog
- `exportToBlob(mimeType, quality)` — export to Blob
- `newDocument(width, height, bgColor)` — create new document
- `resizeCanvas(width, height, anchor, bgColor)` — resize canvas
- `cropToSelection()` — crop to selection bounds
- `getCanvas()` — returns raw canvas element
- `getLayerManager()` — returns LayerManager or null
- `resolveLayerContext(layerId)` — get context for specific layer

---

## 4. SVG Export Capability

**Yes, SVG export exists.** Implemented in `PaintEngine.exportAsSvg()`.

### How It Works

1. Triggered by menu: File → Export as SVG… (or `Cmd+Shift+E`)
2. Opens Electron save dialog for `.svg` files
3. If LayerManager exists:
   - Iterates visible layers
   - Each layer exported as `<image>` element with PNG data URL
   - Includes opacity and blend mode per layer
4. If no LayerManager:
   - Single `<image>` element with canvas PNG data URL
5. Writes SVG XML to file via IPC

### SVG Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="W" height="H" viewBox="0 0 W H">
  <g id="layerName" opacity="1" style="mix-blend-mode: normal">
    <image href="data:image/png;base64,..." x="0" y="0" width="W" height="H" preserveAspectRatio="none" />
  </g>
</svg>
```

### IPC Chain

- Preload: `getSvgSavePath()` → `ipcRenderer.invoke('dialog:getSvgSavePath')`
- Preload: `writeSvgFile(filePath, svgContent)` → `ipcRenderer.invoke('file:writeSvg', ...)`
- Main: `ipcMain.handle('dialog:getSvgSavePath')` — shows save dialog, `.svg` filter
- Main: `ipcMain.handle('file:writeSvg')` — writes string to file

**Note:** SVG export is **raster-based** — it embeds PNG data URLs as `<image>` elements. It does NOT produce vector paths.

---

## 5. Existing Regression Test (`DrawingRegressionTests.cs`)

### Test Framework

- **xUnit** with **Playwright.Xunit** (`PageTest` base class)
- Uses `Playwright` for browser automation
- Target: `.NET 10.0`

### Test Setup

- `AppUrl = "http://localhost:5174"` — standalone Vite dev server
- Viewport: 1400×1100
- Output file: `what-i-think-about.png` saved to `tests/playwright/output/`

### Test Structure

Single test method: `WhenDrawingCompleted_CaptureCanvas_ProducesExpectedImage`

1. Navigate to app URL, wait for network idle
2. Assert page title is "Mac Paint"
3. Draw complex scene via `Page.EvaluateAsync()` — direct Canvas 2D API calls
4. Capture canvas to PNG file via `SaveCanvasToFile()`
5. Assert file exists and is > 10,000 bytes

### Drawing Approach

All drawing uses `Page.EvaluateAsync()` with JavaScript that:

1. Gets canvas: `document.getElementById('paint-canvas')`
2. Gets context: `canvas.getContext('2d', { willReadFrequently: true })`
3. Uses `canvas.width` and `canvas.height` for dimensions
4. Uses **seeded random** for deterministic output
5. Draws: sky gradient, stars, sun, water, city skyline, neural networks, text, moon

### Save Mechanism

```csharp
private async Task SaveCanvasToFile(string outputPath)
{
    var dataUrl = await Page.EvaluateAsync<string>(@"() => {
        const canvas = document.getElementById('paint-canvas');
        return canvas.toDataURL('image/png');
    }");
    var base64Data = dataUrl.Split(',')[1];
    var imageBytes = Convert.FromBase64String(base64Data);
    await File.WriteAllBytesAsync(outputPath, imageBytes);
}
```

### Output Location

```csharp
private static string GetOutputDirectory()
{
    var projectRoot = FindProjectRoot(); // walks up from AppContext.BaseDirectory to find package.json
    return Path.Combine(projectRoot, "tests", "playwright", "output");
}
```

---

## 6. Test Project Setup (`MacPaintTool.Tests.csproj`)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="coverlet.collector" Version="6.0.4" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
    <PackageReference Include="Microsoft.Playwright.Xunit" Version="1.58.0" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.4" />
  </ItemGroup>
  <ItemGroup>
    <Using Include="Xunit" />
  </ItemGroup>
</Project>
```

### Running Tests

From `package.json`:

```bash
npm run slow-test
```

This script:

1. Kills any existing process on port 5174
2. Starts standalone Vite server: `npx vite --config vite.renderer.config.ts --port 5174 --strictPort`
3. Waits 2 seconds
4. Runs `dotnet test tests/playwright/MacPaintTool.Tests`
5. Kills Vite server
6. Returns test exit code

---

## 7. HTML Structure (`src/renderer/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mac Paint</title>
  </head>
  <body>
    <div id="app">
      <div id="toolbar"></div>
      <div id="canvas-container">
        <canvas id="paint-canvas"></canvas>
      </div>
      <div id="property-panel"></div>
      <div id="color-panel"></div>
      <div id="status-bar">
        <span id="cursor-pos">0, 0</span>
        <span id="zoom-level">100%</span>
        <span id="canvas-size">1024 × 768</span>
      </div>
    </div>
    <script type="module" src="./app.ts"></script>
  </body>
</html>
```

### Key DOM Elements

| ID | Element | Purpose |
|----|---------|---------|
| `app` | div | Root app container |
| `toolbar` | div | Left toolbar (48px, populated by Toolbar.ts) |
| `canvas-container` | div | Center canvas area |
| `paint-canvas` | canvas | Main drawing canvas (1024×768) |
| `property-panel` | div | Right property panel (200px) |
| `color-panel` | div | Color picker panel |
| `status-bar` | div | Bottom status bar |
| `cursor-pos` | span | Shows cursor coords |
| `zoom-level` | span | Shows zoom percentage |
| `canvas-size` | span | Shows canvas dimensions |

---

## 8. Toolbar (`src/renderer/ui/Toolbar.ts`)

### Tool Definitions

```typescript
const TOOLS: ToolDef[] = [
  { name: 'brush', icon: '✏', shortcut: 'B' },
  { name: 'eraser', icon: '◻', shortcut: 'E' },
  { name: 'fill', icon: '🪣', shortcut: 'G' },
  { name: 'gradient', icon: '▦', shortcut: 'D' },
  { name: 'selection', icon: '🎯', shortcut: 'W' },
  { name: 'marquee', icon: '⬚', shortcut: 'M' },
  { name: 'lasso', icon: '⌇', shortcut: 'A' },
  { name: 'eyedropper', icon: '💉', shortcut: 'I' },
  { name: 'text', icon: 'T', shortcut: 'T' },
  { name: 'line', icon: '╱', shortcut: 'L' },
  { name: 'rectangle', icon: '□', shortcut: 'R' },
  { name: 'ellipse', icon: '○', shortcut: 'O' },
  { name: 'roundedRect', icon: '▢', shortcut: 'U' },
  { name: 'polygon', icon: '⬡', shortcut: 'P' },
  { name: 'curve', icon: '〰', shortcut: 'C' },
];
```

### Toolbar Button Structure

Each button:

- Element: `<button class="toolbar-btn" data-tool="toolName" title="ToolName (Shortcut)">icon</button>`
- Active state: `toolbar-btn active` class
- Event: `pointerdown` → `selectTool(name)` → callback

### API

- `onToolChange(callback)` — register tool change callback
- `selectTool(name)` — programmatically select tool
- `getActiveTool()` — get current active tool name

---

## 9. ShapeTool (`src/renderer/tools/ShapeTool.ts`)

### Shape Types

```typescript
type ShapeType = 'line' | 'rectangle' | 'ellipse' | 'roundedRect' | 'polygon';
type ShapeMode = 'stroke' | 'fill' | 'strokeAndFill';
```

### Properties

- `shapeType: ShapeType` — current shape (default 'rectangle')
- `shapeMode: ShapeMode` — stroke/fill/both (default 'stroke')
- `lineWidth: number` — stroke width (default 2)
- `color: string` — stroke color (default '#000000')
- `fillColor: string` — fill color (default '#000000')
- `cornerRadius: number` — for rounded rects (default 10)

### Drawing Logic

- **Non-polygon shapes** (line, rectangle, ellipse, roundedRect):
  - PointerDown → record start point, create overlay canvas
  - PointerMove → draw preview on overlay
  - PointerUp → draw final shape on main ctx, clear overlay
  - Shift key → constrain (square/circle/45° lines)

- **Polygon**:
  - Click to add vertices
  - Move shows dashed preview lines
  - Double-click or click near first vertex to finalize
  - Escape to cancel
  - First vertex highlighted with blue dot

### Overlay Canvas

- Created dynamically for live preview during drag
- Same size as main canvas
- `position: absolute`, `pointer-events: none`
- Appended to canvas container
- Removed on tool deactivate

### Constraint Logic

- Line: snaps to 45° increments
- Rectangle/Ellipse: constrains to square/circle (max of dx/dy)

---

## 10. Programmatic Canvas Interaction

### From Tests (Playwright)

```javascript
// Get canvas and context
const canvas = document.getElementById('paint-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const W = canvas.width;  // 1024
const H = canvas.height; // 768

// Draw directly
ctx.fillStyle = '#ff0000';
ctx.fillRect(100, 100, 200, 150);

// Export as PNG
canvas.toDataURL('image/png');
```

### Interacting via Toolbar Buttons

- Buttons have `data-tool` attribute and CSS class `toolbar-btn`
- Active tool has `active` class
- Can click via Playwright `Page.Click('[data-tool="rectangle"]')`

### Canvas Coordinate System

- Origin (0,0) at top-left
- Width: 1024, Height: 768 (default)
- Coordinates are in canvas pixels, not CSS pixels
- Zoom/pan handled by PaintEngine (transforms the DOM element, not the canvas content)

---

## 11. Package.json

### Key Scripts

- `npm run start` — Electron Forge dev server
- `npm run make` — Build distributable
- `npm run slow-test` — Start Vite server on 5174, run Playwright tests, cleanup

### Key Dependencies

- Electron 40.6.1
- TypeScript ~5.7.0
- Vite ^5.4.21
- Electron Forge ^7.11.1

### No Playwright in npm dependencies

Playwright is in the .NET test project (`Microsoft.Playwright.Xunit 1.58.0`), not in npm.

---

## 12. Key Architectural Notes

### Standalone Vite Dev Server for Testing

The Electron Forge Vite server on port 5173 is NOT accessible from external browsers. Tests use:

```bash
npx vite --config vite.renderer.config.ts --port 5174
```

### No `window.electronAPI` in Standalone Mode

When running standalone Vite (for testing), the Electron preload bridge is unavailable:

- File dialogs don't work
- Clipboard IPC doesn't work
- Menu events don't fire
- SVG export dialog doesn't work

The app checks `window.electronAPI?.` before calling these, so no errors occur.

### Drawing in Tests

Tests draw directly via `Page.EvaluateAsync()` with Canvas 2D API, bypassing the tool system entirely. This is more reliable than simulating pointer events.

### Canvas Save in Tests

```csharp
var dataUrl = await Page.EvaluateAsync<string>(@"() => {
    const canvas = document.getElementById('paint-canvas');
    return canvas.toDataURL('image/png');
}");
var base64Data = dataUrl.Split(',')[1];
var imageBytes = Convert.FromBase64String(base64Data);
await File.WriteAllBytesAsync(outputPath, imageBytes);
```

---

## Outstanding Questions

None — all research topics thoroughly covered.

## Next Research (Not Required)

- LayerManager implementation details (if needed for layer-aware tests)
- BrushTool implementation (if brush-specific testing needed)
- CSS layout details in `app.css` (if UI layout testing needed)
