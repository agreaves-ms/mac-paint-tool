# App Wiring Investigation: Layer & Brush Panels

**Status:** Complete
**Date:** 2026-03-02

---

## 1. HTML Structure (index.html)

The HTML is minimal — four top-level regions inside `#app`:

```
#app
├── #toolbar          ← left sidebar, populated by Toolbar.ts
├── #canvas-container ← center, holds <canvas id="paint-canvas">
├── #property-panel   ← right sidebar, populated by multiple UI components
└── #status-bar       ← bottom bar: cursor pos, zoom, canvas size
```

All UI is generated programmatically. The `#property-panel` div is shared by **four** independent components that all append their DOM into it:

1. **ColorPicker** — inserts its section at the *top* via `container.insertBefore(section, container.firstChild)`
2. **PropertyPanel** — appends tool-specific controls (Size, Opacity, Hardness, Presets, Tolerance, etc.)
3. **LayerPanel** — appends the layer list at the *bottom*
4. **BrushPresetPanel** — appends custom brush presets after the layer panel

---

## 2. Instantiation Order (app.ts, lines ~460–470)

```typescript
// UI Components (line ~65)
const colorPicker = new ColorPicker(document.getElementById('property-panel')!);
const toolbar = new Toolbar(document.getElementById('toolbar')!);
const propertyPanel = new PropertyPanel(document.getElementById('property-panel')!, { ... });

// ... (wiring omitted) ...

// Layer panel (line ~463)
new LayerPanel(document.getElementById('property-panel')!, layerManager);

// Brush preset panel (line ~466)
new BrushPresetPanel(document.getElementById('property-panel')!, brushEngine);

// Set default tool (line ~469)
selectTool('brush');
```

**Key observation:** LayerPanel and BrushPresetPanel are instantiated but their references are **discarded** (`new` without assignment). No external code ever calls methods on them after construction.

---

## 3. How LayerPanel Works

### Construction & Connection

- Takes the `#property-panel` container and the `LayerManager` singleton
- Calls `layerManager.onChange(() => this.updateList())` to re-render when layers change
- Creates a `.layer-panel` div containing:
  - "Layers" header label
  - Action buttons: Add (+), Remove (−), Flatten (⊟), Merge Down (↓)
  - `.layer-list` container for draggable layer items

### Layer Items

Each layer item shows:

- **Main row:** visibility toggle (👁/⊘), 30×22 thumbnail canvas, layer name
- **Controls row:** blend mode dropdown (Normal/Multiply/Screen/Overlay/Darken/Lighten) + opacity slider (0–100%)

### Layer Panel Interactions

- Click item → `layerManager.setActiveLayer(id)`
- Drag-and-drop → `layerManager.moveLayer(fromIndex, toIndex)`
- Visibility toggle → `layerManager.toggleVisibility(id)`
- Blend mode change → `layerManager.setBlendMode(id, mode)`
- Opacity slider → `layerManager.setLayerOpacity(id, val)`
- All operations trigger `onChangeCallback` → panel re-renders

### Always Visible

The LayerPanel is **always visible** regardless of which tool is selected. There is no show/hide logic tied to tool switching.

---

## 4. How BrushPresetPanel Works

### Construction & Connection

- Takes `#property-panel` container and `BrushEngine` instance
- Loads presets from `localStorage` (key: `mac-paint-brush-presets`)
- Creates a `.brush-preset-panel` div containing:
  - "Custom Brushes" header
  - 160×40 preview canvas (draws a horizontal stroke with current engine settings)
  - Save button (+) — captures current engine state as a named preset
  - Preset list — click to apply, × to delete

### BrushPresetPanel Interactions

- Click preset → `engine.applyPreset(preset)` — sets spacing, scatter, rotation, size on BrushEngine
- Click + → `engine.getPreset(name)` → saves to list + localStorage
- Click × → splice from array + persist

### Always Visible

Like LayerPanel, BrushPresetPanel is **always visible** regardless of tool. There is no visibility control tied to tool switching.

---

## 5. How Tool Switching Works

### Flow

1. User clicks toolbar button OR presses single-key shortcut
2. `toolbar.onToolChange` callback fires → calls `selectTool(name)` in app.ts
3. `selectTool()`:
   - Sets `shapeTool.shapeType` if it's a shape tool
   - Calls `engine.setActiveTool(tool)` — deactivates old tool, sets cursor
   - Calls `propertyPanel.updateForTool(name)` — shows/hides controls
   - Manages symmetry overlay (clears if not brush, restores if brush + enabled)

### PropertyPanel Visibility Rules (updateVisibility)

| Section         | Visible When Tool Is...                                         |
|-----------------|----------------------------------------------------------------|
| Size            | brush, eraser, line, rectangle, ellipse, roundedRect, polygon, curve |
| Opacity         | brush only                                                     |
| Hardness        | brush only                                                     |
| Brush Presets   | brush only                                                     |
| Tolerance       | fill only                                                      |
| Gradiance       | selection (color selection) only                               |
| Shape Mode      | line, rectangle, ellipse, roundedRect, polygon                 |
| Text controls   | text only                                                      |
| Corner Radius   | roundedRect only                                               |
| Curve Type      | curve only                                                     |
| Gradient Mode   | gradient only                                                  |
| Symmetry        | brush only                                                     |
| Export Quality  | **always visible** (no hide logic)                             |

### Controls That Are NOT Affected by Tool Switching

- **ColorPicker** — always visible at the top of property panel
- **LayerPanel** — always visible at the bottom
- **BrushPresetPanel** — always visible at the bottom
- **Export Quality** — always visible

---

## 6. How PaintEngine Routes Drawing to Layers

### Layer Context Routing (PaintEngine.getContext)

```typescript
getContext(): CanvasRenderingContext2D {
  if (this.layerManager) {
    const layerCtx = this.layerManager.getActiveContext();
    if (layerCtx) return layerCtx;
  }
  return this.ctx;
}
```

All tools receive the context via `this.getContext()` in pointer event handlers. This returns **the active layer's canvas context** when a LayerManager is present, otherwise the main canvas context.

### Event Canvas Architecture

The `#paint-canvas` becomes a **transparent event-capture surface** (z-index 9999) positioned on top of all layer canvases within a `.layer-stack` wrapper. Pointer events hit the event canvas, but drawing goes to the active layer's context.

### Layer Stack DOM Structure

```
#canvas-container
└── .layer-stack (position: relative, sized to document dimensions)
    ├── .layer-canvas[data-layer-id="layer-0"] (z-index: 0, pointer-events: none)
    ├── .layer-canvas[data-layer-id="layer-1"] (z-index: 1, pointer-events: none)
    ├── ...
    └── #paint-canvas (z-index: 9999, pointer-events: all) ← event capture
```

### Zoom/Pan Transform

Applied to `this.layerStack` (the wrapper div), so all layers + event canvas transform together:

```typescript
const target = this.layerStack ?? this.canvas;
target.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
```

### Export

`LayerManager.getExportCanvas()` composites all visible layers (respecting opacity and blend modes) onto a temp canvas for file save/SVG export.

### Undo/Redo Layer Awareness

`UndoManager.saveState()` receives the active layer ID. On undo/redo, `resolveLayerContext(layerId)` finds the correct layer's context to restore the ImageData to.

---

## 7. The Two Brush Systems

There are **two independent brush/preset systems** that are **not connected to each other**:

### System A: BrushTool + PropertyPanel "Presets" Section

- `BrushTool` has `lineWidth`, `color`, `opacity`, `hardness`, `symmetry*` properties
- `PropertyPanel` shows "Presets" section (Pencil, Marker, Airbrush, Watercolor) — hardcoded in `BRUSH_PRESETS`
- Clicking a preset calls `propertyPanel.setLineSize()`, `.setOpacity()`, `.setHardness()` which update the sliders AND fire callbacks to set `brushTool.lineWidth/opacity/hardness`
- These presets are **built-in** and **not saveable**

### System B: BrushEngine + BrushPresetPanel "Custom Brushes"

- `BrushEngine` has `spacing`, `scatter`, `rotation`, `size` properties + a stamp-based rendering system
- `BrushPresetPanel` saves/loads from localStorage
- Clicking a custom preset calls `engine.applyPreset(preset)` which sets spacing/scatter/rotation/size on BrushEngine

### **Critical Disconnect: BrushEngine is never used by BrushTool**

- `BrushTool` does **its own** stamp-based rendering (via `stampAt`/`stampLine` methods) with its own hardness/size/opacity
- `BrushEngine` has its own stamp system (`stamp`/`strokeTo`) that is **never called during actual drawing**
- The only place BrushEngine's stamp is used is in `BrushPresetPanel.updatePreview()` to draw a preview stripe
- **Changing a BrushEngine preset has zero effect on actual brush drawing**

---

## 8. UX Issues Identified

### Issue 1: BrushPresetPanel is Always Visible (Should Be Brush-Only)

The custom brushes panel appears for all tools (eraser, fill, text, etc.) even though it only applies to the brush tool. It should be hidden when a non-brush tool is selected, similar to how the PropertyPanel hides the Opacity/Hardness/Presets sections.

### Issue 2: BrushEngine Is Completely Disconnected from Drawing

`BrushEngine` and `BrushPresetPanel` form a self-contained system that never affects actual drawing. Users can save "custom brushes" and click to apply them, but nothing changes because `BrushTool` doesn't use `BrushEngine`. This is a **phantom feature** — the UI suggests functionality that doesn't exist.

### Issue 3: Export Quality Section Is Always Visible

The "Export Quality" section in PropertyPanel has no `display: none` logic in `updateVisibility()`. It's shown for every tool, even though it's a document-level setting, not a tool-specific one. It could be moved to a separate section or file menu.

### Issue 4: LayerPanel Has No Tool Context

LayerPanel doesn't know which tool is selected. This is fine architecturally (layers are global), but there are no visual affordances to indicate which layer is receiving drawing input when tools are active.

### Issue 5: Two Preset Systems Create Confusion

The PropertyPanel shows "Presets" (Pencil/Marker/Airbrush/Watercolor) for the brush tool, AND the BrushPresetPanel shows "Custom Brushes" below. These two preset systems use different parameters (opacity/hardness/size vs. spacing/scatter/rotation/size) and are visually adjacent but completely unrelated. A user would expect custom brushes to extend the built-in presets.

### Issue 6: BrushPresetPanel References Are Discarded

Both `new LayerPanel(...)` and `new BrushPresetPanel(...)` at the bottom of app.ts discard their references. While LayerPanel functions fine via its `onChange` subscription, BrushPresetPanel cannot be externally updated (e.g., to refresh its preview when brush settings change from the PropertyPanel).

### Issue 7: Color Propagation Is Manual and Fragile

When colors change (via ColorPicker or Eyedropper), every tool's color property must be updated individually in a long chain:

```typescript
brushTool.color = fg;
shapeTool.color = fg;
shapeTool.fillColor = fg;
textTool.color = fg;
curveTool.color = fg;
gradientTool.foregroundColor = fg;
gradientTool.backgroundColor = bg;
fillTool.fillColor = { r, g, b, a: 255 };
```

This is duplicated in both the `colorPicker.onChange` and `eyedropperTool.onColorSampled` callbacks. Adding a new tool that uses color requires updating both places.

### Issue 8: Line Size Callback Updates Multiple Tools at Once

When the size slider changes, it sets `lineWidth` on brush, eraser, shape, AND curve tools simultaneously. This means switching from a 40px brush to a 1px line tool requires manually adjusting the slider — there's no per-tool size memory.

---

## 9. Summary of Data Flow

```
User Input
    │
    ├─► Toolbar click / keyboard shortcut
    │       │
    │       ├─► selectTool(name)
    │       │       ├─► engine.setActiveTool(tool)  → sets cursor, calls onActivate
    │       │       └─► propertyPanel.updateForTool(name)  → show/hide control sections
    │       │
    │       └─► toolbar.selectTool(name)  → update active button highlight
    │
    ├─► PointerEvent on #paint-canvas
    │       │
    │       ├─► PaintEngine.handlePointerDown/Move/Up
    │       │       ├─► Space+drag → pan
    │       │       ├─► Alt+click → eyedropper sample
    │       │       └─► activeTool.onPointerDown/Move/Up(e, this.getContext())
    │       │                                                    │
    │       │                                                    └─► getContext() returns
    │       │                                                        layerManager.getActiveContext()
    │       │                                                        (active layer's canvas 2D context)
    │       │
    │       └─► pointerdown listener in app.ts
    │               └─► undoManager.saveState(ctx, activeLayerId)
    │
    ├─► PropertyPanel slider/button
    │       └─► callback chain → sets tool properties directly
    │
    ├─► ColorPicker change
    │       └─► manual propagation to all tool color properties
    │
    ├─► LayerPanel actions
    │       └─► layerManager methods → onChange callback → panel re-render
    │
    └─► BrushPresetPanel click
            └─► brushEngine.applyPreset() → (no effect on actual drawing)
```

---

## 10. File Reference Index

| File | Role |
|------|------|
| `src/renderer/index.html` | Minimal HTML shell with 4 container divs |
| `src/renderer/app.ts` | Main wiring: instantiates all components, wires callbacks, keyboard shortcuts |
| `src/renderer/canvas/PaintEngine.ts` | Central coordinator: pointer dispatch, zoom/pan, layer routing, file I/O |
| `src/renderer/canvas/LayerManager.ts` | Layer CRUD, DOM management, compositing for export |
| `src/renderer/ui/Toolbar.ts` | Left sidebar tool buttons with SVG icons |
| `src/renderer/ui/PropertyPanel.ts` | Right sidebar tool-specific controls with show/hide per tool |
| `src/renderer/ui/LayerPanel.ts` | Layer list UI (always visible in property panel) |
| `src/renderer/ui/BrushPresetPanel.ts` | Custom brush preset UI (always visible, disconnected from drawing) |
| `src/renderer/ui/ColorPicker.ts` | HSL picker + palette + fg/bg swatches (always visible) |
| `src/renderer/tools/BrushTool.ts` | Brush drawing logic with own stamp system |
| `src/renderer/tools/BrushEngine.ts` | Alternate stamp engine (unused by any tool) |
| `src/renderer/tools/Tool.ts` | Tool interface definition |
