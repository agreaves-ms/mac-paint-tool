<!-- markdownlint-disable-file -->
# Implementation Details: Plan 01 — Foundation and Canvas Engine

## Context Reference

Sources: `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md`, `.copilot-tracking/research/subagents/2026-02-26/cross-platform-framework-research.md`, `.copilot-tracking/research/subagents/2026-02-26/html5-canvas-patterns-research.md`

## Implementation Phase 1: Project Scaffold & Electron Shell

<!-- parallelizable: false -->

### Step 1.1: Bootstrap Electron + Vite + TypeScript project

Run the Electron Forge scaffolding command to create the project with Vite + TypeScript template.

```bash
cd /Users/allengreaves/projects/agreaves-ms/mac-paint-tool
npm init electron-app@latest . -- --template=vite-typescript
```

If the directory is not empty (contains `.copilot-tracking/`), bootstrap in a temp directory and move files, or use `--force` if available.

After scaffolding, verify the default app launches:
```bash
npm start
```

Files:
* `package.json` — Project manifest with Electron Forge scripts
* `forge.config.ts` — Electron Forge build configuration
* `tsconfig.json` — TypeScript configuration
* `vite.main.config.ts` — Vite config for main process
* `vite.renderer.config.ts` — Vite config for renderer process
* `vite.preload.config.ts` — Vite config for preload script

Success criteria:
* `npm start` launches a default Electron window
* `npx tsc --noEmit` passes with no errors

Context references:
* mac-paint-app-features-research.md (Lines 591-598) — Bootstrap commands

Dependencies:
* Node.js 18+ installed
* npm available

### Step 1.2: Configure project structure

Create the directory structure recommended by the research. Restructure the default scaffold into the paint app architecture.

Create directories:
```
src/
├── main.ts                    (exists from scaffold — modify)
├── preload.ts                 (exists from scaffold — modify)
├── renderer/
│   ├── index.html             (exists from scaffold — move/modify)
│   ├── app.ts                 (create — app entry point)
│   ├── canvas/
│   │   ├── PaintEngine.ts     (create)
│   │   ├── FloodFill.ts       (create)
│   │   ├── ColorSelection.ts  (create)
│   │   └── UndoManager.ts     (create)
│   ├── tools/
│   │   ├── Tool.ts            (create — interface)
│   │   ├── BrushTool.ts       (create)
│   │   ├── EraserTool.ts      (create)
│   │   ├── FillTool.ts        (create)
│   │   ├── SelectionTool.ts   (create)
│   │   ├── ShapeTool.ts       (create)
│   │   └── TextTool.ts        (create — Phase 4)
│   ├── ui/
│   │   ├── Toolbar.ts         (create)
│   │   ├── ColorPicker.ts     (create)
│   │   └── PropertyPanel.ts   (create)
│   └── styles/
│       └── app.css            (create)
└── shared/
    └── types.ts               (create — shared type definitions)
```

Files:
* `src/main.ts` — Modify to set window size, title, and menu
* `src/preload.ts` — Modify to expose file I/O APIs via contextBridge
* `src/renderer/index.html` — Modify for paint app layout
* `src/shared/types.ts` — Create with shared type definitions (Color, Point, ToolType, etc.)

Success criteria:
* Directory structure matches the plan
* TypeScript compiles without errors

Context references:
* mac-paint-app-features-research.md (Lines 605-635) — Project structure

Dependencies:
* Step 1.1 completion

### Step 1.3: Set up main HTML layout

Create the main HTML layout with canvas container, toolbar sidebar, and property panel areas.

Layout structure:
```html
<div id="app">
  <div id="toolbar"><!-- Tool buttons --></div>
  <div id="canvas-container">
    <canvas id="paint-canvas"></canvas>
  </div>
  <div id="property-panel"><!-- Tool options: line size, tolerance --></div>
  <div id="color-panel"><!-- Color picker, fg/bg --></div>
  <div id="status-bar"><!-- Cursor pos, zoom, canvas size --></div>
</div>
```

CSS layout: Use CSS Grid or Flexbox for the main layout. Toolbar on left, canvas center, property panel on right or top.

Files:
* `src/renderer/index.html` — Main HTML with layout structure
* `src/renderer/styles/app.css` — Base layout CSS (grid, sizing, scrolling)

Success criteria:
* HTML layout renders in Electron window
* Canvas element is visible and fills the center area
* Toolbar and property panel areas are visible

Context references:
* mac-paint-app-features-research.md (Lines 605-635) — Project structure
* html5-canvas-patterns-research.md — Canvas setup patterns

Dependencies:
* Step 1.2 completion

### Step 1.4: Validate scaffold

Run `npm start` and verify the Electron window opens with the canvas layout visible.

Validation commands:
```bash
npx tsc --noEmit
npm start
```

Success criteria:
* `npx tsc --noEmit` passes with no errors
* `npm start` launches Electron window with canvas layout visible

Dependencies:
* Step 1.3 completion

## Implementation Phase 2: Core Canvas Engine

<!-- parallelizable: false -->

### Step 2.1: Implement PaintEngine.ts

Core canvas drawing engine handling initialization, coordinate mapping, and the rendering loop.

```typescript
// Key responsibilities:
// - Initialize canvas with configurable width/height
// - Map screen coordinates to canvas coordinates (accounting for zoom/offset)
// - Manage active tool state
// - Handle pointer events (pointerdown, pointermove, pointerup)
// - Coordinate with UndoManager for state snapshots
// - Render loop for overlay effects (marching ants, cursor preview)
```

Key implementation details:
- Use `PointerEvent` (not MouseEvent) for future pressure sensitivity support
- Canvas sizing: set `canvas.width`/`canvas.height` attributes (not CSS) for correct pixel resolution
- Get 2D context with `{ willReadFrequently: true }` for pixel manipulation performance
- Maintain current tool reference, delegate pointer events to active tool
- Store canvas context and pass to tools

```typescript
export class PaintEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeTool: Tool | null = null;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.activeTool) {
      this.activeTool.onPointerDown(e, this.ctx);
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activeTool) {
      this.activeTool.onPointerMove(e, this.ctx);
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.activeTool) {
      this.activeTool.onPointerUp(e, this.ctx);
    }
  }

  setActiveTool(tool: Tool): void {
    if (this.activeTool) {
      this.activeTool.onDeactivate?.();
    }
    this.activeTool = tool;
    this.canvas.style.cursor = tool.cursor;
    tool.onActivate?.();
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  // Map screen coordinates to canvas coordinates
  mapCoordinates(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
```

Files:
* `src/renderer/canvas/PaintEngine.ts` — Core drawing engine class

Success criteria:
* PaintEngine initializes canvas with specified dimensions
* Pointer events are captured and delegated to active tool
* Coordinate mapping accounts for canvas offset in the layout

Context references:
* html5-canvas-patterns-research.md — Canvas initialization, coordinate mapping
* mac-paint-app-features-research.md (Lines 640-660) — Architecture description

Dependencies:
* Phase 1 completion

### Step 2.2: Implement Tool interface with lineWidth property

Define the `Tool` interface that all drawing tools implement. The interface includes a `lineWidth` property bound to the shared line size slider.

```typescript
interface Tool {
  name: string;
  cursor: string;
  lineWidth: number;        // From shared line size slider
  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onActivate?(): void;      // Called when tool becomes active
  onDeactivate?(): void;    // Called when switching away from tool
}
```

The `lineWidth` property is set by the PropertyPanel's line size slider and applies to `ctx.lineWidth` before any stroke operation. All tools that draw strokes MUST read from this property.

Add shared types to `src/shared/types.ts`:

```typescript
export enum ToolType {
  Brush = 'brush',
  Eraser = 'eraser',
  Fill = 'fill',
  Selection = 'selection',
  Shape = 'shape',
  Text = 'text',
  Eyedropper = 'eyedropper',
}

export interface Point {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}
```

Files:
* `src/renderer/tools/Tool.ts` — Tool interface definition
* `src/shared/types.ts` — Add `ToolType` enum, `Point`, `Color` types

Success criteria:
* Tool interface defined with lineWidth property
* Shared types defined for use across tools
* TypeScript compiles without errors

Context references:
* mac-paint-app-features-research.md (Lines 396-410) — Line Size Slider core requirement

Dependencies:
* Step 2.1 completion
