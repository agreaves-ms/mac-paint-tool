# General Instructions

## Technology Stack

- **Runtime:** Electron (Electron Forge + Vite bundler)
- **Language:** TypeScript (strict mode)
- **Drawing Engine:** HTML5 Canvas 2D API with `willReadFrequently: true`
- **Pixel Manipulation:** `getImageData` / `putImageData` on `Uint8ClampedArray`
- **UI Widgets:** Plain HTML/CSS (no framework) — sliders, buttons, color inputs
- **Layout:** CSS Grid (toolbar left 48px, canvas center, property panel right 200px)
- **Build:** `npm run make` produces distributable via Electron Forge

## Architecture Conventions

### Tool Interface Pattern

All drawing tools implement the `Tool` interface from `tools/Tool.ts`:

```typescript
interface Tool {
  name: string;
  cursor: string;
  lineWidth: number;        // Bound to shared line size slider
  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onActivate?(): void;
  onDeactivate?(): void;
}
```

- Tools are standalone files — each tool manages its own drawing logic.
- Tools receive `PointerEvent` (not MouseEvent) for future pressure sensitivity.
- `lineWidth` is set by PropertyPanel's shared slider and applies to `ctx.lineWidth`.
- PaintEngine dispatches pointer events to the active tool.

### PaintEngine.ts — Central Coordinator

PaintEngine is the core engine class. It does NOT contain drawing logic — tools do. PaintEngine handles:

- Canvas initialization (`willReadFrequently: true`)
- Screen-to-canvas coordinate mapping (accounting for zoom/offset)
- Active tool management and pointer event dispatch
- Zoom/pan state
- File I/O (save/open/new document) via Electron IPC
- Layer routing (Plan 05 — routes drawing to active layer context)

**Warning:** PaintEngine accumulates responsibilities across plans. Prefer adding methods over refactoring existing ones.

### IPC Pattern (Electron)

- **Main process** (`main.ts`): `ipcMain.handle()` for file dialogs, clipboard
- **Preload** (`preload.ts`): `contextBridge.exposeInMainWorld('electronAPI', {...})`
- **Renderer**: `window.electronAPI.methodName()` — never access Node APIs directly

### Undo Strategy

`UndoManager` uses `ImageData` snapshot stack. Call `saveState()` before every destructive operation. Max 50 snapshots (~3MB each at 1024×768).

### Flood Fill Algorithm

Scanline queue-based (not recursive). Uses Euclidean RGBA color distance with configurable tolerance 0–255. Performance target: ~15ms on 1024×768. Use `pop()` not `shift()` for queue operations.

### Color Selection Algorithm

Full-canvas pixel scan with Euclidean distance against target color. Gradiance slider 0–255 controls match threshold. Marching ants overlay via separate canvas with `setLineDash` + `requestAnimationFrame`.

## Coding Conventions

- Use `PointerEvent` everywhere (not MouseEvent) for pressure sensitivity support
- Canvas dimensions via `canvas.width`/`canvas.height` attributes, not CSS
- Get context with `{ willReadFrequently: true }` for pixel manipulation
- Single-key tool shortcuts (B=brush, E=eraser, G=fill, W=selection, X=swap colors)
- Meta key shortcuts use `e.metaKey || e.ctrlKey` for cross-platform
- Skip shortcuts when `e.target instanceof HTMLInputElement`
- Checkerboard background for transparency via CSS on canvas container
- Dark mode via CSS variables + `prefers-color-scheme` media query
