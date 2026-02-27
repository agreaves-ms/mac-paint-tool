<!-- markdownlint-disable-file -->

# Toolbar SVG Icons - Changes Log

## Related Plan
`.copilot-tracking/plans/2026-02-27/toolbar-icons-plan.instructions.md`

## Implementation Date
2026-02-27

## Summary of Changes
Replaced all 15 Unicode/emoji toolbar icons with consistent inline SVG icons designed in a 1990s Mac-classic monochrome style. Changed icon rendering from `textContent` to `innerHTML` for SVG support. Added CSS rules for SVG sizing within toolbar buttons.

## Changes by Category

### Modified
- `src/renderer/ui/Toolbar.ts`
  - Added shared `svgAttrs` constant for consistent SVG attributes (viewBox 0 0 16 16, stroke 1.5px, currentColor, round linecaps/linejoins)
  - Replaced all 15 Unicode/emoji `icon` strings in `TOOLS` array with inline SVG markup
  - Changed `btn.textContent = tool.icon` to `btn.innerHTML = tool.icon` in `render()` method

- `src/renderer/styles/app.css`
  - Added `.toolbar-btn svg` rule with `width: 18px; height: 18px` for SVG sizing within buttons

### Icon Design Inventory
| # | Tool | Design |
|---|---|---|
| 1 | brush | Angled pen/pencil tip with edit line |
| 2 | eraser | Wedge eraser with baseline |
| 3 | fill | Triangle bucket with pour droplet |
| 4 | gradient | Rectangle with vertical division lines |
| 5 | selection | Crosshair target with inner circle |
| 6 | marquee | Dashed rectangle (marching ants) |
| 7 | lasso | Dashed freeform selection loop |
| 8 | eyedropper | Angled pipette shape with tip |
| 9 | text | Serif "T" with top bar and baseline |
| 10 | line | Diagonal line with solid endpoint dots |
| 11 | rectangle | Simple rectangle outline |
| 12 | ellipse | Horizontal ellipse outline |
| 13 | roundedRect | Rectangle with rounded corners (rx=3) |
| 14 | polygon | Pentagon outline |
| 15 | curve | Bezier curve with control point dots |

## Additional Changes
None — implementation matched the plan exactly.
