<!-- markdownlint-disable-file -->

# Implementation Plan: Enhanced Color Picker

## Overview and Objectives

**User Requirement**: Update the brush tool to provide a more clear color picker.

**Derived Objectives**:
1. Replace tiny native `<input type="color">` elements with a custom visual color picker
2. Add HSL-based color selection (hue strip + saturation/lightness area)
3. Add hex input field for precise color entry
4. Add quick-access color palette
5. Enlarge fg/bg swatches with swap button
6. Move color picker into property panel for more space

## Context Summary

- Project conventions: `.github/copilot-instructions.md`
- No external dependencies, plain HTML/CSS/JS
- CSS variables for theming (dark/light)
- PropertyPanel pattern: `createSection()` + slider/button rendering

## Implementation Checklist

### Phase 1: Rewrite ColorPicker.ts <!-- parallelizable: false -->

- [x] Rewrite `src/renderer/ui/ColorPicker.ts` with:
  - Larger fg/bg swatches (28×28px) with swap button
  - Hex input field with validation
  - Hue strip (canvas-based horizontal gradient)
  - Saturation/Lightness 2D picker (canvas-based)
  - Quick palette (16 common colors in 2×8 grid)
  - HSL↔Hex conversion utilities
  - Same public API as before

### Phase 2: Update CSS <!-- parallelizable: true -->

- [x] Update `src/renderer/styles/app.css`:
  - Remove old color-panel grid area and styles
  - Add new color picker section styles for property panel integration
  - Style the hue strip, SL area, hex input, palette, swatches

### Phase 3: Wire into app.ts and layout <!-- parallelizable: false -->

- [x] Update `src/renderer/app.ts`: mount ColorPicker into property panel instead of color-panel
- [x] Update `src/renderer/index.html`: remove `#color-panel` div
- [x] Update CSS grid to remove color row

## Dependencies

- None (standalone UI component)

## Success Criteria

- Color picker renders in property panel with all components
- Clicking hue strip changes hue, SL area changes saturation/lightness
- Hex input allows typing color values
- Palette colors are clickable
- Fg/bg swatches display current colors, swap button works
- All existing tool color wiring unchanged
- Both dark and light themes supported
