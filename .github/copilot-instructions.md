# General Instructions

All state tracking, memory files, and context capturing files go into the .copilot-tracking/ folders.

Use files from .copilot-tracking/ to understand decisions made in this codebase.

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

## Testing with Playwright MCP

### Starting the App for Playwright

The Electron Forge Vite dev server (`npm run start`) is **not accessible** from an external browser. Playwright's Chromium cannot navigate to it — `page.goto` will timeout or abort because the Electron shell intercepts the renderer URL.

**Use a standalone Vite dev server instead:**
```bash
npx vite --config vite.renderer.config.ts --port 5174
```

- This serves the renderer HTML/CSS/JS on `http://localhost:5174` without the Electron shell.
- Port 5174 avoids conflicts with Electron Forge's port 5173.
- `window.electronAPI` (preload bridge) is **not available** in standalone mode — file dialogs, clipboard IPC, and menu event listeners will not work. Test canvas drawing and UI interactions only.

**Important**: Always stop vite and close down the Plawright MCP tool browser/session when ending a session and returning back to the user.

### Playwright MCP Tool Usage

**Navigation:**
- `mcp_microsoft_pla_browser_navigate` with `url: "http://localhost:5174"` to load the app.

**Inspecting the page:**
- `mcp_microsoft_pla_browser_snapshot` returns an accessible YAML tree of the DOM with `ref` IDs for each element.
- `mcp_microsoft_pla_browser_take_screenshot` requires `type: "png"` parameter — omitting `type` causes an "invalid input" error. Use `fullPage: true` for full-page captures.
- `mcp_microsoft_pla_browser_console_messages` to check for runtime errors.

**Interacting with elements:**
- `mcp_microsoft_pla_browser_click` with the `ref` from a snapshot to click buttons/tools.
- `mcp_microsoft_pla_browser_evaluate` to run JavaScript in the page context. Pass a `function` parameter as a string like `"() => { ... }"`.

**Drawing on the canvas:**
- Use `mcp_microsoft_pla_browser_evaluate` to call Canvas 2D API directly on `document.getElementById('paint-canvas')`.
- Pointer event-based drawing through `mcp_microsoft_pla_browser_drag` works but direct `ctx` drawing via `evaluate` is more reliable for complex shapes.

**Saving canvas output:**
- Trigger a download via `evaluate`: create an `<a>` element with `download` attribute and `canvas.toDataURL()` as href, then `.click()` it.
- Downloaded files land in `.playwright-mcp/` directory.
- Copy from `.playwright-mcp/` to the desired location with a shell command.

### Pitfalls to Avoid

1. **`page.goto` fails with Electron Forge dev server** — The Electron Forge Vite server on port 5173 serves content intended for the Electron renderer process. Navigating to it from Playwright causes `net::ERR_ABORTED` or infinite timeouts. Always use a standalone Vite server.
2. **`take_screenshot` requires `type` parameter** — Calling `mcp_microsoft_pla_browser_take_screenshot` without `type: "png"` (or `"jpeg"`) returns a validation error: "must have required property 'type'".
3. **Browser context race conditions** — If navigation fails or is aborted, subsequent Playwright calls may error with "Another browser context is being closed." Call `mcp_microsoft_pla_browser_close` first, then retry navigation.
4. **`run_code` syntax** — The `mcp_microsoft_pla_browser_run_code` tool expects an async function signature like `async (page) => { ... }`. Bare `const` declarations cause `SyntaxError: Unexpected token 'const'`.
5. **No `electronAPI` in standalone mode** — File save/open, clipboard, and menu IPC handlers depend on the Electron preload script. These are unavailable when testing via standalone Vite. Use canvas `toDataURL()` + download link pattern instead.
6. **`fill_form` expects `fields` array** — Don't pass a single `ref` + `value` directly. For sliders, use `evaluate` to set `.value` and dispatch an `input` event instead.
7. **`curl` to Vite dev server may hang** — The Vite dev server uses HTTP keep-alive and may not close connections promptly. Use `lsof -i :PORT` to verify the server is running instead of `curl`.
8. **Viewport size** — Default viewport may clip the canvas. Use `mcp_microsoft_pla_browser_resize` with `width: 1400, height: 1100` to ensure the full 1024×768 canvas is visible.
