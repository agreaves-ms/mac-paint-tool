# Brush System UI & Functionality Investigation

**Status:** Complete
**Date:** 2026-03-02
**Scope:** BrushTool, BrushEngine, BrushPresetPanel, PropertyPanel (brush controls), Toolbar (brush button)

---

## 1. BrushTool.ts — The Brush Drawing Tool

**File:** `src/renderer/tools/BrushTool.ts` (~240 lines)

### Source Architecture

The `BrushTool` class implements the `Tool` interface and manages all brush drawing logic directly — it does **NOT** use `BrushEngine` for drawing. It has its own independent stamp/stroke system.

### Properties Exposed

| Property | Type | Default | Description |
|---|---|---|---|
| `name` | string | `'brush'` | Tool identifier |
| `cursor` | string | `'crosshair'` | CSS cursor |
| `lineWidth` | number | `2` | Brush size in pixels |
| `color` | string | `'#000000'` | Stroke color |
| `opacity` | number | `100` | Opacity 0-100 |
| `hardness` | number | `100` | Edge hardness 0-100 |
| `symmetryEnabled` | boolean | `false` | Whether symmetry drawing is on |
| `symmetryAxisCount` | number | `2` | Number of rotational axes |
| `symmetryAxisType` | enum | `'rotational'` | `'mirror-h'` \| `'mirror-v'` \| `'rotational'` |

### Built-in Presets (Exported Constant)

```typescript
export const BRUSH_PRESETS: BrushPreset[] = [
  { name: 'Pencil',     size: 1,  opacity: 100, hardness: 100 },
  { name: 'Marker',     size: 8,  opacity: 80,  hardness: 80 },
  { name: 'Airbrush',   size: 20, opacity: 40,  hardness: 30 },
  { name: 'Watercolor', size: 15, opacity: 30,  hardness: 20 },
];
```

These presets set `lineWidth`, `opacity`, and `hardness`.

### Drawing Modes

Two drawing paths exist depending on conditions:

1. **Stamp-based rendering** — Used when: pen input detected (`e.pointerType === 'pen'`), hardness < 100, or symmetry enabled. Draws individual circular stamps along the stroke path.
2. **Path-based rendering** — Used at 100% hardness with mouse input and no symmetry. Uses `ctx.beginPath()` + `quadraticCurveTo()` for smooth strokes with `lineCap: 'round'`.

### Pressure Sensitivity

Pressure is consumed via `e.pressure` from `PointerEvent` but ONLY when `e.pointerType === 'pen'`:

```typescript
const width = this.isPenStroke ? 1 + e.pressure * (this.lineWidth - 1) : this.lineWidth;
```

- Pressure maps linearly from 1px at 0 pressure to `lineWidth`px at full pressure.
- Only affects stamp width — does NOT affect opacity or hardness.
- Only activates when using a tablet/pen. Mouse input always uses fixed `lineWidth`.

### Symmetry System

Three modes:

- **Mirror H (`mirror-h`):** Reflects across vertical center axis. Always produces 1 mirror point.
- **Mirror V (`mirror-v`):** Reflects across horizontal center axis. Always produces 1 mirror point.
- **Rotational:** Produces `symmetryAxisCount - 1` additional points rotated around canvas center.

The symmetry center is always the canvas center (`w/2`, `h/2`). Not configurable.

### Stamp System Details

- Stamp spacing: `max(1, effectiveWidth / 4)` — spacing is 25% of brush diameter.
- Accumulator `stampDistance` carries over between move events for even spacing.
- Soft edge (hardness < 100): uses `createRadialGradient()` — inner radius = `radius * hardnessRatio`, outer radius = `radius`.
- Global alpha set from `opacity / 100` before drawing, restored after.

### UX Issues in BrushTool

1. **No spacing control exposed to users** — Spacing is hardcoded at `width / 4`. Users cannot adjust stamp spacing.
2. **Pressure only affects size** — No pressure-to-opacity or pressure-to-hardness mapping.
3. **Symmetry center is not adjustable** — Always canvas center.
4. **No flow control** — Opacity is per-stroke global alpha, not per-stamp accumulation (flow).
5. **No scatter or rotation** — These exist in BrushEngine but are not used by BrushTool.
6. **Coordinate mapping ignores zoom/pan** — `getCanvasCoords` uses simple `clientX - rect.left` without accounting for PaintEngine's zoom/pan transforms. This may cause misalignment at non-1x zoom if PaintEngine doesn't handle it separately.

---

## 2. BrushEngine.ts — Advanced Brush Engine (Disconnected)

**File:** `src/renderer/tools/BrushEngine.ts` (~125 lines)

### Architecture

A **separate, independent** brush engine that provides stamp-based drawing with advanced features. **CRITICAL FINDING: This engine is NOT connected to BrushTool's drawing pipeline.** It is only used by `BrushPresetPanel` for preview rendering.

### Features Available (but Unused for Drawing)

| Property | Range | Default | Description |
|---|---|---|---|
| `spacing` | 0.01+ | `0.25` | Fraction of tip size between stamps |
| `scatter` | 0+ | `0` | Random positional offset per stamp |
| `rotation` | degrees | `0` | Random rotation range per stamp |
| `size` | 1+ | `10` | Output diameter |

### Brush Tip System

- Default tip: 32×32 canvas with a filled circle.
- `loadTip(image)`: Loads a custom image as the brush tip — **this feature is never exposed in UI**.
- Tip is drawn as an off-screen canvas stamp via `ctx.drawImage()`.

### Stamp Method

```typescript
stamp(ctx, x, y, _color): void
```

- Applies scatter randomization.
- Applies random rotation (0 to `rotation` degrees).
- Scales tip to match `size`.
- **Note:** The `_color` parameter is accepted but **never used** — the tip is always drawn in its original appearance (black circle). No color tinting.

### strokeTo Method

Standard stamp-along-line with accumulator, spacing = `max(1, size * spacing)`.

### Integration Status

- `BrushEngine` is instantiated in `app.ts` as `brushEngine`.
- It is passed to `BrushPresetPanel` for preset management and preview rendering.
- It is **never** passed to `BrushTool` or used during any actual canvas drawing.
- No callbacks or events exist to bridge the two systems.

---

## 3. BrushPresetPanel.ts — Custom Brush Preset Panel

**File:** `src/renderer/ui/BrushPresetPanel.ts` (~120 lines)

### UI Structure

Appended to the `#property-panel` container. Always rendered (not conditionally shown/hidden per tool). Elements:

- **Header label:** "Custom Brushes" (uses `.prop-label` class)
- **Preview canvas:** 160×40px, class `brush-preview` — shows stamps in a row across the center. No CSS styling found for `.brush-preview` in `app.css`.
- **Save button:** "+" button with `.layer-action-btn` class, title "Save current as preset"
- **Preset list:** `.layer-list` container with `.layer-item` entries

### Functionality

1. **Save preset:** Captures current `BrushEngine` state (spacing, scatter, rotation, size) as a named preset (`Brush 1`, `Brush 2`, etc.).
2. **Load preset:** Clicking a preset item calls `engine.applyPreset(preset)` — updates the `BrushEngine` instance.
3. **Delete preset:** × button on each item, with `stopPropagation` to prevent load.
4. **Preview update:** Re-renders stamp trail on preview canvas when a preset is loaded.
5. **Persistence:** Presets saved/loaded via `localStorage` key `'mac-paint-brush-presets'`.

### Display/Visibility

- The panel is **always appended** to `#property-panel` regardless of active tool.
- It is rendered once in the constructor and never hidden/shown based on tool selection.
- `PropertyPanel.updateVisibility()` does not reference or control `BrushPresetPanel`.

### UX Issues in BrushPresetPanel

1. **Always visible** — Shows "Custom Brushes" panel even when using non-brush tools (eraser, fill, shapes, etc.). Should be hidden when brush tool is not active.
2. **Disconnected from actual drawing** — Presets affect `BrushEngine` properties but NOT `BrushTool` properties. Selecting a preset does nothing to actual brush behavior.
3. **No rename capability** — Presets get auto-names like "Brush 1", "Brush 2" with no way to rename.
4. **Preview uses `BrushEngine.stamp()` which ignores color** — Preview is always black on dark background, may be hard to see.
5. **Missing preview CSS** — No `.brush-preview` style in CSS; canvas has no border/background styling.
6. **Preview doesn't use `strokeTo`** — Preview stamps individual points at 3px intervals rather than using the engine's stroke interpolation, so it doesn't accurately represent how spacing would look during drawing.
7. **No controls for spacing/scatter/rotation/size** — The panel only saves/loads presets but provides no sliders to adjust these BrushEngine parameters.

---

## 4. PropertyPanel.ts — Brush-Specific Controls

**File:** `src/renderer/ui/PropertyPanel.ts` (~575 lines)

### Tool Visibility Configuration

When the brush tool is active (`BRUSH_TOOLS = ['brush']`), these sections are shown:

| Section | Visible for Brush | Control Type | Range |
|---|---|---|---|
| Size | Yes (all stroke tools) | Slider `1–100` | Sets `lineWidth` |
| Opacity | Yes (brush only) | Slider `0–100` | Sets `opacity` on BrushTool |
| Hardness | Yes (brush only) | Slider `0–100` | Sets `hardness` on BrushTool |
| Presets | Yes (brush only) | Button group | Pencil, Marker, Airbrush, Watercolor |
| Symmetry | Yes (brush only) | Toggle + mode + axis count | On/Off, Mirror-H/V/Rotational, 2–12 axes |
| Export Quality | Always visible | Slider `10–100` | Export JPEG quality |

### Brush Preset Buttons (in PropertyPanel)

Four hard-coded preset buttons from `BRUSH_PRESETS`:

- **Pencil:** size=1, opacity=100%, hardness=100%
- **Marker:** size=8, opacity=80%, hardness=80%
- **Airbrush:** size=20, opacity=40%, hardness=30%
- **Watercolor:** size=15, opacity=30%, hardness=20%

Clicking a preset calls `setLineSize()`, `setOpacity()`, `setHardness()` which update both the UI sliders and fire callbacks to `BrushTool`.

### Symmetry Controls

- **Toggle button:** "On"/"Off" text, toggles `symmetryEnabled`.
- **Axis type buttons:** "Mirror H", "Mirror V", "Rotational" — three-way selector.
- **Axis count slider:** Only visible when symmetry is enabled AND type is "rotational". Range 2–12.
- Changes fire callbacks that update `BrushTool` properties and `PaintEngine.drawSymmetryOverlay()`.

### Cursor Preview

Dynamic cursor based on brush size — draws a circle outline on an off-screen canvas and creates a data URL cursor with centered hotspot. Generated for brush and eraser tools. Only responds to size changes, not hardness.

### Callback Wiring (in app.ts)

```typescript
onLineSizeChange:  → brushTool.lineWidth, eraserTool.lineWidth, shapeTool.lineWidth, curveTool.lineWidth
onOpacityChange:   → brushTool.opacity
onHardnessChange:  → brushTool.hardness
onSymmetryEnabledChange:   → brushTool.symmetryEnabled + engine.drawSymmetryOverlay()
onSymmetryAxisCountChange: → brushTool.symmetryAxisCount + engine.drawSymmetryOverlay()
onSymmetryAxisTypeChange:  → brushTool.symmetryAxisType + engine.drawSymmetryOverlay()
```

### UX Issues in PropertyPanel (Brush Context)

1. **No "%" suffix on opacity/hardness value display initially** — `createValueDisplay(100)` shows "100" not "100%". Suffix is only applied on slider input events.
2. **Export Quality section always visible** — Shows regardless of tool; not brush-specific but clutters the panel.
3. **No spacing/scatter/rotation controls** — These BrushEngine features have no UI sliders.
4. **No flow control** — No way to distinguish between opacity (per-stroke) and flow (per-stamp accumulation).
5. **Preset buttons have no active/selected state** — After clicking a preset, no visual indicator shows which preset is active.
6. **Size slider max is 100** — May be limiting for some use cases; professional tools often go to 500+.

---

## 5. Toolbar.ts — Brush Tool Button

**File:** `src/renderer/ui/Toolbar.ts` (~105 lines)

### Brush Button Configuration

```typescript
{ name: 'brush', icon: `<svg ...><path d="M10 2l3 3-7 7H3v-3z"/><path d="M8.5 3.5l3 3"/></svg>`, shortcut: 'B' }
```

- **Icon:** SVG pencil/pen icon — a stylized editing tool shape.
- **Shortcut:** B key
- **Tooltip:** "Brush (B)" — auto-generated from `tool.name` via camelCase-to-Title-Case conversion.
- **Hover label:** Tool name label appears to the right of the button on hover, positioned with fixed positioning relative to button rect.

### Button Interaction

- `pointerdown` event triggers `selectTool()`.
- Active state: `.toolbar-btn.active` class applied — shows accent-color background.
- Shortcut badge: Small "B" in bottom-right corner, 8px font.

### UX Issues in Toolbar (Brush Context)

1. **Icon looks like a pencil, not a brush** — The SVG path `M10 2l3 3-7 7H3v-3z` draws a pencil/edit icon, which may confuse users expecting a brush/paintbrush icon.
2. **No visual distinction between tool types** — Brush/eraser/shapes all have same button size/style; no grouping separators.

---

## 6. Cross-Cutting UX Analysis

### The Two-System Problem (Critical)

There are **two independent brush systems** that are not connected:

1. **BrushTool** — The actual drawing engine used during painting. Manages size, opacity, hardness, symmetry, and pressure.
2. **BrushEngine** — An advanced stamp engine with spacing, scatter, rotation, and custom tips. Only used for `BrushPresetPanel` preview rendering.

**Impact:** Users can save and load "Custom Brushes" presets in the BrushPresetPanel, but loading a preset does nothing for actual drawing because `BrushEngine` is never used by `BrushTool`. This is a misleading dead feature.

### Settings Not Exposed to Users

These settings exist in code but have no UI controls:

| Setting | Exists In | UI Control | Status |
|---|---|---|---|
| Spacing | BrushEngine | None | Dead feature |
| Scatter | BrushEngine | None | Dead feature |
| Rotation | BrushEngine | None | Dead feature |
| Custom tip image | BrushEngine.loadTip() | None | Dead feature |
| Flow (per-stamp opacity) | Neither | None | Not implemented |
| Pressure-to-opacity | Neither | None | Not implemented |
| Pressure-to-hardness | Neither | None | Not implemented |

### Settings Exposed to Users

| Setting | UI Location | Live Effect | Notes |
|---|---|---|---|
| Size (1-100) | PropertyPanel slider | Yes — `BrushTool.lineWidth` | Shared with eraser/shapes |
| Opacity (0-100%) | PropertyPanel slider | Yes — `BrushTool.opacity` | Per-stroke `globalAlpha` |
| Hardness (0-100%) | PropertyPanel slider | Yes — `BrushTool.hardness` | Radial gradient edge softness |
| Symmetry On/Off | PropertyPanel toggle | Yes — `BrushTool.symmetryEnabled` | |
| Symmetry Type | PropertyPanel buttons | Yes — Mirror-H/V/Rotational | |
| Symmetry Axes (2-12) | PropertyPanel slider | Yes — Rotational only | Hidden when not rotational |
| Quick Presets | PropertyPanel buttons | Yes — Sets size/opacity/hardness | Pencil, Marker, Airbrush, Watercolor |
| Pressure Sensitivity | Automatic | Yes — Size only, pen input only | No toggle, always active for pen |

### How Brush Settings Flow

```
PropertyPanel slider change
  → callbacks in app.ts
    → directly sets BrushTool.lineWidth / .opacity / .hardness / .symmetry*
      → BrushTool reads these during onPointerDown/Move/Up
        → stamp or path drawing on canvas context

BrushPresetPanel preset click
  → engine.applyPreset(preset)  // BrushEngine only
    → (nothing happens to actual drawing)
```

### How the Brush Preset Panel is Displayed/Hidden

**It is NOT hidden.** The BrushPresetPanel is instantiated once at app startup (line 488 of app.ts) and appended to `#property-panel`. It has no show/hide logic. It remains visible for all tools, appearing below the PropertyPanel's tool-specific controls. This creates visual clutter when non-brush tools are active.

### How Pressure Sensitivity Works

1. `PointerEvent.pointerType` is checked in `onPointerDown` — if `'pen'`, `isPenStroke` flag is set.
2. During the entire stroke, if `isPenStroke` is true, stamp width = `1 + e.pressure * (this.lineWidth - 1)`.
3. Pressure range 0.0–1.0 maps to width range 1px–lineWidth.
4. Pressure only affects stamp size, not opacity, hardness, or spacing.
5. When `isPenStroke` is true, it forces stamp-based rendering (even at 100% hardness).
6. There is no UI toggle to disable pressure sensitivity or configure pressure curves.

### How Symmetry Mode Works

1. Toggle button in PropertyPanel fires `onSymmetryEnabledChange` callback.
2. In app.ts, this sets `brushTool.symmetryEnabled` and calls `engine.drawSymmetryOverlay()`.
3. Overlay is a separate canvas (`symmetry-overlay` class) drawn over the paint canvas.
4. Overlay shows dashed blue lines (rgba 0,120,255,0.6) indicating symmetry axes.
5. During drawing, `BrushTool.getSymmetryPoints()` computes mirrored/rotated positions.
6. For each stamp on the primary stroke, additional stamps are drawn at symmetry positions.
7. Stamp accumulator (`stampDistance`) is saved/restored per symmetry axis for consistent spacing.
8. Symmetry center is always `canvas.width/2, canvas.height/2` — not adjustable.

---

## 7. Summary of Key UX Issues

### Critical Issues

1. **BrushEngine/BrushPresetPanel is a dead feature** — Custom brush presets don't affect actual drawing. Users may save presets expecting them to work, but they have no effect.
2. **BrushPresetPanel always visible** — Clutters the panel for non-brush tools.

### Medium Issues

1. **No spacing/scatter/rotation UI controls** — BrushEngine capabilities exist but are inaccessible.
2. **Brush icon looks like a pencil** — Potentially confusing tool identification.
3. **No flow control** — Only per-stroke opacity, no per-stamp accumulation.
4. **Opacity/hardness values missing "%" suffix on initial render** — Minor display bug.
5. **Preset buttons have no selected indicator** — After clicking a preset, users don't know which is active.
6. **Size slider max is 100px** — Limiting for large canvas work.

### Minor Issues

1. **No pressure sensitivity configuration** — Always on for pen, always off for mouse, no curves.
2. **Preview canvas has no CSS styling** — `.brush-preview` class has no defined styles.
3. **Preset naming is auto-generated** — No rename capability.
4. **BrushEngine.stamp() ignores color parameter** — Always stamps the tip image as-is.

---

## 8. Discovered Research Questions

- Should `BrushEngine` be integrated into `BrushTool` to unify the two systems?
- Should spacing/scatter/rotation sliders be added to PropertyPanel when brush is active?
- Should `BrushPresetPanel` be hidden when non-brush tools are selected?
- Should pressure sensitivity be configurable (pressure curves, mapping targets)?
- Should the brush icon be redesigned to look more like a paintbrush?
- Should `BrushEngine.stamp()` support color tinting of the tip image?
