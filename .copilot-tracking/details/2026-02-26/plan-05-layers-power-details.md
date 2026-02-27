<!-- markdownlint-disable-file -->
# Implementation Details: Plan 05 — P2 Power: Layers and Effects

## Context Reference

Sources: `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` (monolithic plan Phase 6, Lines 191–227), `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` (monolithic details Lines 1050–1300), `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` (DrawingContext mitigation, Lines 300–320), `.copilot-tracking/research/subagents/2026-02-26/html5-canvas-patterns-research.md` (layer implementation patterns)

## Implementation Phase 1: Layers and Power Features

<!-- parallelizable: false -->

### Step 6.1: Implement layer system

> **ARCHITECTURAL WARNING:** This is the most architecturally disruptive step in the entire project. It changes PaintEngine.ts drawing routing and UndoManager state management.

Multi-layer architecture using stacked `<canvas>` elements with a layer panel UI.

Architecture:
- Each layer is a `<canvas>` element with `position: absolute` in the canvas container
- Layers stacked via `z-index`
- Layer panel UI on the right side: list of layers with thumbnails, visibility toggle (eye icon), name, reorder via drag
- Add layer: create new `<canvas>`, append to stack
- Remove layer: remove `<canvas>` from DOM
- Active layer: highlighted in panel, receives all drawing operations
- Flatten: `drawImage()` all layers onto a single canvas in order
- Merge down: `drawImage()` active layer onto layer below

Adapting existing tools:
- PaintEngine must track active layer and route all drawing to that layer's context
- If `DrawingContext` abstraction exists (from Plan 01), switch it from wrapping the single canvas to wrapping the active layer's canvas — transparent to all tools
- UndoManager stores per-layer snapshots or composite snapshots

Files:
* `src/renderer/canvas/LayerManager.ts` — Create layer management (add, remove, reorder, flatten, merge down, active tracking)
* `src/renderer/ui/LayerPanel.ts` — Create layer panel UI (thumbnails, visibility toggle, drag reorder, active highlight)
* `src/renderer/canvas/PaintEngine.ts` — Modify to route drawing to active layer's context
* `src/renderer/canvas/UndoManager.ts` — Adapt for multi-layer undo (per-layer or composite snapshots)

Discrepancy references:
* DD-01: Phase structure expanded for finer granularity

Success criteria:
* Multiple layers can be created and drawn on independently
* Layer visibility toggle hides/shows layers
* Layer reorder changes compositing order
* Flatten merges all layers correctly
* Undo/redo works correctly with layers

Context references:
* mac-paint-app-features-research.md (Lines 272–282) — Layer features
* html5-canvas-patterns-research.md — Layer implementation patterns
* plan-splitting-strategy-research.md (Lines 300–320) — DrawingContext mitigation

Dependencies:
* Plan 04 completion (all P1 features)

### Step 6.2: Implement lasso selection

Freeform path-based selection tool.

Implementation:
- On `pointerdown`: begin freeform path
- On `pointermove`: draw path on overlay, collect points
- On `pointerup`: close path, create selection mask from path interior
- Use `ctx.isPointInPath()` or manual scanline fill to determine which pixels are inside
- Marching ants on boundary

Files:
* `src/renderer/tools/LassoTool.ts` — Create lasso selection tool

Success criteria:
* Freeform path closes and creates a selection
* Selection mask correctly identifies interior pixels
* Marching ants display on boundary

Context references:
* mac-paint-app-features-research.md (Lines 224–224) — Lasso select

Dependencies:
* Step 4.1 (Selection infrastructure from Plan 04) completion

### Step 6.3: Implement gradient tool

Linear and radial gradient fills.

Implementation:
- Drag to define gradient direction and extent
- Linear: `ctx.createLinearGradient(x0, y0, x1, y1)` from foreground to background color
- Radial: `ctx.createRadialGradient(x0, y0, r0, x1, y1, r1)` from foreground to background
- Mode toggle in property panel: linear / radial
- If selection exists, fill only within selection bounds

Files:
* `src/renderer/tools/GradientTool.ts` — Create gradient tool

Success criteria:
* Linear gradients fill canvas from drag start to end
* Radial gradients create circular gradient from center
* Gradients use foreground and background colors

Context references:
* mac-paint-app-features-research.md (Lines 240–240) — Gradient fill

Dependencies:
* Step 3.1 (ColorPicker foreground/background from Plan 03) completion

### Step 6.4: Implement brush presets

Brush opacity, hardness, and preset library.

Implementation:
- Opacity: `ctx.globalAlpha` slider (0–100%)
- Hardness: generate brush tip with varying edge softness (gaussian blur on stamp)
- Presets: predefined brush configurations (pencil, marker, airbrush) saved as name + settings
- Preset picker in property panel

Files:
* `src/renderer/tools/BrushTool.ts` — Add opacity, hardness, presets
* `src/renderer/ui/PropertyPanel.ts` — Add brush preset picker

Success criteria:
* Opacity slider affects stroke transparency
* Hardness slider affects edge softness
* Presets switch between saved brush configurations

Context references:
* mac-paint-app-features-research.md (Lines 539–539) — Brush presets

Dependencies:
* Step 2.3 (BrushTool from Plan 02) completion

### Step 6.5: Implement image filters

Pixel manipulation filters: blur, sharpen, brightness/contrast, invert.

Implementation — all operate on `getImageData()`/`putImageData()`:
- **Invert**: `pixel[i] = 255 - pixel[i]` for R, G, B channels
- **Brightness**: add value to each RGB channel, clamp to 0–255
- **Contrast**: `factor = (259 * (contrast + 255)) / (255 * (259 - contrast))`, apply to each channel
- **Gaussian blur**: 3×3 or 5×5 kernel convolution

  Example 3×3 gaussian kernel:
  ```
  [1, 2, 1]
  [2, 4, 2]
  [1, 2, 1]  (normalize: divide by 16)
  ```

- **Sharpen**: 3×3 sharpening kernel:
  ```
  [ 0, -1,  0]
  [-1,  5, -1]
  [ 0, -1,  0]
  ```

- Apply to active layer (or selection if exists)

Files:
* `src/renderer/canvas/Filters.ts` — Create filter implementations
* Add menu items or UI for filter access

Success criteria:
* Invert reverses all colors visibly
* Brightness slider adjusts light levels
* Blur softens the image
* Sharpen enhances edges
* Contrast adjusts tonal range
* Filters apply only to selection if one exists

Context references:
* mac-paint-app-features-research.md (Lines 283–299) — Filters

Dependencies:
* Phase 2 completion (pixel manipulation infrastructure from Plan 02)

### Step 6.6: Implement transform tools

Rotate, flip, and scale operations.

Implementation:
- Rotate 90°/180°/270°: create rotated canvas via `ctx.translate()` + `ctx.rotate()` + `drawImage()`
- Flip horizontal: `ctx.scale(-1, 1)` + `drawImage()`
- Flip vertical: `ctx.scale(1, -1)` + `drawImage()`
- Scale: resize dialog with width/height, maintain aspect ratio option; `drawImage()` with new dimensions
- If selection exists, transform only the selected region (extract, transform, paste back)

Files:
* `src/renderer/canvas/Transform.ts` — Create transform operations

Success criteria:
* Rotate 90° works correctly
* Flip horizontal/vertical mirror the image
* Scale resizes with quality preservation
* Transforms work on selection when one exists

Context references:
* mac-paint-app-features-research.md (Lines 253–261) — Transform tools

Dependencies:
* Plan 03 completion

### Step 6.7: Implement transparency support

Alpha channel editing with checkerboard background display.

Implementation:
- Checkerboard pattern: CSS background on canvas container using `repeating-linear-gradient` or a tiled pattern
- New empty canvas starts transparent (not white) — show checkerboard through transparent areas
- Eraser removes to transparency (already implemented via `destination-out`)
- Alpha channel visible in all operations

Files:
* `src/renderer/styles/app.css` — Add checkerboard pattern
* `src/renderer/canvas/PaintEngine.ts` — Ensure canvas starts transparent

Success criteria:
* Empty canvas shows checkerboard pattern
* Erased areas show checkerboard through
* Transparency preserves when saving PNG

Dependencies:
* Plan 01 completion

### Step 6.8: Implement dark mode

Dark UI theme following macOS system preference with manual toggle.

Implementation:
- CSS `@media (prefers-color-scheme: dark)` for automatic system detection
- CSS variables for theme colors:
  - `--bg-primary` — main background
  - `--bg-secondary` — panel/sidebar background
  - `--text-primary` — main text color
  - `--border-color` — borders and dividers
- Manual toggle button in the UI
- Dark theme: dark gray backgrounds, light text, subtle borders
- Light theme: standard light backgrounds

Files:
* `src/renderer/styles/app.css` — Add dark mode CSS variables and media query

Success criteria:
* App follows macOS system appearance setting
* Manual toggle overrides system setting
* All UI elements are readable in both themes

Context references:
* mac-paint-app-features-research.md (Lines 543–543) — Dark mode

Dependencies:
* Step 3.8 (app.css base from Plan 03) completion

### Step 6.9: Implement grid overlay and status bar

Pixel grid at high zoom and status bar with cursor information.

Implementation:
- Grid overlay: at zoom ≥ 800%, draw 1px grid lines on a separate overlay canvas (grid lines align to pixel boundaries)
- Grid toggle in View menu or keyboard shortcut
- Status bar (bottom of window):
  - Cursor position (X, Y)
  - Zoom percentage
  - Canvas dimensions (W × H)
- Update on every `pointermove`

Files:
* `src/renderer/canvas/PaintEngine.ts` — Add grid overlay rendering
* `src/renderer/ui/StatusBar.ts` — Create status bar component

Success criteria:
* Grid appears at high zoom levels (≥ 800%)
* Grid lines align perfectly with pixel boundaries
* Status bar shows accurate cursor position and zoom

Context references:
* mac-paint-app-features-research.md (Lines 327–330) — Grid and status bar

Dependencies:
* Step 3.4 (zoom from Plan 03) completion

### Step 6.10: Validate Phase 6

Validation commands:
* `npx tsc --noEmit` — TypeScript compilation
* `npm start` — Manual testing

Manual testing checklist:
* Create 5 layers, draw on each independently
* Toggle layer visibility, verify compositing
* Reorder layers, verify z-order changes
* Apply each filter (invert, brightness, contrast, blur, sharpen)
* Apply each transform (rotate 90°, flip H, flip V, scale)
* Verify dark mode toggles correctly
* Zoom to 800%+ and verify grid overlay appears
* Verify status bar shows cursor position, zoom, and canvas size

Success criteria:
* `npx tsc --noEmit` passes with no errors
* All layer operations work correctly
* Filters apply visibly and correctly
* Transforms produce expected results
* Dark mode and grid overlay function as specified
