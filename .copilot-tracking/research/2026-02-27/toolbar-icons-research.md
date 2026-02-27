<!-- markdownlint-disable-file -->

# Toolbar Icons Research

## Scope

Replace all 15 Unicode/emoji toolbar icons with inline SVG icons that have a consistent 1990s Mac-classic visual style, improving recognizability and cross-platform rendering consistency.

## Assumptions

- Icons will be inline SVG strings set via `innerHTML` instead of `textContent`
- All icons use a consistent 16×16 viewBox, 1.5px stroke, no fill, monochrome `currentColor`
- The `ToolDef.icon` property will contain SVG markup strings
- `btn.textContent` will change to `btn.innerHTML` to render SVGs
- No external icon libraries — hand-crafted SVGs for Mac-classic aesthetic
- SVG icons inherit `currentColor` from the button, supporting dark/light theme and active state

## Success Criteria

1. All 15 toolbar icons render as recognizable SVG icons
2. Consistent visual style: same viewBox, stroke width, and stroke style
3. Icons render correctly at 18px font-size equivalent (toolbar button size)
4. Icons respect theme colors via `currentColor`
5. Active state (white on blue) works correctly with SVG icons
6. Visual verification via Playwright MCP screenshots

## Evidence Log

### Source: Toolbar.ts (current state)
- 15 tools defined in `TOOLS` array as `ToolDef` objects
- Icons set via `btn.textContent = tool.icon`
- Mixed Unicode symbols and emoji — inconsistent rendering across platforms
- Emoji icons (🪣, 🎯, 💉) render with color on some platforms, breaking theme

### Source: app.css (current state)
- `.toolbar-btn` has `font-size: 18px`, `color: var(--text-primary)`
- Active state sets `color: #ffffff`
- 40×40px buttons in 48px-wide toolbar

## Selected Approach

**Inline SVG strings** in the `TOOLS` array `icon` property, rendered via `btn.innerHTML`.

### Rationale
- No dependencies needed
- Full control over icon design
- Inherits `currentColor` from CSS for theme support
- Consistent rendering across all platforms
- Matches Mac-classic 1-bit icon aesthetic

### Icon Design Specifications
- ViewBox: `0 0 16 16`
- Stroke: `currentColor`, width `1.5`
- Fill: `none` (unless a specific icon needs solid fills for recognition)
- Stroke-linecap: `round`
- Stroke-linejoin: `round`
- Size on button: inherits from container (flex centered)

### Rejected Alternatives
1. **Icon font library (Lucide/Feather)**: Adds dependency, icons too modern for Mac-classic aesthetic
2. **External SVG sprite sheet**: Over-engineered for 15 icons, adds HTTP request
3. **CSS background images**: Harder to theme, doesn't support currentColor

## 15 Icon Designs

| # | Tool | Icon Design Description |
|---|---|---|
| 1 | brush | Angled brush with bristle tip and handle |
| 2 | eraser | Rectangular eraser block (simple wedge shape) |
| 3 | fill | Paint bucket with pour drip |
| 4 | gradient | Rectangle with diagonal gradient lines |
| 5 | selection | Crosshair/target circle |
| 6 | marquee | Dashed rectangle (marching ants) |
| 7 | lasso | Free-form lasso loop |
| 8 | eyedropper | Pipette/eyedropper pointing down |
| 9 | text | Letter "A" with baseline |
| 10 | line | Diagonal line with endpoint dots |
| 11 | rectangle | Simple rectangle outline |
| 12 | ellipse | Simple ellipse outline |
| 13 | roundedRect | Rectangle with rounded corners |
| 14 | polygon | Pentagon/hexagon outline |
| 15 | curve | Bezier curve with control point |

## Next Steps

1. Create implementation plan
2. Implement SVG icons in Toolbar.ts
3. Add CSS adjustments for SVG sizing
4. Verify with Playwright MCP
