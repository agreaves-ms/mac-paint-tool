# Color Picker & Brush Tool Implementation Research

## Research Status: Complete

## Research Topics

1. Current ColorPicker implementation (full code and behavior)
2. How colors flow from the picker to the brush tool and other tools
3. Current UI layout and styling for color selection
4. Issues and limitations with the current color picker
5. PropertyPanel implementation relevant to colors
6. HTML structure for the color picker area
7. CSS styles related to color picking
8. How app.ts wires everything together

---

## 1. ColorPicker Implementation

**File:** `src/renderer/ui/ColorPicker.ts` (82 lines)

The `ColorPicker` is a minimal class that renders two overlapping native HTML `<input type="color">` elements (foreground + background) into a container. It is instantiated in `app.ts` and mounted into the `#color-panel` DOM element.

### Key Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fgColor` | `string` | `'#000000'` | Foreground (stroke) color as hex |
| `bgColor` | `string` | `'#ffffff'` | Background color as hex |
| `fgInput` | `HTMLInputElement` | — | Native color input for foreground |
| `bgInput` | `HTMLInputElement` | — | Native color input for background |
| `onChangeCallback` | callback \| null | `null` | Fires `(fg, bg)` on any change |

### Public API

| Method | Signature | Description |
|--------|-----------|-------------|
| `onChange` | `(callback: (fg, bg) => void) => void` | Register change callback |
| `getForegroundColor` | `() => string` | Returns current fg hex |
| `getBackgroundColor` | `() => string` | Returns current bg hex |
| `setForegroundColor` | `(color: string) => void` | Sets fg programmatically (e.g., from eyedropper) |
| `setBackgroundColor` | `(color: string) => void` | Sets bg programmatically |
| `swapColors` | `() => void` | Swaps fg/bg, fires callback |

### DOM Structure Created

```
div.color-picker (32×32px relative position)
├── div.color-swatch.color-swatch-bg (20×20px, positioned top:8 left:8)
│   └── input[type="color"]#bg-color
└── div.color-swatch.color-swatch-fg (20×20px, positioned top:0 left:0, z-index:1)
    └── input[type="color"]#fg-color
```

The two swatches overlap in a classic Photoshop-style arrangement: foreground swatch in top-left, background swatch peeking out bottom-right.

### Full Source Code

```typescript
export class ColorPicker {
  private fgColor = '#000000';
  private bgColor = '#ffffff';
  private fgInput!: HTMLInputElement;
  private bgInput!: HTMLInputElement;
  private onChangeCallback: ((fg: string, bg: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.render(container);
  }

  private render(container: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'color-picker';

    // Background color square (behind)
    const bgSwatch = document.createElement('div');
    bgSwatch.className = 'color-swatch color-swatch-bg';
    this.bgInput = document.createElement('input');
    this.bgInput.type = 'color';
    this.bgInput.id = 'bg-color';
    this.bgInput.value = this.bgColor;
    this.bgInput.title = 'Background color';
    this.bgInput.addEventListener('input', () => {
      this.bgColor = this.bgInput.value;
      this.onChangeCallback?.(this.fgColor, this.bgColor);
    });
    bgSwatch.appendChild(this.bgInput);

    // Foreground color square (on top)
    const fgSwatch = document.createElement('div');
    fgSwatch.className = 'color-swatch color-swatch-fg';
    this.fgInput = document.createElement('input');
    this.fgInput.type = 'color';
    this.fgInput.id = 'fg-color';
    this.fgInput.value = this.fgColor;
    this.fgInput.title = 'Foreground color';
    this.fgInput.addEventListener('input', () => {
      this.fgColor = this.fgInput.value;
      this.onChangeCallback?.(this.fgColor, this.bgColor);
    });
    fgSwatch.appendChild(this.fgInput);

    wrapper.appendChild(bgSwatch);
    wrapper.appendChild(fgSwatch);
    container.appendChild(wrapper);
  }

  onChange(callback: (fg: string, bg: string) => void): void {
    this.onChangeCallback = callback;
  }

  getForegroundColor(): string { return this.fgColor; }
  getBackgroundColor(): string { return this.bgColor; }

  setForegroundColor(color: string): void {
    this.fgColor = color;
    this.fgInput.value = color;
  }

  setBackgroundColor(color: string): void {
    this.bgColor = color;
    this.bgInput.value = color;
  }

  swapColors(): void {
    const temp = this.fgColor;
    this.setForegroundColor(this.bgColor);
    this.setBackgroundColor(temp);
    this.onChangeCallback?.(this.fgColor, this.bgColor);
  }
}
```

---

## 2. Color Flow: Picker → Tools

### Primary Color Distribution (in `app.ts`)

Colors are distributed from the ColorPicker to tools via the `colorPicker.onChange` callback:

```typescript
colorPicker.onChange((fg, bg) => {
  brushTool.color = fg;
  shapeTool.color = fg;
  shapeTool.fillColor = fg;
  textTool.color = fg;
  curveTool.color = fg;
  gradientTool.foregroundColor = fg;
  gradientTool.backgroundColor = bg;
  // FillTool requires RGBA object, not hex string
  const r = parseInt(fg.slice(1, 3), 16);
  const g_val = parseInt(fg.slice(3, 5), 16);
  const b = parseInt(fg.slice(5, 7), 16);
  fillTool.fillColor = { r, g: g_val, b, a: 255 };
});
```

### Eyedropper → ColorPicker Reverse Flow

```typescript
eyedropperTool.onColorSampled = (color: string) => {
  colorPicker.setForegroundColor(color);
  // Same distribution to all tools as above
  brushTool.color = color;
  shapeTool.color = color;
  shapeTool.fillColor = color;
  textTool.color = color;
  curveTool.color = color;
  gradientTool.foregroundColor = color;
  // ... fillTool hex-to-RGBA conversion
};
```

### Color Swap (X key shortcut)

```typescript
case 'x': colorPicker.swapColors(); break;
```

This calls `swapColors()` which fires `onChangeCallback`, triggering the full distribution.

### Color Properties on Each Tool

| Tool | Property | Type | Usage |
|------|----------|------|-------|
| `BrushTool` | `color` | `string` (hex) | Sets `ctx.strokeStyle` and `ctx.fillStyle` for stamps |
| `EraserTool` | — | — | Uses `'destination-out'` compositing, no color |
| `FillTool` | `fillColor` | `{ r, g, b, a }` | RGBA object for flood fill algorithm |
| `ShapeTool` | `color` + `fillColor` | `string` (hex) | Stroke and fill for shapes |
| `TextTool` | `color` | `string` (hex) | Sets `overlay.style.color` and canvas `fillStyle` |
| `CurveTool` | `color` | `string` (hex) | Sets `ctx.strokeStyle` |
| `GradientTool` | `foregroundColor` + `backgroundColor` | `string` (hex) | Gradient start/end colors |

### Important: The `Tool` Interface Has No Color

The base `Tool` interface (`src/renderer/tools/Tool.ts`) does **not** include a `color` property:

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

Color is managed as an ad-hoc property on each tool class — there's no standardized way to set color on a tool.

---

## 3. UI Layout for Color Selection

### HTML Structure (`src/renderer/index.html`)

```html
<div id="app">
  <div id="toolbar"></div>
  <div id="canvas-container">
    <canvas id="paint-canvas"></canvas>
  </div>
  <div id="property-panel"></div>
  <div id="color-panel"></div>
  <div id="status-bar">...</div>
</div>
```

### CSS Grid Layout

```css
#app {
  display: grid;
  grid-template-columns: var(--toolbar-width) 1fr var(--property-panel-width);
  grid-template-rows: 1fr var(--color-panel-height) var(--status-bar-height);
  grid-template-areas:
    "toolbar canvas property"
    "toolbar color  property"
    "status  status status";
  height: 100vh;
  width: 100vw;
}
```

The `#color-panel` is positioned in a narrow strip **below the canvas**, spanning only the canvas column (not the full width). Key dimensions:

- `--color-panel-height: 40px`
- `--toolbar-width: 48px` (left toolbar)
- `--property-panel-width: 200px` (right property panel)

### Color Panel CSS

```css
#color-panel {
  grid-area: color;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
}
```

### Color Picker CSS

```css
.color-picker {
  position: relative;
  width: 32px;
  height: 32px;
}

.color-swatch {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.color-swatch input[type="color"] {
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.color-swatch input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-swatch input[type="color"]::-webkit-color-swatch {
  border: none;
}

.color-swatch-bg {
  top: 8px;
  left: 8px;
}

.color-swatch-fg {
  top: 0;
  left: 0;
  z-index: 1;
}
```

---

## 4. Issues and Limitations

### Current Issues

1. **Native `<input type="color">` is limiting** — Only allows opaque hex colors, no alpha/opacity. No HSL or RGB decomposition. Minimal visual feedback. Appearance varies by platform (macOS system color picker vs. Electron's Chromium picker).

2. **No alpha channel support in color picker** — Colors are always 6-digit hex (`#RRGGBB`). The brush tool handles opacity separately through its own `opacity` property (controlled by PropertyPanel slider), not through the color picker.

3. **Tiny color swatches** — The fg/bg swatches are only 20×20px within a 32×32px container, positioned in the narrow 40px color panel strip.

4. **No recently-used colors or palettes** — No color history, no saved swatches, no preset palettes.

5. **No hex input field** — Users can't type hex values directly; they must use the system color picker dialog.

6. **Color not part of Tool interface** — Each tool stores color differently (`color`, `fillColor`, `foregroundColor/backgroundColor`), requiring manual distribution in app.ts.

7. **Duplicate color distribution code** — The `colorPicker.onChange` and `eyedropperTool.onColorSampled` callbacks contain nearly identical code for distributing colors to all tools.

8. **Color panel wastes horizontal space** — The `#color-panel` spans the entire canvas column width but only contains the 32px ColorPicker widget.

9. **No visual indicator for which color (fg/bg) is active** — The only distinction is the overlapping z-order.

10. **`fillColor` on ShapeTool always matches stroke color** — `shapeTool.fillColor = fg` means fill and stroke are always the same color from the picker. There's no independent fill color selection.

---

## 5. PropertyPanel — Color-Relevant Sections

The `PropertyPanel` (`src/renderer/ui/PropertyPanel.ts`) does NOT contain any color controls. It manages tool-specific properties like:

- **Size slider** (1–100) for stroke tools
- **Opacity slider** (0–100%) for brush only
- **Hardness slider** (0–100%) for brush only
- **Brush Presets** (Pencil, Marker, Airbrush, Watercolor)
- **Tolerance** for fill tool
- **Gradiance** for selection tool
- **Shape mode** (stroke/fill/both)
- **Font controls** for text tool
- **Symmetry controls** for brush
- **Export quality** slider

The PropertyPanel is mounted in `#property-panel` (right side, 200px wide).

---

## 6. BrushTool Color Usage

**File:** `src/renderer/tools/BrushTool.ts`

The BrushTool stores color as `color = '#000000'` and uses it in two modes:

### Non-stamp mode (full hardness, no pen, no symmetry)

```typescript
ctx.strokeStyle = this.color;
ctx.beginPath();
ctx.moveTo(x, y);
// ... quadratic curves and lines
ctx.stroke();
```

### Stamp mode (pen pressure, reduced hardness, or symmetry)

```typescript
// Hard stamp
ctx.fillStyle = this.color;
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();

// Soft stamp (hardness < 100)
const r = parseInt(this.color.slice(1, 3), 16);
const g = parseInt(this.color.slice(3, 5), 16);
const b = parseInt(this.color.slice(5, 7), 16);
const gradient = ctx.createRadialGradient(...);
gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
ctx.fillStyle = gradient;
```

The brush tool parses the hex color to RGB for soft-edge radial gradients. Opacity is handled separately via `ctx.globalAlpha = this.opacity / 100`.

---

## 7. Eyedropper Tool

**File:** `src/renderer/tools/EyedropperTool.ts`

Samples pixel color from canvas via `getImageData(px, py, 1, 1)` and converts to hex. Features:

- `onColorSampled` callback: fires on pointer down with sampled hex
- `onColorPreview` callback: fires on pointer move with live color + cursor position
- A floating tooltip showing color swatch + hex value follows the cursor

---

## 8. App.ts Wiring Summary

```
ColorPicker (mounted in #color-panel)
  ├─→ onChange callback → distributes fg to brush/shape/text/curve/gradient, bg to gradient, fg→RGBA to fill
  └─← setForegroundColor ← EyedropperTool.onColorSampled

Toolbar (mounted in #toolbar)
  └─→ onToolChange → selectTool() → engine.setActiveTool() + propertyPanel.updateForTool()

PropertyPanel (mounted in #property-panel)
  └─→ callbacks → brush.opacity, brush.hardness, brush.symmetry*, tool.lineWidth, etc.

Keyboard shortcut 'X' → colorPicker.swapColors() → triggers onChange → redistributes colors
```

---

## 9. Discovered Additional Research

### Related Files Not Initially Listed

| File | Relevance |
|------|-----------|
| `src/renderer/canvas/ColorSelection.ts` | Color-based selection with gradiance threshold and marching ants |
| `src/renderer/tools/GradientTool.ts` | Uses both fg + bg colors from picker |
| `src/renderer/tools/EyedropperTool.ts` | Reverse color flow: canvas pixel → color picker |
| `src/renderer/tools/BrushEngine.ts` | Additional brush engine (separate from BrushTool) |
| `src/renderer/ui/BrushPresetPanel.ts` | Panel for BrushEngine presets (separate from PropertyPanel presets) |

### Instruction Files

Only one instruction file exists: `.github/instructions/commit-message.instructions.md` (conventional commits, past-tense, feat/chore/fix/docs). No UI-specific or color-picker-specific instructions found.

---

## 10. Summary of Key Findings

1. **ColorPicker is minimal** — two 20×20px native `<input type="color">` elements in overlapping Photoshop-style layout, mounted in a 40px-tall strip below the canvas.

2. **Color flow is imperative** — `app.ts` manually distributes color values from ColorPicker to each tool via property assignment. No event bus, no central color state, no reactive bindings.

3. **Colors are hex strings** except FillTool which uses `{r,g,b,a}` RGBA object. No alpha in the color picker; opacity is a separate brush-only slider.

4. **No color in the Tool interface** — color management is tool-specific, leading to code duplication.

5. **No color palette, history, hex input, HSL controls, or advanced picking UI** — strictly native browser color picker.

6. **Theme-aware** — CSS variables provide dark/light mode support. Color picker chrome inherits theme via `--border-color`.

7. **The EyedropperTool provides reverse integration** — sampled colors flow back into the ColorPicker and are re-distributed to all tools.
