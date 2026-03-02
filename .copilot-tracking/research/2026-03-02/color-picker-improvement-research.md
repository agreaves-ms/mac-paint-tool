<!-- markdownlint-disable-file -->

# Color Picker Improvement Research

## Scope

Improve the color picker UI in the Mac Paint Tool to provide a clearer, more usable color selection experience for the brush tool and all other drawing tools.

## Assumptions

- Must work within Electron's Chromium renderer (no native OS picker dependency)
- Must maintain the existing color flow architecture (ColorPicker → app.ts → tools)
- Must support both dark and light themes via CSS variables
- Must maintain X key swap shortcut
- No external dependencies (plain HTML/CSS/JS per project conventions)

## Success Criteria

- Color picker provides a visual HSL/HSV spectrum for intuitive color selection
- Hex input field for precise color entry
- Larger, clearer fg/bg swatches with swap button
- Common color palette for quick access
- Maintains all existing API: `getForegroundColor()`, `getBackgroundColor()`, `setForegroundColor()`, `setBackgroundColor()`, `swapColors()`, `onChange()`

## Current State Analysis

### Current ColorPicker (`src/renderer/ui/ColorPicker.ts`)

- Two 20×20px native `<input type="color">` elements
- Classic Photoshop-style overlapping fg/bg layout in a 32×32px container
- Colors stored as hex strings (`#RRGGBB`)
- `onChange` callback distributes fg/bg to all tools
- Swap via `swapColors()` method

### Problems

1. **Tiny (20×20px) native color inputs** — hard to see current color at a glance
2. **OS-dependent picker popup** — inconsistent UX across platforms, modal dialog blocks interaction
3. **No hex input field** — can't type precise color values
4. **No color palette** — must use the OS picker for every color change
5. **Bottom strip location** — 40px color panel is cramped and easy to miss

## Selected Approach

Build an enhanced color picker with:

1. **Larger fg/bg swatches** (28×28px) with visible borders and a swap icon button
2. **Hex input field** for direct color entry
3. **HSL hue bar** — a horizontal gradient strip for quick hue selection
4. **Saturation/Lightness 2D area** — canvas-based SL picker for the selected hue
5. **Quick palette** — 2 rows of 8 common colors
6. **Move into the property panel** right side, below existing controls — more space
7. Keep the native `<input type="color">` as a hidden fallback activated by double-clicking swatches

### Alternatives Considered

- **Keep native `<input type="color">` but enlarge** — Still OS-dependent, no hex input, limited control. Rejected.
- **Full HSV wheel** — Complex to implement with canvas math, overkill for this app. Rejected.
- **Third-party color picker library** — Violates "no framework/no external dependencies" convention. Rejected.

## Architecture

### Color Picker Location

Move from the bottom `#color-panel` to the right-side `#property-panel`. The property panel already has sections for tool-specific controls. Add a "Colors" section at the top.

### Component Structure

```
ColorPicker (enhanced)
├── Fg/Bg swatches (28×28, overlapping) + swap button
├── Hex input field
├── Hue strip (horizontal gradient bar, 150×12px)
├── SL area (canvas 150×100px, saturation-lightness for current hue)
└── Quick palette (16 color cells in 2×8 grid)
```

### API (unchanged)

```typescript
class ColorPicker {
  constructor(container: HTMLElement)
  onChange(callback: (fg: string, bg: string) => void): void
  getForegroundColor(): string
  getBackgroundColor(): string
  setForegroundColor(color: string): void
  setBackgroundColor(color: string): void
  swapColors(): void
}
```

## References

- `src/renderer/ui/ColorPicker.ts` — current implementation (83 lines)
- `src/renderer/styles/app.css` — color-picker CSS (lines 184-227)
- `src/renderer/app.ts` — color picker wiring
- `src/renderer/index.html` — `#color-panel` element
