<!-- markdownlint-disable-file -->
# Implementation Details: Plan 02 — P0 Core Drawing Tools

## Context Reference

* Source plan: `.copilot-tracking/plans/2026-02-26/plan-02-drawing-tools.instructions.md`
* Predecessor: Plan 01 — Foundation and Canvas Engine
* Research: `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md`
* Strategy: `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` (Lines 158–192)

## Implementation Phase 1: P0 Drawing Tools

### Step 2.3: Implement BrushTool.ts

Freehand drawing tool using `quadraticCurveTo` for smooth strokes.

Key implementation:
- On `pointerdown`: begin path, `ctx.moveTo()`, save start point, apply `lineWidth` from slider
- On `pointermove`: use `quadraticCurveTo()` with midpoints for smooth curves (not `lineTo` which produces jagged lines)
- On `pointerup`: end path, trigger undo snapshot
- Set `ctx.lineCap = 'round'` and `ctx.lineJoin = 'round'` for smooth stroke endings
- Set `ctx.lineWidth` from tool's `lineWidth` property (bound to slider)
- Set `ctx.strokeStyle` from current foreground color

Smoothing algorithm:
```typescript
// For each pair of points, draw a curve to the midpoint
const midX = (prevX + currX) / 2;
const midY = (prevY + currY) / 2;
ctx.quadraticCurveTo(prevX, prevY, midX, midY);
```

Files:
* `src/renderer/tools/BrushTool.ts` — Brush tool implementation

Success criteria:
* Freehand strokes appear smooth (not jagged)
* Stroke width matches the line size slider value
* Stroke color matches the foreground color

Context references:
* mac-paint-app-features-research.md (Lines 487-490) — Brush tool with quadraticCurveTo smoothing
* html5-canvas-patterns-research.md — Stroke smoothing patterns

Dependencies:
* Step 2.2 completion (Tool interface from Plan 01)

### Step 2.4: Implement EraserTool.ts

Eraser tool using `globalCompositeOperation: 'destination-out'` to erase to transparency.

Key implementation:
- Same stroke mechanics as BrushTool (smooth curves via `quadraticCurveTo`)
- Before stroke: `ctx.globalCompositeOperation = 'destination-out'`
- After stroke: restore `ctx.globalCompositeOperation = 'source-over'`
- `ctx.lineWidth` from tool's `lineWidth` property (bound to slider)
- Cursor should show a circle matching the current eraser size

Files:
* `src/renderer/tools/EraserTool.ts` — Eraser tool implementation

Success criteria:
* Eraser removes pixels to transparency (not white)
* Eraser size matches line size slider
* Canvas compositing mode is properly restored after erasing

Context references:
* mac-paint-app-features-research.md (Lines 491-491) — Eraser with destination-out

Dependencies:
* Step 2.3 completion (shares smoothing logic)

### Step 2.5: Implement ShapeTool.ts

Shape drawing tool supporting line, rectangle, and ellipse with stroke/fill toggle.

Key implementation:
- On `pointerdown`: record start point
- On `pointermove`: draw shape preview on a temporary overlay (clear and redraw each move)
- On `pointerup`: commit shape to main canvas, trigger undo snapshot
- Shape types: `line`, `rectangle`, `ellipse`
- Mode toggle: `stroke`, `fill`, `strokeAndFill`
- Hold Shift for constrained proportions (square, circle, 45° line)
- `ctx.lineWidth` from tool's `lineWidth` property for all stroke operations
- Use `ctx.strokeRect()`, `ctx.fillRect()` for rectangles
- Use `ctx.ellipse()` for ellipses
- Use `ctx.moveTo()`/`ctx.lineTo()` for lines

Shape preview strategy: Use a temporary canvas overlay (same size, positioned on top) for the preview. On `pointerup`, draw the final shape on the main canvas and clear the overlay.

Files:
* `src/renderer/tools/ShapeTool.ts` — Shape tool implementation

Success criteria:
* Line, rectangle, and ellipse draw correctly
* Shift-constrain produces perfect squares, circles, and 45° lines
* Line width matches slider value
* Stroke/fill toggle works correctly

Context references:
* mac-paint-app-features-research.md (Lines 492-492) — Shape tools with line size slider
* html5-canvas-patterns-research.md — Shape drawing patterns

Dependencies:
* Step 2.2 completion (Tool interface from Plan 01)

### Step 2.6: Implement FloodFill.ts and FillTool.ts

#### FloodFill.ts — Scanline Queue-Based Flood Fill Algorithm

Standalone algorithm module implementing scanline queue-based flood fill with configurable tolerance parameter.

Algorithm:
1. Read pixel color at click point using `getImageData()`
2. Create `Uint8Array` visited flags (canvas width × height)
3. Initialize queue with click point
4. For each point in queue:
   a. Scan left and right to find scanline boundaries (matching pixels within tolerance)
   b. Fill the scanline with the fill color
   c. Check row above and below for new fill seeds
   d. Add unfilled matching pixels above/below to queue
5. `putImageData()` the modified pixel data back to canvas

Color tolerance using Euclidean distance:
```typescript
function colorDistance(r1: number, g1: number, b1: number, a1: number,
                      r2: number, g2: number, b2: number, a2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2 + (a1 - a2) ** 2);
}
// tolerance 0 = exact match, tolerance 255 = very liberal
// Max distance ≈ 510 (√(255²×4))
```

Performance target: ~15ms on 1024×768 canvas.

Use `pop()` (not `shift()`) for queue operations — `shift()` is O(n) on arrays.

Files:
* `src/renderer/canvas/FloodFill.ts` — Flood fill algorithm

Discrepancy references:
* DD-06 (DR-06): Uses Euclidean RGB distance instead of perceptual weighting — standard and sufficient

Success criteria:
* Flood fill colors contiguous regions correctly
* Tolerance 0 fills only exact color matches
* Tolerance 32 fills through anti-aliased edges
* Performance: <20ms on 1024×768
* No stack overflow on large uniform regions

Context references:
* mac-paint-app-features-research.md (Lines 343-366) — Scanline flood fill algorithm
* html5-canvas-patterns-research.md — Complete flood fill implementation

#### FillTool.ts — Tool Interface Wrapper

Thin wrapper implementing the Tool interface from Plan 01, delegating fill logic to FloodFill.ts.

Key implementation:
- Implements `Tool` interface (`onPointerDown`, `onPointerMove`, `onPointerUp`)
- `onPointerDown`: call `FloodFill.fill(ctx, x, y, fillColor, tolerance)` then trigger undo snapshot
- `onPointerMove`: no-op (fill is a single-click operation)
- `onPointerUp`: no-op
- Tolerance property exposed for PropertyPanel's tolerance slider binding

Files:
* `src/renderer/tools/FillTool.ts` — Fill tool wrapper implementing Tool interface

Success criteria:
* FillTool integrates with tool switching system from Plan 01
* Click triggers flood fill with current foreground color and tolerance setting
* Undo snapshot captured after fill operation

Dependencies:
* Step 2.1 (PaintEngine provides canvas context — from Plan 01)

### Step 2.7: Implement ColorSelection.ts

Full-canvas pixel scan selecting all pixels matching a target color within a configurable gradiance/tolerance range.

Algorithm:
1. On click: read target pixel color using `getImageData(x, y, 1, 1)`
2. Read full canvas `ImageData`
3. Create selection mask: `Uint8Array(width * height)` — 1 = selected, 0 = not
4. Iterate all pixels, compute Euclidean color distance to target
5. If distance ≤ gradiance slider value → mark as selected in mask
6. Render marching ants on selection boundary

Gradiance slider: `<input type="range" min="0" max="255" value="32">` in property panel.

Marching ants overlay:
- Separate overlay `<canvas>` positioned on top of main canvas
- Trace selection boundary using edge detection on the binary mask
- Draw boundary path with `setLineDash([4, 4])` and animated `lineDashOffset`
- Use `requestAnimationFrame` to animate the dash offset

Performance target: <30ms for full-canvas scan on 4K (3840×2160).

Files:
* `src/renderer/canvas/ColorSelection.ts` — Color-tolerance selection algorithm

Success criteria:
* Clicking a pixel selects all matching pixels within gradiance threshold
* Gradiance 0 selects only exact color matches
* Gradiance 255 selects nearly everything
* Marching ants animate around selection boundary
* Selection mask is available for copy/cut/delete operations

Context references:
* mac-paint-app-features-research.md (Lines 368-395) — Color-tolerance selection with marching ants
* html5-canvas-patterns-research.md — Selection and marching ants implementation

Dependencies:
* Step 2.1 completion (PaintEngine provides canvas — from Plan 01)

### Step 2.8: Implement UndoManager.ts

Canvas state snapshot stack supporting 50+ undo/redo levels.

Implementation:
- `undoStack: ImageData[]` — snapshots before each operation
- `redoStack: ImageData[]` — snapshots for redo
- `saveState()`: push current `ctx.getImageData(0, 0, w, h)` onto undoStack; clear redoStack
- `undo()`: push current state to redoStack; pop undoStack; `ctx.putImageData()` to canvas
- `redo()`: push current state to undoStack; pop redoStack; `ctx.putImageData()` to canvas
- Max history: 50 snapshots (configurable). When exceeding max, drop oldest from undoStack.
- Memory consideration: 1024×768×4 = ~3MB per snapshot. 50 snapshots = ~150MB. Acceptable for modern systems.

Call `saveState()` before every destructive operation (brush stroke start, fill, shape commit, etc.).

Files:
* `src/renderer/canvas/UndoManager.ts` — Undo/redo state management

Success criteria:
* Undo reverses the last operation immediately
* Redo reapplies an undone operation
* 50+ undo levels are preserved
* New operations after undo clear the redo stack

Context references:
* mac-paint-app-features-research.md (Lines 495-495) — Undo/Redo snapshot stack

Dependencies:
* Step 2.1 completion (PaintEngine provides canvas — from Plan 01)

### Step 2.9: Validate Phase 2

Run `npm start` and manually test all P0 drawing tools.

Manual test checklist:
- Brush draws smooth freehand strokes at various line sizes
- Eraser removes pixels to transparency
- Shapes draw correctly with line size slider (line, rectangle, ellipse)
- Paint bucket fills contiguous regions with tolerance slider
- Color-tolerance selection highlights matching pixels with marching ants
- Undo/redo works through all operations (50+ levels)

Validation commands:
* `npx tsc --noEmit` — TypeScript compilation check
* `npm start` — Visual verification of all tools
