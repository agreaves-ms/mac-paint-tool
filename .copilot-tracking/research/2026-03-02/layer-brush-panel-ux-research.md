<!-- markdownlint-disable-file -->
# Layer & Brush Panel UX Research

## Scope

Investigate how Layer and Brush tools/panels currently work, identify UX issues, and determine improvements to make their functionality clear and usable.

## Assumptions

- All changes use plain HTML/CSS (no framework) per project conventions.
- Dark mode CSS variables must be used for all new styles.
- Changes must not break existing drawing functionality.

## Success Criteria

- Layer panel controls (blend mode, opacity) are properly styled and visible.
- Brush preset system is functional — custom presets affect actual drawing.
- Panels show/hide based on active tool context.
- Users can understand all controls without prior knowledge.

---

## Evidence Log

### Layer Panel Issues

#### 1. Missing CSS for layer controls (Critical)

**Source:** [src/renderer/ui/LayerPanel.ts](src/renderer/ui/LayerPanel.ts) lines 88-155, [src/renderer/styles/app.css](src/renderer/styles/app.css) lines 500-580

The LayerPanel creates two nested divs inside each `.layer-item`:
- `.layer-item-row` (eye button, thumbnail, name)
- `.layer-controls-row` (blend mode dropdown, opacity slider)

However, `.layer-item` has `display: flex; align-items: center` expecting flat children. The nested row structure means both rows render **side-by-side** instead of stacked vertically. Additionally, the following CSS classes are referenced in JS but have **no CSS definitions**:
- `.layer-item-row`
- `.layer-controls-row`
- `.layer-blend-select`
- `.layer-opacity-slider`

The blend mode dropdown and opacity slider render with unstyled browser defaults (no dark theme, no sizing constraints).

#### 2. No layer rename UI (Minor)

**Source:** [src/renderer/canvas/LayerManager.ts](src/renderer/canvas/LayerManager.ts) has `renameLayer()` method, but [LayerPanel.ts](src/renderer/ui/LayerPanel.ts) provides no UI to invoke it (no double-click handler, no context menu).

#### 3. Destructive operations without warning (Minor)

**Source:** [src/renderer/ui/LayerPanel.ts](src/renderer/ui/LayerPanel.ts) lines 37-42

Flatten All (`flattenAll()`) and Merge Down (`mergeDown()`) are destructive, irreversible operations with no confirmation dialog. Users could accidentally flatten all layers with a single misclick.

### Brush Panel Issues

#### 4. BrushEngine is completely disconnected from drawing (Critical)

**Source:** [src/renderer/tools/BrushEngine.ts](src/renderer/tools/BrushEngine.ts), [src/renderer/tools/BrushTool.ts](src/renderer/tools/BrushTool.ts)

Two independent brush systems exist:
- **BrushTool** — the actual drawing engine with its own `stampAt()`, `stampLine()`, size, opacity, hardness, symmetry, and pen pressure support.
- **BrushEngine** — an advanced stamp engine with spacing, scatter, rotation, and custom tip loading. **Only used by BrushPresetPanel** to draw a preview stripe. Never called during actual painting.

`BrushEngine.stamp()` ignores its color parameter (draws black tip shape regardless). The `strokeTo()` method is never called from BrushTool.

#### 5. BrushPresetPanel always visible (Major)

**Source:** [src/renderer/app.ts](src/renderer/app.ts) — `new BrushPresetPanel(propertyPanel, brushEngine)` without any tool-conditional visibility.

The BrushPresetPanel is always visible in the property panel regardless of which tool is selected. It clutters the panel when using non-brush tools (shapes, text, fill, eraser, etc.).

#### 6. Custom Brushes are non-functional (Critical)

**Source:** [src/renderer/ui/BrushPresetPanel.ts](src/renderer/ui/BrushPresetPanel.ts)

Saving and loading custom brush presets modifies `BrushEngine` state (spacing, scatter, rotation, size) but has **zero effect on actual painting** because BrushTool doesn't use BrushEngine. The entire "Custom Brushes" section is a phantom feature — it looks functional but does nothing.

#### 7. Two unrelated preset systems create user confusion (Major)

**Source:** [src/renderer/ui/PropertyPanel.ts](src/renderer/ui/PropertyPanel.ts) lines 164-181, [src/renderer/ui/BrushPresetPanel.ts](src/renderer/ui/BrushPresetPanel.ts)

PropertyPanel has working built-in presets (Pencil/Marker/Airbrush/Watercolor) that correctly set BrushTool's size/opacity/hardness. BrushPresetPanel has saveable custom presets that configure the disconnected BrushEngine. Both appear adjacent in the property panel with no visual distinction, creating confusion.

#### 8. BrushPresetPanel reuses Layer CSS classes (Minor)

**Source:** [src/renderer/ui/BrushPresetPanel.ts](src/renderer/ui/BrushPresetPanel.ts) lines 38-42

BrushPresetPanel reuses `layer-actions`, `layer-item`, `layer-name` CSS classes for its preset items. This creates semantic confusion and means changes to layer styles unintentionally affect brush preset items.

---

## Selected Approach

### Phased improvement strategy:

**Phase 1: Fix Layer Panel Layout & Styling**
- Add missing CSS for `.layer-item-row`, `.layer-controls-row`, `.layer-blend-select`, `.layer-opacity-slider`.
- Fix `.layer-item` to use `flex-direction: column` or restructure to stack rows vertically.
- Style blend mode dropdown and opacity slider with dark theme.

**Phase 2: Connect BrushEngine to BrushTool**
- Wire BrushEngine's spacing/scatter/rotation into BrushTool's stamp pipeline so custom presets actually affect drawing.
- Add BrushEngine controls (spacing, scatter, rotation) to the PropertyPanel when brush is active.
- Make BrushPresetPanel save/load presets that include ALL brush parameters (size, opacity, hardness, spacing, scatter, rotation).

**Phase 3: Panel Visibility & UX Polish**
- Hide BrushPresetPanel when non-brush tools are active.
- Add dedicated CSS classes for brush presets instead of reusing layer classes.
- Add layer rename via double-click on layer name.
- Add confirmation for destructive layer operations (flatten/merge).

### Rationale

This approach prioritizes fixing broken/non-functional features (Phases 1-2) before polish (Phase 3). Connecting BrushEngine to BrushTool is the most valuable improvement because it makes an entire feature system functional.

### Rejected Alternatives

1. **Remove BrushEngine entirely** — Too much lost work; the engine has useful features (spacing, scatter, rotation, custom tips) that would enhance brush drawing.
2. **Replace BrushTool's stamp system with BrushEngine** — Too risky; BrushTool's existing system handles pressure sensitivity, symmetry, and hardness well. Better to augment it with BrushEngine's features.
3. **Merge both preset systems** — Considered but decided to keep built-in presets as quick-access and custom presets for user-created ones. They serve different purposes, just need to both work.

---

## Actionable Next Steps

1. Create implementation plan with three phases.
2. Phase 1: CSS fixes for layer panel (lowest risk, immediate visual improvement).
3. Phase 2: BrushEngine integration (highest value, connects disconnected systems).
4. Phase 3: UX polish (visibility, rename, confirmations).

---

## References

- [src/renderer/ui/LayerPanel.ts](src/renderer/ui/LayerPanel.ts) — Layer panel component
- [src/renderer/canvas/LayerManager.ts](src/renderer/canvas/LayerManager.ts) — Layer manager
- [src/renderer/tools/BrushTool.ts](src/renderer/tools/BrushTool.ts) — Brush drawing tool
- [src/renderer/tools/BrushEngine.ts](src/renderer/tools/BrushEngine.ts) — Brush engine (disconnected)
- [src/renderer/ui/BrushPresetPanel.ts](src/renderer/ui/BrushPresetPanel.ts) — Custom brush presets panel
- [src/renderer/ui/PropertyPanel.ts](src/renderer/ui/PropertyPanel.ts) — Property panel with tool controls
- [src/renderer/styles/app.css](src/renderer/styles/app.css) — Application styles
- [src/renderer/app.ts](src/renderer/app.ts) — Application wiring
