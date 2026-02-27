# Toolbar Implementation Research

## Research Topics

1. Toolbar buttons — names, icons, labels
2. Toolbar structure — HTML, CSS, TypeScript
3. Available tools and identifiers
4. Icon rendering method
5. CSS styling for toolbar buttons
6. Existing icon-related code or assets

---

## Key Files Analyzed

| File | Purpose |
|---|---|
| `src/renderer/ui/Toolbar.ts` | Toolbar component (63 lines) |
| `src/renderer/styles/app.css` | All styling (465 lines) |
| `src/renderer/index.html` | HTML structure |
| `src/renderer/app.ts` | App initialization, tool wiring |
| `src/renderer/tools/Tool.ts` | Tool interface definition |

---

## 1. Toolbar Buttons — Complete Inventory

The toolbar has **15 tools** defined in a `TOOLS` constant array of `ToolDef` objects:

| # | `name` | `icon` | `shortcut` | Icon Type |
|---|---|---|---|---|
| 1 | `brush` | ✏ (U+270F) | B | Unicode symbol |
| 2 | `eraser` | ◻ (U+25FB) | E | Unicode symbol |
| 3 | `fill` | 🪣 (U+1FAA3) | G | Emoji |
| 4 | `gradient` | ▦ (U+25A6) | D | Unicode symbol |
| 5 | `selection` | 🎯 (U+1F3AF) | W | Emoji |
| 6 | `marquee` | ⬚ (U+2B1A) | M | Unicode symbol |
| 7 | `lasso` | ⌇ (U+2307) | A | Unicode symbol |
| 8 | `eyedropper` | 💉 (U+1F489) | I | Emoji |
| 9 | `text` | T | T | Plain letter |
| 10 | `line` | ╱ (U+2571) | L | Unicode box drawing |
| 11 | `rectangle` | □ (U+25A1) | R | Unicode symbol |
| 12 | `ellipse` | ○ (U+25CB) | O | Unicode symbol |
| 13 | `roundedRect` | ▢ (U+25A2) | U | Unicode symbol |
| 14 | `polygon` | ⬡ (U+2B21) | P | Unicode symbol |
| 15 | `curve` | 〰 (U+3030) | C | Unicode wavy dash |

### Icon Categories

- **Emoji (3):** fill (🪣), selection (🎯), eyedropper (💉)
- **Unicode geometric/box symbols (11):** brush, eraser, gradient, marquee, lasso, line, rectangle, ellipse, roundedRect, polygon, curve
- **Plain text (1):** text (T)

---

## 2. Toolbar TypeScript Structure (`Toolbar.ts`)

### `ToolDef` Interface (exported)

```typescript
export interface ToolDef {
  name: string;
  icon: string;
  shortcut: string;
}
```

### `TOOLS` Constant

Module-level `const TOOLS: ToolDef[]` array containing 15 tool definitions.

### `Toolbar` Class (exported)

- **Properties:**
  - `buttons: Map<string, HTMLButtonElement>` — maps tool name to button element
  - `activeTool: string` — defaults to `'brush'`
  - `onToolChangeCallback: ((toolName: string) => void) | null`

- **Constructor:** Takes `HTMLElement` container, calls `render()`.

- **`render(container)`:** Iterates `TOOLS`, creates `<button>` elements:
  - Sets `className = 'toolbar-btn'`
  - Sets `dataset.tool = tool.name`
  - Sets `title` to capitalized name + shortcut: e.g., `"Brush (B)"`
  - **Sets icon via `btn.textContent = tool.icon`** ← KEY: uses `textContent`, not `innerHTML`
  - Adds `pointerdown` listener calling `selectTool()`
  - Appends button to container

- **`onToolChange(callback)`:** Registers callback for tool changes.

- **`selectTool(name)`:** Updates `activeTool`, calls `updateActiveState()`, fires callback.

- **`getActiveTool()`:** Returns current tool name.

- **`updateActiveState()`:** Toggles `.active` class on all buttons.

---

## 3. HTML Structure (`index.html`)

```html
<div id="app">
  <div id="toolbar"></div>          <!-- Toolbar buttons go here -->
  <div id="canvas-container">
    <canvas id="paint-canvas"></canvas>
  </div>
  <div id="property-panel"></div>
  <div id="color-panel"></div>
  <div id="status-bar">...</div>
</div>
```

The `#toolbar` div is empty in HTML — buttons are dynamically created by `Toolbar.ts`.

---

## 4. Icon Rendering Method

**Icons are set via `btn.textContent = tool.icon`** — plain text content of Unicode characters or emoji. No SVGs, no images, no `innerHTML`, no CSS backgrounds, no icon fonts.

### No Icon Libraries

- **No icon library dependencies** in `package.json` (no lucide, feather, heroicons, material-icons, font-awesome, phosphor, etc.)
- **No SVG icon files** in the project (no `icons/`, `assets/` directories exist)
- **No `<svg>` elements** or SVG strings in the toolbar code
- The only `.png` files in the project root are user-created paint outputs (not icons)

---

## 5. CSS Styling for Toolbar Buttons

### Container (`#toolbar`)

```css
#toolbar {
  grid-area: toolbar;
  background: var(--bg-secondary);       /* #252526 dark / #ffffff light */
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  gap: 2px;
}
```

- Width set by CSS variable: `--toolbar-width: 48px`
- Vertical flex column layout, buttons stacked top-to-bottom
- 4px padding, 2px gap between buttons

### Button (`.toolbar-btn`)

```css
.toolbar-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-primary);            /* #cccccc dark / #1e1e1e light */
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
```

### Hover State (`.toolbar-btn:hover`)

```css
.toolbar-btn:hover {
  background: var(--bg-tertiary);        /* #2d2d30 dark / #e8e8e8 light */
  border-color: var(--border-color);     /* #3e3e42 dark / #d4d4d4 light */
}
```

### Active State (`.toolbar-btn.active`)

```css
.toolbar-btn.active {
  background: var(--accent-color);       /* #0078d4 */
  border-color: var(--accent-color);
  color: #ffffff;
}
```

### Styling Summary

- 40×40px buttons in a 48px-wide toolbar
- Default: transparent background, themed text color, 18px font
- Hover: subtle background fill + border
- Active: blue accent color background with white text
- Smooth 0.15s transitions on background and border

---

## 6. Tool-to-Implementation Mapping (from `app.ts`)

The `toolMap` in `app.ts` maps toolbar names to `Tool` implementations:

| Toolbar Name | Tool Implementation | File |
|---|---|---|
| `brush` | `BrushTool` | `tools/BrushTool.ts` |
| `eraser` | `EraserTool` | `tools/EraserTool.ts` |
| `fill` | `FillTool` | `tools/FillTool.ts` |
| `gradient` | `GradientTool` | `tools/GradientTool.ts` |
| `selection` | `selectionToolWrapper` (wraps `ColorSelection`) | inline in `app.ts` |
| `marquee` | `SelectionTool` | `tools/SelectionTool.ts` |
| `lasso` | `LassoTool` | `tools/LassoTool.ts` |
| `eyedropper` | `EyedropperTool` | `tools/EyedropperTool.ts` |
| `text` | `TextTool` | `tools/TextTool.ts` |
| `line` | `ShapeTool` (shapeType='line') | `tools/ShapeTool.ts` |
| `rectangle` | `ShapeTool` (shapeType='rectangle') | `tools/ShapeTool.ts` |
| `ellipse` | `ShapeTool` (shapeType='ellipse') | `tools/ShapeTool.ts` |
| `roundedRect` | `ShapeTool` (shapeType='roundedRect') | `tools/ShapeTool.ts` |
| `polygon` | `ShapeTool` (shapeType='polygon') | `tools/ShapeTool.ts` |
| `curve` | `CurveTool` | `tools/CurveTool.ts` |

---

## 7. Theme Support

The toolbar respects the app's dark/light theme via CSS variables:

- Dark mode (default): dark background, light text
- Light mode: light background, dark text
- Manual theme override via `[data-theme]` attribute
- Active tool button always uses `--accent-color` (#0078d4) regardless of theme

---

## Key Findings Summary

1. **All 15 toolbar icons are Unicode text characters/emoji** — no SVGs, images, or icon fonts.
2. **Icons set via `btn.textContent`** — pure text, not innerHTML or CSS.
3. **No icon assets exist anywhere in the project** — no `icons/`, `assets/`, or SVG directories.
4. **No icon library dependencies** in `package.json`.
5. **Toolbar is 48px wide** with 40×40px buttons, using flex column layout.
6. **Icons render at 18px font-size** using the system font stack.
7. **Mixed icon quality** — some emoji icons (🪣, 🎯, 💉) may render inconsistently across platforms vs the Unicode geometric symbols (□, ○, ▢).
8. **The `ToolDef` interface is exported** and could be extended or its `icon` property changed to support other icon formats.

---

## Clarifying Questions

None — research is complete.

## Recommended Next Research (if planning icon changes)

- [ ] Evaluate SVG icon libraries compatible with Electron/Vite (lucide, feather, heroicons, phosphor, tabler)
- [ ] Research inline SVG vs icon font vs sprite sheet approaches for Electron apps
- [ ] Benchmark rendering performance of SVG icons vs Unicode text in Electron
- [ ] Review Mac Paint Classic (1984) icon designs for nostalgic styling references
