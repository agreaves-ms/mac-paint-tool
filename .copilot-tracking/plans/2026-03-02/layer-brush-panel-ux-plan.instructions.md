<!-- markdownlint-disable-file -->
# Layer & Brush Panel UX Improvement Plan

## Overview

Fix broken/non-functional Layer and Brush panel UI to make all controls visible, styled, and functional.

### User Requirements

- Layer panel blend mode and opacity controls should be visible and properly styled
- Brush custom presets should actually affect drawing
- Panel sections should show/hide based on active tool
- Controls should be self-explanatory

### Derived Objectives

- Fix missing CSS for layer item sub-rows (blend mode, opacity slider)
- Connect BrushEngine parameters to BrushTool's stamp pipeline
- Add BrushEngine controls (spacing, scatter, rotation) to PropertyPanel
- Unify preset systems so custom presets save/load all brush parameters
- Hide BrushPresetPanel for non-brush tools
- Add dedicated CSS for brush preset panel
- Add layer rename via double-click
- Add confirmation for destructive layer operations

## Context Summary

- Conventions from [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Research from [.copilot-tracking/research/2026-03-02/layer-brush-panel-ux-research.md](.copilot-tracking/research/2026-03-02/layer-brush-panel-ux-research.md)

## Implementation Checklist

### Phase 1: Fix Layer Panel Layout & Styling <!-- parallelizable: false -->

- [ ] 1.1 Fix `.layer-item` to use `flex-direction: column` so nested rows stack vertically
- [ ] 1.2 Add CSS for `.layer-item-row` (flex row with eye, thumbnail, name)
- [ ] 1.3 Add CSS for `.layer-controls-row` (flex row with blend mode dropdown and opacity slider)
- [ ] 1.4 Style `.layer-blend-select` dropdown with dark theme variables
- [ ] 1.5 Style `.layer-opacity-slider` with proper width and dark theme
- [ ] 1.6 Only show controls row on active/selected layer to reduce visual clutter
- [ ] 1.7 Add layer rename via double-click on layer name

### Phase 2: Connect BrushEngine to BrushTool <!-- parallelizable: false -->

- [ ] 2.1 Add spacing, scatter, rotation properties to BrushTool
- [ ] 2.2 Integrate BrushEngine's scatter and rotation logic into BrushTool's `stampAt()` method
- [ ] 2.3 Integrate BrushEngine's spacing logic into BrushTool's `stampLine()` method
- [ ] 2.4 Add spacing, scatter, rotation sliders to PropertyPanel for brush tool
- [ ] 2.5 Add PropertyPanel callbacks for spacing, scatter, rotation changes
- [ ] 2.6 Wire new PropertyPanel callbacks to BrushTool in app.ts
- [ ] 2.7 Update BrushPresetPanel to save/load full brush parameters (size, opacity, hardness, spacing, scatter, rotation)
- [ ] 2.8 Make BrushPresetPanel apply presets to BrushTool instead of BrushEngine
- [ ] 2.9 Update preview rendering to use unified parameters

### Phase 3: Panel Visibility & UX Polish <!-- parallelizable: false -->

- [ ] 3.1 Add show/hide methods to BrushPresetPanel
- [ ] 3.2 Call show/hide from PropertyPanel.updateForTool() or app.ts tool switch handler
- [ ] 3.3 Add dedicated CSS classes for brush preset panel (replace reused layer classes)
- [ ] 3.4 Add confirmation dialog for flatten all and merge down operations

## Planning Log Reference

[.copilot-tracking/plans/logs/2026-03-02/layer-brush-panel-ux-log.md](.copilot-tracking/plans/logs/2026-03-02/layer-brush-panel-ux-log.md)

## Dependencies

- No external dependencies
- No skills required

## Success Criteria

1. Layer panel blend mode dropdown and opacity slider are styled with dark theme and properly laid out
2. Controls row only appears on active layer
3. Layer rename works via double-click
4. Brush spacing, scatter, rotation sliders appear when brush tool is active
5. Custom brush presets save AND load all brush parameters including spacing/scatter/rotation
6. Custom brush presets affect actual drawing when applied
7. BrushPresetPanel is hidden for non-brush tools
8. Flatten/merge operations prompt for confirmation
9. No TypeScript compilation errors
10. No regression in existing drawing functionality
