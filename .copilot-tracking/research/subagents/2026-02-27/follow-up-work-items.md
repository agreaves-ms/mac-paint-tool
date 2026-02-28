<!-- markdownlint-disable-file -->
# Follow-Up Work Items Research

## Research Topics

1. Identify unaddressed review findings from 2026-02-26 and 2026-02-27 reviews
2. Discover missing CSS styles for dynamically created UI elements
3. Assess tool implementation quality and missing features
4. Identify UX/UI improvement opportunities
5. Evaluate code quality issues and architectural concerns

## Current Codebase State Summary

- **36 source files** across tools/, canvas/, ui/, and Electron main/preload
- **15 toolbar tools** with SVG icons, keyboard shortcuts, hover labels
- **Layer system** with blend modes, opacity, visibility, drag-reorder
- **Advanced features**: symmetry drawing, curves dialog, brush engine/presets, gradient tool, lasso tool, color selection
- **Plan 07** (review findings fixes) has been fully implemented — all 5 major and 4 of 5 minor findings addressed
- TypeScript compiles cleanly, lint passes

## Unaddressed Findings from Reviews

### From 2026-02-27 Toolbar Icons Review (Minor)

1. **Rectangle/RoundedRect icons hard to distinguish** — Both use rectangles differing only by corner radius (rx=0.5 vs rx=3). At small toolbar size (18×18px), nearly identical.
2. **Lasso icon reads as cloud/blob** — Complex dashed path may not read as a lasso loop at small sizes.

### From 2026-02-26 Plans 01-06 Review (Remaining Minor)

3. **Symmetry axis overlay cosmetic** — Symmetry drawing works, but the overlay lines were actually implemented in Plan 07 via `drawSymmetryOverlay()`. Finding RESOLVED.
4. **JPEG/WebP export quality** — Was originally hardcoded at 0.92. Now addressed by Plan 07 with configurable `exportQuality` property and quality slider in PropertyPanel. Finding RESOLVED.

## Missing CSS Styles

Multiple dynamically-created CSS classes in TypeScript have **no corresponding CSS rules in app.css**:

1. `.layer-item-row` — Created in LayerPanel.ts for the main row containing eye button, thumbnail, name
2. `.layer-controls-row` — Created in LayerPanel.ts for blend mode + opacity controls
3. `.layer-blend-select` — Created in LayerPanel.ts for blend mode dropdown
4. `.layer-opacity-slider` — Created in LayerPanel.ts for per-layer opacity slider
5. `.brush-preview` — Created in BrushPresetPanel.ts for brush preview canvas
6. `.brush-preset-panel` — Created in BrushPresetPanel.ts for the panel container
7. `.dialog-overlay` — Created in CurvesDialog.ts for modal overlay
8. `.dialog` / `.curves-dialog` — Created in CurvesDialog.ts for dialog container
9. `.dialog-title` — Created in CurvesDialog.ts for dialog title
10. `.curve-canvas` — Created in CurvesDialog.ts for the curve editor canvas
11. `.dialog-actions` — Created in CurvesDialog.ts for action buttons

The NewDocumentDialog and ResizeDialog use inline styles instead of CSS classes (different pattern but also problematic for theming).

## Tool Implementation Quality Assessment

### Well-Implemented Tools
- **BrushTool** — Pen pressure support, stamp-based rendering, symmetry, opacity/hardness, presets
- **EraserTool** — Pen pressure support, stamps, save/restore composite operation
- **ShapeTool** — 5 shape types (line, rect, ellipse, roundedRect, polygon), overlay preview, shift-constrain, stroke/fill/both modes
- **SelectionTool** — Marching ants, floating selection with move, stamp on click-outside
- **CurveTool** — Quadratic/cubic curves, control point dragging, overlay preview
- **GradientTool** — Linear/radial modes, preview overlay
- **LassoTool** — Freeform selection with Path2D hit-testing, marching ants

### Tools with Issues
- **FillTool** — Missing `getCanvasCoords` doesn't account for zoom (uses `e.clientX - rect.left` raw, but all other tools do the same — this actually works because PaintEngine routes coordinates through getContext which is layer-aware)
- **TextTool** — Text overlay positioning doesn't account for zoom/pan (uses `canvas.offsetLeft + x`); text committed via fillText which is rasterized (no edit-after-commit)
- **EyedropperTool** — Doesn't account for zoom offset in standalone mode; samples only from active layer context, not flattened composite view

## UX/UI Improvement Opportunities

1. **No "Image" or "Filter" menu in the menu bar** — Filters (invert, curves) are only accessible via keyboard shortcuts (Ctrl+I for invert, Ctrl+M for curves). No menu discoverability.
2. **No zoom controls in the UI** — Zoom is only available via scroll wheel / trackpad pinch. No zoom buttons or zoom percentage dropdown.
3. **Dialog styles not theme-aware** — NewDocumentDialog and ResizeDialog use hardcoded dark-mode inline styles (`#2d2d2d`, `#3c3c3c`, `#e0e0e0`) that don't respect CSS variables or light theme.
4. **No layer name editing** — `renameLayer()` method exists in LayerManager but no UI exposes it. Double-click-to-rename would be expected.
5. **Status bar missing tool name** — Status bar shows cursor position, zoom level, and canvas size, but not the active tool name.
6. **No Ctrl+A (Select All) shortcut** — Common expectation for a drawing app.
7. **No Delete/Backspace to clear selection** — No key to fill selection with background color or delete selection content.
8. **Property panel scroll issues** — With Layer Panel + Brush Preset Panel + all property sections, the panel can overflow without clear visual indication of which sections belong to which tool.

## Code Quality Issues

1. **app.ts is 491 lines** — Acts as the wiring hub for everything. No module separation between tool wiring, menu handling, keyboard shortcuts, and UI initialization.
2. **Duplicate `getCanvasCoords` implementations** — Every tool has its own private copy of the same coordinate mapping function. Could be a shared utility.
3. **Color propagation is manual** — When foreground color changes, app.ts manually sets `.color` on 5 tools and converts hex to RGB for FillTool. Error-prone if new tools are added.
4. **EyedropperTool color propagation duplicated** — Same 6-line color propagation block exists twice in app.ts (colorPicker.onChange and eyedropperTool.onColorSampled).

## Discovered Research Topics

- The `BrushEngine` is instantiated in app.ts but never connected to `BrushTool` — the BrushPresetPanel loads presets into BrushEngine but BrushTool uses its own stamp-based rendering. The two systems are parallel/disconnected.
- `ColorSelection` tool (W shortcut) does color-based selection but has no visible integration with clipboard operations (copy/cut selected region).

## Next Research (Not Completed)

- Visual regression testing coverage for the 15 tool icons
- Accessibility audit (keyboard navigation within toolbar, ARIA labels)
- Performance profiling of stamp-based rendering on large canvases

## Clarifying Questions

None — all findings are based on direct source code analysis.
