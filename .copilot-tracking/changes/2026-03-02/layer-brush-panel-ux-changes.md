<!-- markdownlint-disable-file -->
# Layer & Brush Panel UX — Changes Log

## Related Plan

[.copilot-tracking/plans/2026-03-02/layer-brush-panel-ux-plan.instructions.md]

## Implementation Date

2026-03-02

## Summary

Fixed broken Layer panel layout (blend mode/opacity controls now visible and styled), connected BrushEngine parameters to BrushTool for functional custom presets, added panel visibility controls, and improved UX with rename and confirmations.

## Changes by Category

### Added

- [src/renderer/styles/app.css](src/renderer/styles/app.css) — CSS for `.layer-item-row`, `.layer-controls-row`, `.layer-blend-select`, `.layer-opacity-slider`, `.layer-rename-input`, `.brush-preset-panel`, `.brush-preview`, `.brush-preset-actions`, `.brush-preset-list`, `.brush-preset-item`, `.brush-preset-name`
- [src/renderer/tools/BrushTool.ts](src/renderer/tools/BrushTool.ts) — `spacing`, `scatter`, `rotation` properties; `getPreset()` method; scatter/rotation integration into `stampAt()`
- [src/renderer/ui/PropertyPanel.ts](src/renderer/ui/PropertyPanel.ts) — Spacing, Scatter, Rotation slider sections; `setSpacing()`, `setScatter()`, `setRotation()` methods; `onSpacingChange`, `onScatterChange`, `onRotationChange` callbacks
- [src/renderer/ui/LayerPanel.ts](src/renderer/ui/LayerPanel.ts) — Double-click rename on layer names; confirmation dialogs for flatten/merge
- [src/renderer/ui/BrushPresetPanel.ts](src/renderer/ui/BrushPresetPanel.ts) — `show()`/`hide()` methods; `onPresetApply()` callback; dedicated CSS classes

### Modified

- [src/renderer/styles/app.css](src/renderer/styles/app.css) — `.layer-item` changed from horizontal flex to column flex for proper nested row layout
- [src/renderer/ui/BrushPresetPanel.ts](src/renderer/ui/BrushPresetPanel.ts) — Rewired from BrushEngine to BrushTool; preview uses BrushTool parameters; presets save/load full brush params
- [src/renderer/tools/BrushTool.ts](src/renderer/tools/BrushTool.ts) — `BrushPreset` interface extended with optional `spacing`, `scatter`, `rotation`; `stampLine()` uses `this.spacing` instead of fixed 1/4 width
- [src/renderer/app.ts](src/renderer/app.ts) — Removed BrushEngine import/instantiation; wired spacing/scatter/rotation callbacks; added BrushPresetPanel show/hide on tool switch; added preset apply callback

### Removed

- [src/renderer/app.ts](src/renderer/app.ts) — Removed unused `BrushEngine` import and `brushEngine` variable
