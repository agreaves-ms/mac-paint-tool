# Layer & Brush Tool/Panel Conventions Research

## Research Status: Complete

## Research Topics

1. Project conventions from `copilot-instructions.md`
2. Instruction files in `.github/instructions/`
3. Existing tracking documents related to layers, brushes, and UI panels
4. Tool interface definition
5. Workspace configuration references

---

## 1. Applicable Conventions from `copilot-instructions.md`

### Technology Stack

- **Runtime:** Electron (Electron Forge + Vite bundler)
- **Language:** TypeScript (strict mode)
- **Drawing Engine:** HTML5 Canvas 2D API with `willReadFrequently: true`
- **Pixel Manipulation:** `getImageData` / `putImageData` on `Uint8ClampedArray`
- **UI Widgets:** Plain HTML/CSS (no framework) — sliders, buttons, color inputs
- **Layout:** CSS Grid (toolbar left 48px, canvas center, property panel right 200px)
- **Build:** `npm run make` via Electron Forge

### Tool Interface Pattern

All drawing tools implement the `Tool` interface from `tools/Tool.ts`:

- Tools are standalone files — each tool manages its own drawing logic.
- Tools receive `PointerEvent` (not MouseEvent) for future pressure sensitivity.
- `lineWidth` is set by PropertyPanel's shared slider and applies to `ctx.lineWidth`.
- PaintEngine dispatches pointer events to the active tool.
- **Color is NOT in the Tool interface** — each tool manages color as an ad-hoc property.

### PaintEngine.ts — Central Coordinator

- Does NOT contain drawing logic — tools do
- Routes drawing to active layer's context (post Plan 05)
- Accumulates responsibilities across plans; prefer adding methods over refactoring

### Undo Strategy

- `UndoManager` uses `ImageData` snapshot stack
- Call `saveState()` before every destructive operation
- Max 50 snapshots (~3MB each at 1024×768)

### Coding Conventions (Relevant to Layers/Brushes)

- Use `PointerEvent` everywhere (not MouseEvent) for pressure sensitivity support
- Canvas dimensions via `canvas.width`/`canvas.height` attributes, not CSS
- Get context with `{ willReadFrequently: true }` for pixel manipulation
- Single-key tool shortcuts: B=brush, E=eraser, G=fill, W=selection, X=swap colors
- Meta key shortcuts use `e.metaKey || e.ctrlKey` for cross-platform
- Skip shortcuts when `e.target instanceof HTMLInputElement`
- Dark mode via CSS variables + `prefers-color-scheme` media query

### IPC Pattern

- Main process (`main.ts`): `ipcMain.handle()`
- Preload (`preload.ts`): `contextBridge.exposeInMainWorld('electronAPI', {...})`
- Renderer: `window.electronAPI.methodName()` — never access Node APIs directly

---

## 2. Instruction Files Found

Only one instruction file exists in `.github/instructions/`:

| File | Description |
|------|-------------|
| `.github/instructions/commit-message.instructions.md` | Conventional commits with past-tense patterns. `feat` for features, `chore` for cleanup, `fix` for fixes, `docs` for docs. Behavior details over implementation details. Related changes grouped into one line item. |

No layer-specific or brush-specific instruction files exist.

---

## 3. Existing Tracking Documents Related to Layers/Brushes/Panels

### Plans

| Path | Relevance |
|------|-----------|
| `.copilot-tracking/plans/2026-02-26/plan-02-drawing-tools.instructions.md` | BrushTool first implementation (Step 2.3) — freehand drawing with `quadraticCurveTo`, line size slider |
| `.copilot-tracking/plans/2026-02-26/plan-05-layers-power.instructions.md` | Layer system impl (Step 6.1), brush presets (Step 6.4) — the main layers+brush power plan |
| `.copilot-tracking/plans/2026-02-26/plan-06-advanced.instructions.md` | Blend modes (Step 7.1), layer opacity (Step 7.2), pressure sensitivity (Step 7.3), custom brush engine (Step 7.4), symmetry drawing (Step 7.6) |
| `.copilot-tracking/plans/2026-03-02/color-picker-plan.instructions.md` | Enhanced color picker moved into property panel — affects brush color flow |

### Details

| Path | Relevance |
|------|-----------|
| `.copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md` | Layer architecture (stacked `<canvas>` elements, z-index), brush presets (opacity, hardness, preset library) |
| `.copilot-tracking/details/2026-02-26/plan-06-advanced-details.md` | Blend modes, layer opacity, pressure sensitivity, custom brush engine (BrushEngine.ts), symmetry drawing |

### Research

| Path | Relevance |
|------|-----------|
| `.copilot-tracking/research/subagents/2026-03-02/color-picker-brush-tool.md` | Comprehensive research on ColorPicker implementation, color flow to brush/tools, PropertyPanel details |
| `.copilot-tracking/research/2026-03-02/color-picker-improvement-research.md` | Color picker UX improvements, move to property panel analysis |

### Reviews/Validations

| Path | Relevance |
|------|-----------|
| `.copilot-tracking/reviews/rpi/2026-02-26/plan-05-layers-power-001-validation.md` | Validation of layer implementation |
| `.copilot-tracking/reviews/rpi/2026-02-26/plan-06-advanced-001-validation.md` | Validation of blend modes, layer opacity, brush engine, pressure sensitivity |

### Memory

| Path | Relevance |
|------|-----------|
| `.copilot-tracking/memory/2026-02-27/playwright-cat-drawing-memory.md` | Brush tool ref IDs for Playwright, brush presets (Pencil/Marker/Airbrush/Watercolor), PropertyPanel slider controls |

---

## 4. Tool Interface Definition

**File:** `src/renderer/tools/Tool.ts`

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

**Key observations:**

- No `color` property — each tool implements color independently
- `lineWidth` is bound to PropertyPanel's shared slider
- Lifecycle hooks `onActivate`/`onDeactivate` are optional
- Tools receive the active layer's `ctx` from PaintEngine

---

## 5. Layer Interface Definition

**File:** `src/renderer/canvas/LayerManager.ts`

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

---

## 6. BrushEngine Interface & Presets

**File:** `src/renderer/tools/BrushEngine.ts`

```typescript
export interface BrushEnginePreset {
  name: string;
  spacing: number;
  scatter: number;
  rotation: number;
  size: number;
}
```

BrushEngine manages:

- Brush tip (default 32px circular, or loaded from image)
- Spacing, scatter, rotation, size parameters
- Stamp-based rendering along stroke path
- Accumulator for consistent spacing between stamps

---

## 7. UI Panel Mounting Pattern

Both LayerPanel and BrushPresetPanel are mounted into `#property-panel` from `app.ts`:

```typescript
// app.ts (lines 485, 488)
new LayerPanel(document.getElementById('property-panel')!, layerManager);
new BrushPresetPanel(document.getElementById('property-panel')!, brushEngine);
```

**Panel conventions from code:**

- Panels receive `(container: HTMLElement, dataSource)` in constructor
- Use `.prop-label` CSS class for section headers
- Use `.layer-actions` CSS class for button groups
- Use `.layer-action-btn` CSS class for action buttons
- Use `.layer-list` CSS class for scrollable list containers
- Use `.layer-item` CSS class for list items
- Panels use `pointerdown` events (not `click`) with `e.preventDefault()`

---

## 8. Color Flow Architecture

Colors are distributed from ColorPicker to tools manually in `app.ts`:

```typescript
colorPicker.onChange((fg, bg) => {
  brushTool.color = fg;
  shapeTool.color = fg;
  shapeTool.fillColor = fg;
  textTool.color = fg;
  curveTool.color = fg;
  gradientTool.foregroundColor = fg;
  gradientTool.backgroundColor = bg;
  // FillTool uses RGBA object
  fillTool.fillColor = { r, g: g_val, b, a: 255 };
});
```

- No centralized color store or event bus
- Duplicate distribution in `colorPicker.onChange` and `eyedropperTool.onColorSampled`
- BrushTool parses hex to RGB for soft-edge radial gradients

---

## 9. Workspace Configuration References

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript strict mode config |
| `vite.renderer.config.ts` | Vite bundler config for renderer process |
| `vite.main.config.ts` | Vite bundler config for main process |
| `vite.preload.config.ts` | Vite bundler config for preload script |
| `forge.config.ts` | Electron Forge config |
| `package.json` | Dependencies and scripts |
| `playwright.config.ts` | Playwright test config |

---

## Next Research (Not Required for Current Task)

- [ ] Full BrushTool.ts source analysis (stamp logic, pressure mapping, symmetry)
- [ ] Full LayerManager.ts methods (compositing loop, flatten, merge)
- [ ] PropertyPanel.ts full source (slider creation pattern, tool-specific controls)
- [ ] app.ts full wiring (all tool instantiation and event binding)
