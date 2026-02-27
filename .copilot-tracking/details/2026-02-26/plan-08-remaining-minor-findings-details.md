<!-- markdownlint-disable-file -->
# Implementation Details: Remaining Minor Findings

**Related Plan**: plan-08-remaining-minor-findings-plan.instructions.md
**Date**: 2026-02-26

## Phase 1: Status Bar Updates and Crop Shortcut

### Step 1.1: Add onCanvasSizeChange callback to PaintEngine

In `src/renderer/canvas/PaintEngine.ts`:
- Add private field: `private onCanvasSizeChangeCallback: ((w: number, h: number) => void) | null = null;`
- Add public method: `onCanvasSizeChange(cb: (w: number, h: number) => void): void { this.onCanvasSizeChangeCallback = cb; }`
- In `cropToSelection()`, after setting `this.canvas.width` and `this.canvas.height`, call `this.onCanvasSizeChangeCallback?.(rect.width, rect.height)`
- In the `drop` handler's `img.onload`, after drawing the image, call `this.onCanvasSizeChangeCallback?.(this.canvas.width, this.canvas.height)`

### Step 1.2: Wire onCanvasSizeChange in app.ts

In `src/renderer/app.ts`, after `canvasSizeEl.textContent = ...`:
- Call `engine.onCanvasSizeChange((w, h) => { canvasSizeEl.textContent = \`\${w} × \${h}\`; })`

### Step 1.3: Add Ctrl+Shift+K shortcut for crop

In `src/renderer/app.ts` keyboard handler, in the `isMeta` section:
- Add: `if (isMeta && e.shiftKey && e.key === 'k') { e.preventDefault(); undoManager.saveState(engine.getContext(), engine.getLayerManager()?.getActiveLayerId()); engine.cropToSelection(); return; }`

## Phase 2: Eyedropper Color Preview

### Step 2.1: Update EyedropperTool.onPointerMove

In `src/renderer/tools/EyedropperTool.ts`:
- Add callback property: `onColorPreview: ((color: string, x: number, y: number) => void) | null = null;`
- Update `onPointerMove` to sample color and emit preview:
  ```typescript
  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const color = this.sampleColorAt(e, ctx);
    this.onColorPreview?.(color, e.clientX, e.clientY);
  }
  ```
- Extract core sampling into a `sampleColorAt` method (similar to `sampleColor` but without calling `onColorSampled`)

### Step 2.2: Create tooltip in app.ts

In `src/renderer/app.ts`:
- Create a tooltip div element: `const eyedropperTooltip = document.createElement('div')` with class `eyedropper-tooltip`
- Style: position fixed, pointer-events none, small box with color swatch square + hex text, offset from cursor by ~20px
- In `selectTool()`, show/hide tooltip based on whether eyedropper is active
- Wire `eyedropperTool.onColorPreview` to position and update tooltip content
- Add CSS for `.eyedropper-tooltip` in `src/renderer/styles/app.css`

## Phase 3: JPEG/WebP Export Quality

### Step 3.1: Add exportQuality property to PaintEngine

In `src/renderer/canvas/PaintEngine.ts`:
- Add field: `private _exportQuality = 0.92;`
- Add getter: `get exportQuality(): number { return this._exportQuality; }`
- Add setter: `set exportQuality(q: number) { this._exportQuality = Math.max(0.1, Math.min(1.0, q)); }`

### Step 3.2: Use exportQuality in saveFile

In `src/renderer/canvas/PaintEngine.ts`, in `saveFile()`:
- Replace `quality = 0.92` with `quality = this._exportQuality` in both the jpg/jpeg and webp cases

### Step 3.3: Add quality slider to PropertyPanel

In `src/renderer/ui/PropertyPanel.ts`:
- Add an export quality slider (range input 10-100, step 1, default 92)
- Label "Export Quality" — initially hidden
- Expose `setExportQualityVisible(visible: boolean)` and `onExportQualityChange(cb: (q: number) => void)`
- Wire in app.ts to `engine.exportQuality = q / 100`

## Phase 4: Symmetry Axis Overlay

### Step 4.1: Add drawSymmetryOverlay to PaintEngine

In `src/renderer/canvas/PaintEngine.ts`:
- Add method `drawSymmetryOverlay(enabled: boolean, type: string, axisCount: number): void`
- Reuse the grid canvas (`this.gridCanvas`) or create a separate overlay canvas
- When enabled:
  - Set strokeStyle to `'rgba(0, 120, 255, 0.6)'`, lineWidth 1, setLineDash([6, 4])
  - For `mirror-h`: draw vertical line at canvas center x
  - For `mirror-v`: draw horizontal line at canvas center y
  - For `rotational`: draw lines from center at angles `2πk/axisCount` for k=0..axisCount-1
- When disabled: clear the overlay

### Step 4.2: Wire symmetry overlay in app.ts

In `src/renderer/app.ts`:
- After symmetry checkbox/controls, call `engine.drawSymmetryOverlay(enabled, type, count)` when symmetry settings change
- Clear overlay when switching away from brush tool
