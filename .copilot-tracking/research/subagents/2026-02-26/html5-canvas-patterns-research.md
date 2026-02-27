# HTML5 Canvas Paint App Implementation Patterns Research

## Status: Complete

## Research Topics

1. Canvas API capabilities for paint app features
2. Flood fill algorithm with color tolerance
3. Color-tolerance selection (gradiance slider)
4. Line width control across all tools
5. Layer patterns using multiple canvases
6. Library comparison: vanilla Canvas vs Fabric.js vs Konva.js
7. Code examples for key implementations
8. Open-source HTML5 paint app references

---

## 1. Canvas API Capabilities for Paint App Features

### Core API Surface (CanvasRenderingContext2D)

The HTML5 Canvas 2D context provides all primitives needed for a paint application:

**Drawing Primitives:**

- **Rectangles:** `fillRect()`, `strokeRect()`, `clearRect()`
- **Paths:** `beginPath()`, `moveTo()`, `lineTo()`, `arc()`, `ellipse()`, `rect()`, `roundRect()`, `bezierCurveTo()`, `quadraticCurveTo()`
- **Path rendering:** `fill()`, `stroke()`, `clip()`
- **Text:** `fillText()`, `strokeText()`, `measureText()`
- **Images:** `drawImage()` — supports image, canvas, and video sources

**Styling:**

- `fillStyle` / `strokeStyle` — accepts color string, gradient, or pattern
- `lineWidth` — line thickness (default 1.0)
- `lineCap` — `butt` (default), `round`, `square`
- `lineJoin` — `miter` (default), `round`, `bevel`
- `globalAlpha` — transparency (0.0 – 1.0)
- `globalCompositeOperation` — blending modes (source-over, destination-out for eraser, etc.)
- `shadowBlur`, `shadowColor`, `shadowOffsetX/Y` — shadow effects

**Pixel Manipulation (critical for flood fill and selection):**

- `getImageData(sx, sy, sw, sh)` — returns `ImageData` object with `Uint8ClampedArray` of RGBA pixel data
- `putImageData(imageData, dx, dy)` — writes pixel data back to canvas
- `createImageData(w, h)` — creates blank ImageData
- ImageData.data is a flat array: `[R, G, B, A, R, G, B, A, ...]` with 4 bytes per pixel
- Pixel at (x, y) is at index `(y * width + x) * 4`

**State Management:**

- `save()` / `restore()` — push/pop drawing state stack (styles, transforms, clip)
- `getTransform()` / `setTransform()` — matrix transforms
- `reset()` — resets entire context

**Compositing:**

- `globalCompositeOperation` values relevant for paint apps:
  - `source-over` (default) — draw on top
  - `destination-out` — eraser effect (removes pixels where you draw)
  - `source-atop` — draw only on existing content
  - `multiply`, `screen`, `overlay` — blend modes

### Browser Support

All core Canvas 2D APIs have **universal browser support** (Chrome 1+, Firefox 1.5+, Safari 2+, Edge 12+). The `getImageData`/`putImageData` APIs needed for flood fill are supported since Chrome 2, Firefox 2, Safari 4.

---

## 2. Flood Fill Algorithm (Paint Bucket)

### Algorithm Overview

Flood fill on an HTML5 Canvas operates on raw pixel data via `getImageData`/`putImageData`. The recommended approach is a **scanline flood fill** using a queue, which is significantly faster than recursive approaches (no stack overflow risk, better cache locality).

### Implementation Approach: Queue-Based Scanline Flood Fill

```javascript
function floodFill(ctx, startX, startY, fillColor, tolerance = 0) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Get target color at click point
  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // Parse fill color to RGBA
  const [fillR, fillG, fillB, fillA] = parseColor(fillColor);

  // Early exit: if target color matches fill color
  if (colorsMatch(targetR, targetG, targetB, targetA, fillR, fillG, fillB, fillA, 0)) {
    return;
  }

  // Color matching with tolerance (Euclidean distance in RGBA space)
  function matchesTarget(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    const distance = Math.sqrt(
      (r - targetR) ** 2 +
      (g - targetG) ** 2 +
      (b - targetB) ** 2 +
      (a - targetA) ** 2
    );
    return distance <= tolerance;
  }

  function setPixel(idx) {
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = fillA;
  }

  // Scanline flood fill with queue
  const visited = new Uint8Array(width * height);
  const queue = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const pixelIdx = y * width + x;

    if (visited[pixelIdx]) continue;

    // Scan left
    let lx = x;
    while (lx >= 0 && matchesTarget((y * width + lx) * 4) && !visited[y * width + lx]) {
      lx--;
    }
    lx++;

    // Scan right
    let rx = x;
    while (rx < width && matchesTarget((y * width + rx) * 4) && !visited[y * width + rx]) {
      rx++;
    }
    rx--;

    // Fill the span and check rows above and below
    for (let xi = lx; xi <= rx; xi++) {
      const idx = (y * width + xi) * 4;
      setPixel(idx);
      visited[y * width + xi] = 1;

      // Check pixel above
      if (y > 0 && !visited[(y - 1) * width + xi] && matchesTarget(((y - 1) * width + xi) * 4)) {
        queue.push([xi, y - 1]);
      }
      // Check pixel below
      if (y < height - 1 && !visited[(y + 1) * width + xi] && matchesTarget(((y + 1) * width + xi) * 4)) {
        queue.push([xi, y + 1]);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
```

### Color Tolerance (Gradiance)

The tolerance parameter uses **Euclidean distance in RGBA space**:

```javascript
function colorDistance(r1, g1, b1, a1, r2, g2, b2, a2) {
  return Math.sqrt(
    (r1 - r2) ** 2 +
    (g1 - g2) ** 2 +
    (b1 - b2) ** 2 +
    (a1 - a2) ** 2
  );
}
// Max possible distance in RGBA: sqrt(255^2 * 4) ≈ 510
// Typical tolerance slider range: 0 (exact match) to 128 (very liberal)
```

Alternative: **weighted RGB distance** (human perception):

```javascript
function perceptualDistance(r1, g1, b1, r2, g2, b2) {
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}
```

### Performance Considerations

- **Canvas size impact:** `getImageData` on a 1920×1080 canvas = ~8.3 MB of pixel data. Scanline approach processes efficiently.
- **Use `Uint8Array` for visited flags** instead of `Set` — much faster for large canvases.
- **Use `pop()` instead of `shift()`** for the queue (avoid array shifting cost). Or use a typed array ring buffer.
- **OffscreenCanvas + Web Worker:** For very large canvases, run flood fill in a Web Worker with `OffscreenCanvas` to avoid UI blocking.
- **Optimization: skip `Math.sqrt`** by comparing squared distances when exact threshold isn't needed.

---

## 3. Color-Tolerance Selection Tool

### Concept

Select all pixels on the canvas that match a target color within a configurable tolerance range. This creates a selection mask that can be used for operations (delete, recolor, cut/copy).

### Implementation Approach

```javascript
function selectByColor(ctx, targetX, targetY, tolerance = 0) {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Get target color from click point
  const idx = (targetY * width + targetX) * 4;
  const tR = data[idx], tG = data[idx + 1], tB = data[idx + 2], tA = data[idx + 3];

  // Create selection mask (1 = selected, 0 = not selected)
  const selectionMask = new Uint8Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    const distance = Math.sqrt(
      (data[i] - tR) ** 2 +
      (data[i + 1] - tG) ** 2 +
      (data[i + 2] - tB) ** 2 +
      (data[i + 3] - tA) ** 2
    );
    if (distance <= tolerance) {
      selectionMask[i / 4] = 1;
    }
  }

  return selectionMask;
}
```

### Visual Feedback: Marching Ants

Marching ants (animated dashed border around selection) requires:

1. **Edge detection** on the selection mask — find pixels where selected meets unselected
2. **Animated rendering** using `setLineDash()` with animated `lineDashOffset`

```javascript
function drawMarchingAnts(ctx, selectionMask, width, height, offset) {
  // Draw selection overlay on a separate canvas
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = offset; // Animate this value over time
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // Trace edges of the selection mask
  // (use contour tracing algorithm on the mask)
  // Simplified: draw rect around each selected region
  ctx.restore();
}

// Animate with requestAnimationFrame
let antOffset = 0;
function animateAnts() {
  antOffset = (antOffset + 1) % 8;
  drawMarchingAnts(overlayCtx, selectionMask, width, height, antOffset);
  requestAnimationFrame(animateAnts);
}
```

### Tolerance Slider UI

```html
<label for="tolerance">Color Tolerance: <span id="tolValue">32</span></label>
<input type="range" id="tolerance" min="0" max="255" value="32"
       oninput="document.getElementById('tolValue').textContent = this.value">
```

---

## 4. Line Width Control

### Canvas lineWidth Property

`ctx.lineWidth` sets the thickness of strokes. It applies to all subsequent `stroke()`, `strokeRect()`, `strokeText()` calls until changed.

```javascript
// Apply line width from slider
const slider = document.getElementById('lineSize');
slider.addEventListener('input', (e) => {
  ctx.lineWidth = parseInt(e.target.value, 10);
  updatePreview(); // Show preview circle/line of current size
});
```

### Applying to Different Tools

```javascript
// Pencil/Brush — freehand drawing
function drawBrushStroke(points, lineWidth) {
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    // Use quadratic curves for smooth lines
    const midX = (points[i - 1].x + points[i].x) / 2;
    const midY = (points[i - 1].y + points[i].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, midX, midY);
  }
  ctx.stroke();
}

// Shapes — rect, ellipse, line
function drawRectangle(x, y, w, h, lineWidth, fillColor, strokeColor) {
  ctx.lineWidth = lineWidth;
  if (fillColor) { ctx.fillStyle = fillColor; ctx.fillRect(x, y, w, h); }
  if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.strokeRect(x, y, w, h); }
}

// Eraser — uses destination-out composite or white color
function eraseStroke(points, lineWidth) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}
```

### Brush Size Preview

Show a circle cursor matching the current brush size:

```javascript
function updateCursorPreview(canvas, size) {
  const radius = size / 2;
  const cursorCanvas = document.createElement('canvas');
  cursorCanvas.width = size + 2;
  cursorCanvas.height = size + 2;
  const cursorCtx = cursorCanvas.getContext('2d');
  cursorCtx.beginPath();
  cursorCtx.arc(radius + 1, radius + 1, radius, 0, Math.PI * 2);
  cursorCtx.strokeStyle = 'black';
  cursorCtx.lineWidth = 1;
  cursorCtx.stroke();
  canvas.style.cursor = `url(${cursorCanvas.toDataURL()}) ${radius + 1} ${radius + 1}, crosshair`;
}
```

---

## 5. Layer Patterns

### Multiple Stacked Canvases

The standard pattern for layers in HTML5 paint apps uses **multiple `<canvas>` elements stacked with CSS**:

```html
<div id="canvas-container" style="position: relative; width: 800px; height: 600px;">
  <canvas id="layer-0" width="800" height="600"
          style="position: absolute; top: 0; left: 0; z-index: 0;"></canvas>
  <canvas id="layer-1" width="800" height="600"
          style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas>
  <!-- Overlay canvas for selection UI, marching ants, tool preview -->
  <canvas id="overlay" width="800" height="600"
          style="position: absolute; top: 0; left: 0; z-index: 100; pointer-events: none;"></canvas>
  <!-- Interaction canvas captures mouse events -->
  <canvas id="interaction" width="800" height="600"
          style="position: absolute; top: 0; left: 0; z-index: 200;"></canvas>
</div>
```

### Layer Management Logic

```javascript
class LayerManager {
  constructor(container, width, height) {
    this.container = container;
    this.width = width;
    this.height = height;
    this.layers = [];
    this.activeLayerIndex = 0;
  }

  addLayer(name) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.cssText = 'position:absolute;top:0;left:0;';
    canvas.style.zIndex = this.layers.length;
    this.container.appendChild(canvas);
    this.layers.push({
      canvas,
      ctx: canvas.getContext('2d'),
      name: name || `Layer ${this.layers.length}`,
      visible: true,
      opacity: 1.0,
    });
    return this.layers.length - 1;
  }

  getActiveContext() {
    return this.layers[this.activeLayerIndex].ctx;
  }

  setLayerVisibility(index, visible) {
    this.layers[index].visible = visible;
    this.layers[index].canvas.style.display = visible ? 'block' : 'none';
  }

  setLayerOpacity(index, opacity) {
    this.layers[index].opacity = opacity;
    this.layers[index].canvas.style.opacity = opacity;
  }

  flattenToCanvas() {
    const result = document.createElement('canvas');
    result.width = this.width;
    result.height = this.height;
    const ctx = result.getContext('2d');
    for (const layer of this.layers) {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    }
    return result;
  }
}
```

### Konva.js Built-in Layer Support

Konva.js has **native layer support** via its architecture: `Stage > Layer > Group > Shape`. Each Layer renders to its own `<canvas>` element automatically. This is Konva's primary architectural advantage for paint apps with layers.

---

## 6. Library Comparison

### Vanilla Canvas API

| Aspect | Details |
|--------|---------|
| **Bundle size** | 0 KB (native browser API) |
| **Pixel manipulation** | Full access via `getImageData`/`putImageData` |
| **Flood fill** | Must implement manually |
| **Object model** | None — purely procedural/raster |
| **Undo/redo** | Must implement manually (state snapshots or command pattern) |
| **Shapes** | Built-in paths, rects, arcs, ellipses |
| **Free drawing** | Must implement mouse tracking + path drawing |
| **Layers** | Multiple `<canvas>` elements stacked via CSS |
| **Serialization** | `canvas.toDataURL()` for PNG/JPEG; no vector format |
| **Best for** | Full control, pixel-level operations, minimal overhead |

### Fabric.js

| Aspect | Details |
|--------|---------|
| **Bundle size** | ~300 KB minified |
| **Pixel manipulation** | Can access underlying canvas context, but operates at object level |
| **Object model** | Rich — Rect, Circle, Ellipse, Path, Polygon, Image, Text, Textbox |
| **Interactions** | Built-in selection, dragging, scaling, rotation, skewing via controls |
| **Free drawing** | Built-in `PencilBrush`, `CircleBrush`, `SprayBrush`, `PatternBrush` |
| **Layers** | No built-in layer system — single canvas with z-ordered objects |
| **Serialization** | `toJSON()` / `loadFromJSON()` for full state; SVG export |
| **Image filters** | WebGL accelerated: blur, brightness, contrast, grayscale, etc. |
| **Best for** | Vector-style editing apps, interactive object manipulation |

### Konva.js

| Aspect | Details |
|--------|---------|
| **Bundle size** | ~150 KB minified |
| **Architecture** | Stage > Layer > Group > Shape (scene graph) |
| **Pixel manipulation** | Access via layer canvas context |
| **Object model** | Rect, Circle, Ellipse, Line, Image, Text, Star, Path, Ring, etc. |
| **Layers** | **Native multi-layer support** — each Layer = separate `<canvas>` |
| **Hit detection** | Built-in hit graph canvas for pixel-perfect event detection |
| **Events** | Comprehensive: mouse, touch, drag, attribute change events |
| **Drag & drop** | Built-in drag support on any node |
| **Serialization** | `stage.toJSON()` / `Konva.Node.create(json, container)` |
| **Performance** | Shape caching, layer management, selective redraw |
| **Framework support** | React, Vue, Svelte, Angular integrations |
| **Best for** | Layered drawing apps, interactive graphics, games |

### Recommendation for Mac Paint Tool

For a Mac Paint-style app with flood fill, selection tools, and layers:

- **Use vanilla Canvas for the drawing/raster layer** — needed for pixel-level operations (flood fill, color selection, pixel manipulation)
- **Consider Konva.js for UI elements and layer management** — native layer support, built-in event handling, great for overlays and interactive controls
- **Fabric.js is best for vector-oriented editors** where objects need selection handles and transforms; less ideal for raster paint tools
- **Clay is a C layout library** — not applicable for web canvas paint apps (it's for native UI layout, not HTML5)

### Hybrid Approach (Recommended)

The most common pattern for HTML5 paint apps:

1. **Raster drawing layer:** vanilla Canvas API for pixel operations (brush strokes, flood fill, eraser)
2. **UI overlay layer:** either vanilla Canvas or a light framework for tool previews, selection visualization
3. **Layer management:** CSS-stacked `<canvas>` elements for paint layers

---

## 7. Code Examples

### Complete Freehand Drawing with Variable Brush Size

```javascript
class BrushTool {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.drawing = false;
    this.points = [];
    this.lineWidth = 4;
    this.color = '#000000';

    canvas.addEventListener('pointerdown', (e) => this.startDraw(e));
    canvas.addEventListener('pointermove', (e) => this.draw(e));
    canvas.addEventListener('pointerup', () => this.endDraw());
    canvas.addEventListener('pointerleave', () => this.endDraw());
  }

  startDraw(e) {
    this.drawing = true;
    this.points = [this.getPos(e)];
  }

  draw(e) {
    if (!this.drawing) return;
    const pos = this.getPos(e);
    this.points.push(pos);

    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.points.length >= 2) {
      const prev = this.points[this.points.length - 2];
      const curr = this.points[this.points.length - 1];
      this.ctx.beginPath();
      this.ctx.moveTo(prev.x, prev.y);
      // Smooth with midpoint for connected segments
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      this.ctx.stroke();
    }
  }

  endDraw() {
    this.drawing = false;
    this.points = [];
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }
}
```

### Undo/Redo with Canvas State Snapshots

```javascript
class UndoManager {
  constructor(ctx, maxHistory = 50) {
    this.ctx = ctx;
    this.history = [];
    this.redoStack = [];
    this.maxHistory = maxHistory;
    this.saveState(); // Initial blank state
  }

  saveState() {
    const { width, height } = this.ctx.canvas;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    this.history.push(imageData);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.redoStack = []; // Clear redo on new action
  }

  undo() {
    if (this.history.length <= 1) return;
    const current = this.history.pop();
    this.redoStack.push(current);
    const prev = this.history[this.history.length - 1];
    this.ctx.putImageData(prev, 0, 0);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop();
    this.history.push(next);
    this.ctx.putImageData(next, 0, 0);
  }
}
```

### Shape Drawing with Adjustable Line Width

```javascript
class ShapeTool {
  constructor(canvas, overlayCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlayCtx = overlayCanvas.getContext('2d');
    this.shape = 'rectangle'; // 'rectangle', 'ellipse', 'line'
    this.lineWidth = 2;
    this.strokeColor = '#000000';
    this.fillColor = null;
    this.startPos = null;
  }

  onMouseDown(e) {
    this.startPos = this.getPos(e);
  }

  onMouseMove(e) {
    if (!this.startPos) return;
    const pos = this.getPos(e);
    // Preview on overlay
    const { width, height } = this.overlayCtx.canvas;
    this.overlayCtx.clearRect(0, 0, width, height);
    this.drawShape(this.overlayCtx, this.startPos, pos);
  }

  onMouseUp(e) {
    if (!this.startPos) return;
    const pos = this.getPos(e);
    // Commit to main canvas
    this.drawShape(this.ctx, this.startPos, pos);
    this.startPos = null;
    // Clear overlay
    const { width, height } = this.overlayCtx.canvas;
    this.overlayCtx.clearRect(0, 0, width, height);
  }

  drawShape(ctx, start, end) {
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.strokeColor;
    if (this.fillColor) ctx.fillStyle = this.fillColor;

    switch (this.shape) {
      case 'rectangle': {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        if (this.fillColor) ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        break;
      }
      case 'ellipse': {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (this.fillColor) ctx.fill();
        ctx.stroke();
        break;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      }
    }
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }
}
```

---

## 8. Open-Source HTML5 Paint App References

### JS Paint (jspaint.app)

- **Repository:** `github.com/1j01/jspaint`
- **Description:** Faithful recreation of MS Paint in the browser
- **Tech:** Vanilla HTML5 Canvas, no framework
- **Key patterns:**
  - Flood fill implemented with scanline algorithm
  - Color tolerance for fill operations
  - Tool system with pencil, brush, airbrush, text, shapes, eraser, color picker, magnifier
  - Selection tool with clipboard operations
  - Undo/redo with canvas state history
  - Custom cursor rendering based on tool/size
- **Relevance:** Most directly comparable reference for Mac Paint-style app

### Excalidraw

- **Repository:** `github.com/excalidraw/excalidraw`
- **Tech:** React + TypeScript, hybrid Canvas approach
- **Key patterns:**
  - Vector-oriented (stores shapes as objects, renders to canvas)
  - Collision detection for selection
  - Real-time collaboration via CRDT
  - Element-based undo/redo (command pattern, not pixel snapshots)
  - Export to PNG/SVG
- **Relevance:** Good reference for shape tool architecture and undo/redo patterns

### tldraw

- **Repository:** `github.com/tldraw/tldraw`
- **Tech:** React + TypeScript, perfect-freehand library for brush strokes
- **Key patterns:**
  - Perfect Freehand library for pressure-sensitive variable-width strokes
  - Canvas-based rendering with object model
  - Sophisticated selection/transform system
  - Snapshot-based serialization
- **Relevance:** Reference for high-quality brush rendering and shape tools

### Drawio (diagrams.net)

- **Repository:** `github.com/jgraph/drawio`
- **Tech:** mxGraph library (SVG-based)
- **Relevance:** More diagramming than paint, but good reference for UI patterns and export

### miniPaint

- **Repository:** `github.com/nicbarker/miniPaint` (viliusle/miniPaint)
- **Tech:** Vanilla JavaScript + Canvas
- **Key patterns:**
  - Multi-layer support via stacked canvases
  - Fill tool with color tolerance
  - Selection tools (magic wand, color selection)
  - Filters and effects
  - Layer management UI (opacity, visibility, reorder)
- **Relevance:** Closest to full-featured paint app architecture

---

## Discovered Research Topics

### Additional Topics Explored

- **Pressure sensitivity:** `PointerEvent.pressure` property enables tablet/Apple Pencil support for variable brush width
- **requestAnimationFrame:** Use for smooth animation of selection overlays (marching ants) and canvas redraw
- **OffscreenCanvas:** Available for Web Workers — can offload flood fill computation from main thread
- **Canvas vs SVG:** Canvas is better for raster paint operations; SVG better for vector editing

### Topics Not Requiring External Research

- **Color picker implementation:** Native `<input type="color">` or custom HSV picker
- **Keyboard shortcuts:** Standard `Ctrl+Z`/`Cmd+Z` for undo, `Ctrl+Shift+Z` for redo
- **File export:** `canvas.toDataURL('image/png')` or `canvas.toBlob()` for file saving

---

## Next Research (Not Completed This Session)

- [ ] Research `perfect-freehand` library for pressure-sensitive variable-width drawing
- [ ] Research WebGL-based canvas rendering for better performance with filters
- [ ] Research canvas zoom/pan implementation patterns (for magnifier tool)
- [ ] Research clipboard API integration for copy/paste of canvas selections
- [ ] Evaluate Konva.js free drawing demo in detail for layer + draw integration pattern

---

## References

- MDN Canvas API: <https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API>
- MDN CanvasRenderingContext2D: <https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D>
- MDN getImageData: <https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData>
- Fabric.js docs: <https://fabricjs.com/docs/>
- Fabric.js core concepts: <https://fabricjs.com/docs/core-concepts/>
- Konva.js overview: <https://konvajs.org/docs/overview.html>
- Konva.js demos: <https://konvajs.org/docs/sandbox.html>
- Clay UI library: <https://github.com/nicbarker/clay> (C layout library, not for HTML Canvas)
- JS Paint: <https://github.com/1j01/jspaint>
- miniPaint: <https://github.com/nicbarker/miniPaint>
