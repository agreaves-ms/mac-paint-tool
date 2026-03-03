# Layer Panel Investigation

## Research Status: Complete

## Files Investigated

1. `src/renderer/ui/LayerPanel.ts` — Layer panel UI (180 lines)
2. `src/renderer/canvas/LayerManager.ts` — Layer manager logic (238 lines)
3. `src/renderer/ui/PropertyPanel.ts` — Property panel (no layer-specific controls, layers are separate)
4. `src/renderer/styles/app.css` — Layer-related CSS styles
5. `src/renderer/app.ts` — Wiring/initialization
6. `src/renderer/canvas/PaintEngine.ts` — Layer routing

---

## 1. LayerPanel.ts — Full Analysis

### Source Structure

The `LayerPanel` class (~180 lines) creates and manages the layer list UI. It is mounted into `#property-panel` (the right sidebar) from `app.ts` line 485:

```ts
new LayerPanel(document.getElementById('property-panel')!, layerManager);
```

### UI Controls

| Control | Icon/Label | What It Does |
|---|---|---|
| **Add Layer** button | `+` | Calls `layerManager.addLayer()` — creates a new layer above all others |
| **Remove Layer** button | `−` | Removes the currently active layer (calls `removeLayer(activeLayerId)`) |
| **Flatten All** button | `⊟` | Merges all visible layers into one Background layer |
| **Merge Down** button | `↓` | Merges active layer into the layer below it |
| **Visibility Toggle** | `👁` / `⊘` | Per-layer eye button; toggles `layer.visible` and `canvas.style.display` |
| **Layer Thumbnail** | 30×22 canvas | Renders a miniature preview of the layer content (applies `globalAlpha` for opacity) |
| **Layer Name** | text span | Displays the layer name (e.g., "Background", "Layer 2") |
| **Blend Mode Dropdown** | `<select>` | Per-layer blend mode: Normal, Multiply, Screen, Overlay, Darken, Lighten |
| **Opacity Slider** | `<input type="range">` | Per-layer opacity 0–100%, mapped to 0.0–1.0 |
| **Drag Reorder** | HTML5 drag events | Layers are `draggable=true`; drag-and-drop reorders via `moveLayer()` |
| **Click to Select** | `pointerdown` on item | Sets the clicked layer as active |

### Layer Item Structure (per layer)

Each `layer-item` has two rows:

1. **Main Row** (`layer-item-row`): eye button + thumbnail canvas + name span
2. **Controls Row** (`layer-controls-row`): blend mode select + opacity slider

### How the Panel Is Displayed/Hidden

- The layer panel is **always visible** — it's appended to `#property-panel` and has no show/hide toggle.
- It sits below the PropertyPanel's tool-specific controls (size slider, brush presets, etc.).
- There is no collapse/expand mechanism for the layer panel.
- The panel renders inside a `div.layer-panel` with a `margin-top: 12px` and `border-top` separator from CSS.

### Layer List Rendering

- `updateList()` is called on every `layerManager.onChange()` callback.
- Layers are rendered **top-to-bottom** (last array index = topmost layer displayed first).
- The active layer gets the `active` CSS class (blue highlight).
- Full list is re-rendered on every change (`innerHTML = ''` then rebuild).

### Event Handling Details

- All buttons use `pointerdown` (not `click`) with `e.preventDefault()`.
- Blend mode dropdown and opacity slider use `e.stopPropagation()` on both their primary events and `pointerdown` to prevent the layer-item click handler from firing.
- Drag events: `dragstart` sets index, `dragover` adds `drag-over` class, `dragleave` removes it, `drop` calls `moveLayer()`.

---

## 2. LayerManager.ts — Full Analysis

### Layer Interface

```ts
interface Layer {
  id: string;                          // e.g., "layer-0", "layer-1"
  name: string;                        // e.g., "Background", "Layer 2"
  canvas: HTMLCanvasElement;           // Dedicated canvas element
  ctx: CanvasRenderingContext2D;       // Context with willReadFrequently: true
  visible: boolean;                    // Controls display: none
  opacity: number;                     // 0.0 to 1.0
  blendMode: GlobalCompositeOperation; // CSS mix-blend-mode
}
```

### Architecture

- Each layer is a separate `<canvas>` element stacked in a `div.layer-stack` container.
- The `layer-stack` div uses `position: relative` with all layer canvases `position: absolute`.
- The original `#paint-canvas` is repurposed as a transparent event-capture surface (`z-index: 9999`).
- Layer canvases have `pointer-events: none` — all input goes through the event canvas.
- Z-indices are assigned sequentially: layer 0 gets `z-index: 0`, layer 1 gets `z-index: 1`, etc.
- The event canvas always stays on top with `z-index: 9999`.

### Layer Operations

| Method | Behavior |
|---|---|
| `addLayer(name?)` | Creates a new canvas, appends to `layers[]`, inserts before event canvas in DOM. Auto-names as "Layer N" if no name given. First layer auto-becomes active. |
| `removeLayer(id)` | Removes layer from array and DOM. Cannot remove last remaining layer. Selects adjacent layer if active was removed. |
| `moveLayer(from, to)` | Splices array and re-orders DOM children to match. |
| `setActiveLayer(id)` | Sets `activeLayerId`. Validated against existing layers. |
| `toggleVisibility(id)` | Toggles `visible` flag and `canvas.style.display`. |
| `setLayerOpacity(id, opacity)` | Clamps 0–1, sets `canvas.style.opacity`. |
| `setBlendMode(id, mode)` | Sets `canvas.style.mixBlendMode`. Maps `source-over` → `normal` for CSS. |
| `renameLayer(id, name)` | Updates `layer.name`. |
| `flattenAll()` | Composites all visible layers (respecting opacity and blend mode) into a temp canvas, then replaces all layers with one "Background" layer. |
| `mergeDown()` | Composites active layer onto the one below it (applying opacity and blend mode), then removes the active layer. |
| `getExportCanvas()` | Returns a temp canvas with all visible layers composited — used for save/export. |
| `reset(width, height, bgColor?)` | Removes all layers, resizes, creates a fresh "Background" layer. |

### Change Notification

- Single callback pattern: `onChange(callback)` stores one callback.
- Every mutating method calls `this.onChangeCallback?.()` after state changes.
- The LayerPanel subscribes to this in its constructor.

### PaintEngine Integration

- `PaintEngine.getContext()` returns the active layer's context (via `layerManager.getActiveContext()`), falling back to the main canvas context if no layer manager.
- Tools receive and draw on the active layer's context transparently — they don't know about layers.
- `resolveLayerContext(layerId)` is used by the UndoManager to restore state to the correct layer.

---

## 3. PropertyPanel.ts — Layer Interaction

The PropertyPanel does **not** contain any layer-specific controls. The LayerPanel is a separate component mounted into the same `#property-panel` container element after the PropertyPanel.

From `app.ts`:

```ts
// PropertyPanel is created earlier in app.ts with tool callbacks
// LayerPanel is appended after, at line 485:
new LayerPanel(document.getElementById('property-panel')!, layerManager);
```

The LayerPanel appears below all PropertyPanel sections in the right sidebar.

---

## 4. CSS Styles — Layer-Related

### Layer Canvas (line 109)

```css
.layer-canvas {
  background: transparent;
}
```

### Layer Panel (lines 499–579)

| Selector | Key Properties |
|---|---|
| `.layer-panel` | `margin-top: 12px`, `border-top: 1px solid`, `padding-top: 8px` |
| `.layer-actions` | `display: flex`, `gap: 4px`, `margin-bottom: 6px` |
| `.layer-action-btn` | `flex: 1`, `padding: 4px`, `bg: var(--bg-tertiary)`, `border-radius: 4px`, `font-size: 14px` |
| `.layer-action-btn:hover` | `bg: var(--bg-primary)` |
| `.layer-list` | `display: flex`, `flex-direction: column`, `gap: 2px` |
| `.layer-item` | `display: flex`, `align-items: center`, `gap: 4px`, `padding: 3px 4px`, `border-radius: 4px`, `border: 1px solid transparent` |
| `.layer-item:hover` | `bg: var(--bg-tertiary)` |
| `.layer-item.active` | `bg: var(--accent-color)`, `color: #ffffff` |
| `.layer-item.drag-over` | `border-color: var(--accent-color)` |
| `.layer-eye-btn` | `background: none`, `border: none`, `font-size: 12px`, `padding: 0 2px` |
| `.layer-thumb` | `border: 1px solid var(--border-color)`, `border-radius: 2px`, `bg: #fff` |
| `.layer-name` | `font-size: 11px`, `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`, `flex: 1` |

### Missing CSS Styles

The following classes are used in `LayerPanel.ts` but have **no CSS definitions** in `app.css`:

- **`.layer-item-row`** — The main row container (eye + thumb + name). No styling = no flex layout applied. Currently it works because the parent `.layer-item` is `display: flex`, but the row is not a flex container itself.
- **`.layer-controls-row`** — The blend mode + opacity row. No styling = it's a plain block element. No flex layout means the dropdown and slider stack vertically or behave unpredictably.
- **`.layer-blend-select`** — The blend mode `<select>`. No styling = uses browser defaults (looks out of place in the dark theme).
- **`.layer-opacity-slider`** — The opacity slider `<input type="range">`. No styling = uses browser defaults.

---

## 5. UX Issues Identified

### Critical Issues

1. **Missing CSS for layer controls row** — `.layer-controls-row`, `.layer-item-row`, `.layer-blend-select`, and `.layer-opacity-slider` have no CSS styles. The blend mode dropdown and opacity slider likely look unstyled/broken, with no dark theme integration and no flex layout.

2. **Items use `display: flex` on `.layer-item` but two child divs break the layout** — The `.layer-item` CSS expects flat children (eye, thumb, name), but the JS creates two sub-rows (`layer-item-row` and `layer-controls-row`). The flex layout on `.layer-item` makes these rows sit side-by-side rather than stacking vertically. This is a **layout bug**.

### Moderate Issues

1. **No layer rename UI** — `LayerManager.renameLayer()` exists but the LayerPanel has no UI to invoke it (no double-click-to-edit, no context menu, no rename button). Layers are stuck with their default names forever.

2. **No duplicate layer** — Common operation in image editors, but not exposed.

3. **Flatten/Merge Down have no confirmation** — Destructive operations with no undo warning. If the user accidentally clicks "⊟", all layers are merged with no way back (undo only covers individual layer drawing, not structural changes).

4. **Action button icons are cryptic** — `⊟` for Flatten All and `↓` for Merge Down are not universally understood. No text labels, only tooltips on hover.

5. **Single onChange callback** — `LayerManager.onChange()` replaces the previous callback. If any other component wanted to listen for layer changes, it would overwrite the LayerPanel's listener. Should use an event emitter or callback array.

### Minor Issues

1. **Thumbnail doesn't update in real-time** — Thumbnails are only redrawn when `updateList()` is called (on `onChange`). During active drawing, the thumbnail is stale. It updates when the user switches tools, adds/removes layers, or changes visibility.

2. **No opacity value label visible** — The opacity slider has a tooltip (`title` attribute) showing the percentage, but no visible text label next to it. Users might not know the exact opacity value without hovering.

3. **No keyboard shortcuts for layer operations** — No shortcut for add layer, delete layer, move layer up/down, toggle visibility, etc.

4. **Drag reorder uses array indices directly** — The drag-and-drop passes array indices, but the list is rendered in reverse order (topmost layer first). This could cause confusing reorder behavior depending on drag direction.

5. **Visibility icon uses emoji** — `👁` and `⊘` are platform-dependent emoji; they may render differently across OSes and could look inconsistent with the rest of the UI.

6. **No layer count limit** — Users can add unlimited layers, potentially causing performance issues with many canvases.

7. **No lock layer feature** — No way to prevent accidental edits to a layer.

8. **Export quality section (`PropertyPanel`) always visible** — The export quality slider in PropertyPanel appears to always render regardless of tool, with no clear connection to any specific tool and no visibility toggle (it's not listed in `updateVisibility()`).

---

## 6. Architecture Summary

### Data Flow

```
User clicks Layer Panel UI
   → LayerPanel calls LayerManager methods
      → LayerManager updates internal state + DOM canvases
      → LayerManager calls onChangeCallback
         → LayerPanel.updateList() re-renders the list

User draws on canvas
   → PaintEngine receives PointerEvent
      → PaintEngine.getContext() returns active layer's ctx
         → Tool draws on active layer's canvas
```

### Layer Stack DOM Structure

```html
<div id="canvas-container">
  <div class="layer-stack" style="position: relative; width: 1024px; height: 768px;">
    <canvas class="layer-canvas" data-layer-id="layer-0" style="z-index: 0;"> <!-- Background -->
    <canvas class="layer-canvas" data-layer-id="layer-1" style="z-index: 1;"> <!-- Layer 2 -->
    <canvas id="paint-canvas" style="z-index: 9999;"> <!-- Transparent event capture -->
  </div>
</div>
```

### Property Panel DOM Structure

```html
<div id="property-panel">
  <!-- PropertyPanel tool controls -->
  <div class="prop-section">Size</div>
  <div class="prop-section">Opacity</div>
  <!-- ... more tool sections, visibility toggled by active tool ... -->

  <!-- LayerPanel (always visible, appended after PropertyPanel) -->
  <div class="layer-panel">
    <label class="prop-label">Layers</label>
    <div class="layer-actions"> +  −  ⊟  ↓ </div>
    <div class="layer-list">
      <div class="layer-item active">
        <div class="layer-item-row">👁 [thumb] Layer 2</div>
        <div class="layer-controls-row">[blend dropdown] [opacity slider]</div>
      </div>
      <div class="layer-item">
        <div class="layer-item-row">👁 [thumb] Background</div>
        <div class="layer-controls-row">[blend dropdown] [opacity slider]</div>
      </div>
    </div>
  </div>
</div>
```

---

## 7. Checklist of Recommended Next Steps

- [ ] Add missing CSS styles for `.layer-item-row`, `.layer-controls-row`, `.layer-blend-select`, `.layer-opacity-slider`
- [ ] Fix layout bug: `.layer-item` needs `flex-direction: column` or the two rows need different treatment
- [ ] Add double-click-to-rename on layer names
- [ ] Add visible opacity percentage label
- [ ] Consider adding keyboard shortcuts for layer operations
- [ ] Consider adding confirmation dialogs for Flatten All / Merge Down
- [ ] Consider using an event emitter pattern instead of single callback on LayerManager
- [ ] Consider adding layer duplication button
- [ ] Investigate whether the export quality section visibility needs to be toggled

---

## 8. Clarifying Questions

None — all questions were answered through code inspection.
