<!-- markdownlint-disable-file -->
# Layer & Brush Panel UX — Planning Log

## Discrepancy Log

### Unaddressed Research Items

**DR-001: Visual distinction between built-in and custom preset sections not addressed**

- **Source:** Research item #5 "Two unrelated preset systems create user confusion" (Major)
- **Reason:** Plan Step 3.3 replaces reused layer CSS classes with brush-specific classes but does not add a step to visually differentiate PropertyPanel built-in presets from BrushPresetPanel custom presets (e.g., section headers, separators, or distinct styling). Both sections remain adjacent in the property panel without distinction.
- **Impact:** Minor — users may still be confused by two preset sections even after both become functional. The functional fix in Phase 2 is the higher-value correction. Consider adding a labeled section divider or distinct header in a follow-on pass.

### Plan Deviations from Research

**DD-001: BrushEngine.stamp() color parameter bug not remediated for preview rendering**

- **Research recommends:** BrushEngine.stamp() ignores its color parameter and draws black tip shapes regardless — identified as part of Critical issue #4.
- **Plan implements:** Integrates spacing/scatter/rotation features into BrushTool directly (Steps 2.1-2.3); Step 2.9 retains BrushEngine for preview rendering.
- **Rationale:** Plan architecture avoids the color bug for actual drawing. However, preview stripes rendered via BrushEngine may show black-only output instead of the selected brush color, creating a visual mismatch between preview and actual brush behavior. Low severity — preview accuracy is a polish concern.

## Implementation Paths Considered

### Selected: Integrate BrushEngine features into BrushTool

Add spacing/scatter/rotation as direct properties of BrushTool and integrate into its existing stamp pipeline. BrushPresetPanel saves/loads extended presets from BrushTool.

**Rationale:** Least disruption to existing working drawing code. BrushTool's pressure-sensitive hardness system is proven; augmenting with scatter/rotation/spacing is additive.

### Alternative 1: Replace BrushTool stamp system with BrushEngine

Would require rewriting pressure sensitivity, hardness gradients, and symmetry support in BrushEngine.

**Rejected:** Too much regression risk for existing functionality.

### Alternative 2: Remove BrushEngine entirely

Delete BrushEngine and BrushPresetPanel, add advanced sliders to PropertyPanel only.

**Rejected:** Loses the preset save/load system and custom tip loading capability.

### Alternative 3: Keep systems separate, add sync layer

BrushEngine stays separate but a sync mechanism copies its values to BrushTool.

**Rejected:** Adds unnecessary indirection. Better to put the properties directly on BrushTool.

## Suggested Follow-on Work

- Pressure curve configuration UI (currently linear only)
- Custom tip loading (BrushEngine has `loadTip()` but no UI)
- Per-tool size memory retention (currently shared across all tools)
