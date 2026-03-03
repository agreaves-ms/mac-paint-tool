<!-- markdownlint-disable-file -->
# Layer & Brush Panel UX — Implementation Details

## Context References

- Plan: [.copilot-tracking/plans/2026-03-02/layer-brush-panel-ux-plan.instructions.md]
- Research: [.copilot-tracking/research/2026-03-02/layer-brush-panel-ux-research.md]

---

## Phase 1: Fix Layer Panel Layout & Styling

### Step 1.1: Fix `.layer-item` flex direction

**File:** `src/renderer/styles/app.css` (lines 534-542)
**Operation:** Modify `.layer-item` CSS rule — change `align-items: center` to `flex-direction: column; align-items: stretch`

### Step 1.2: Add `.layer-item-row` CSS

**File:** `src/renderer/styles/app.css` (after `.layer-item`)
**Operation:** Add new CSS rule for `.layer-item-row` — `display: flex; align-items: center; gap: 4px;`

### Step 1.3: Add `.layer-controls-row` CSS

**File:** `src/renderer/styles/app.css`
**Operation:** Add new CSS rule for `.layer-controls-row` — flex row, smaller padding, gap between blend select and opacity slider. Hidden by default, shown when parent is `.layer-item.active`.

### Step 1.4: Style `.layer-blend-select`

**File:** `src/renderer/styles/app.css`
**Operation:** Add CSS with `background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 3px; font-size: 10px; padding: 1px 2px; flex: 1;`

### Step 1.5: Style `.layer-opacity-slider`

**File:** `src/renderer/styles/app.css`
**Operation:** Add CSS with `flex: 1; height: 14px;` to match existing `.prop-slider` styling.

### Step 1.6: Show controls row only on active layer

**File:** `src/renderer/styles/app.css`
**Operation:** Add `.layer-controls-row { display: none; }` and `.layer-item.active .layer-controls-row { display: flex; }`

### Step 1.7: Layer rename via double-click

**File:** `src/renderer/ui/LayerPanel.ts` (in `createLayerItem()`)
**Operation:** Add `dblclick` event listener on `nameEl` that replaces it with an input field, on blur/enter saves via `layerManager.renameLayer()`.

---

## Phase 2: Connect BrushEngine to BrushTool

### Step 2.1: Add properties to BrushTool

**File:** `src/renderer/tools/BrushTool.ts` (after line 27)
**Operation:** Add `spacing = 0.25; scatter = 0; rotation = 0;` properties.

### Step 2.2: Integrate scatter and rotation into `stampAt()`

**File:** `src/renderer/tools/BrushTool.ts` (in `stampAt()` method)
**Operation:** Add scatter offset (random displacement when `this.scatter > 0`) and rotation (random angle when `this.rotation > 0`) to the stamp position/context.

### Step 2.3: Integrate spacing into `stampLine()`

**File:** `src/renderer/tools/BrushTool.ts` (in `stampLine()` method)
**Operation:** Replace fixed `effectiveWidth / 4` spacing with `Math.max(1, effectiveWidth * this.spacing)`.

### Step 2.4: Add sliders to PropertyPanel

**File:** `src/renderer/ui/PropertyPanel.ts`
**Operation:** Add Spacing (0.01-1.0), Scatter (0-50), Rotation (0-360) slider sections. Show only for BRUSH_TOOLS.

### Step 2.5: Add callbacks

**File:** `src/renderer/ui/PropertyPanel.ts` (in PropertyCallbacks interface)
**Operation:** Add `onSpacingChange`, `onScatterChange`, `onRotationChange` callbacks.

### Step 2.6: Wire callbacks in app.ts

**File:** `src/renderer/app.ts`
**Operation:** Add callback wiring for spacing, scatter, rotation to brushTool properties.

### Step 2.7: Update BrushPresetPanel preset format

**File:** `src/renderer/ui/BrushPresetPanel.ts`
**Operation:** Change preset type to include all brush parameters. Save/load from BrushTool instead of BrushEngine.

### Step 2.8: Apply presets to BrushTool

**File:** `src/renderer/ui/BrushPresetPanel.ts`
**Operation:** Accept BrushTool reference. On preset click, call `brushTool.applyPreset()` with extended preset. Update PropertyPanel sliders via callback.

### Step 2.9: Update preview rendering

**File:** `src/renderer/ui/BrushPresetPanel.ts`
**Operation:** Use BrushTool parameters for preview stripe instead of BrushEngine. Or keep BrushEngine for preview but sync its parameters from the saved preset.

---

## Phase 3: Panel Visibility & UX Polish

### Step 3.1: Add show/hide to BrushPresetPanel

**File:** `src/renderer/ui/BrushPresetPanel.ts`
**Operation:** Add `show()` and `hide()` methods that toggle the panel root element's display.

### Step 3.2: Wire show/hide to tool switching

**File:** `src/renderer/app.ts` or `src/renderer/ui/PropertyPanel.ts`
**Operation:** In tool switch handler, call `brushPresetPanel.show()` for brush tool, `brushPresetPanel.hide()` for others.

### Step 3.3: Dedicated brush preset CSS

**File:** `src/renderer/styles/app.css`, `src/renderer/ui/BrushPresetPanel.ts`
**Operation:** Replace `layer-actions` → `brush-preset-actions`, `layer-item` → `brush-preset-item`, `layer-name` → `brush-preset-name`. Add corresponding CSS rules.

### Step 3.4: Confirmation for destructive operations

**File:** `src/renderer/ui/LayerPanel.ts`
**Operation:** Add `confirm()` calls before `flattenAll()` and `mergeDown()` in button click handlers.
