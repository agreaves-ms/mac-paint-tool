<!-- markdownlint-disable-file -->
# Implementation Details: Plan 06 — P3 Advanced and Final Validation

## Context Reference

Sources: `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` (P3 features), `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` (Lines 1300–1492, Phases 7–8), `.copilot-tracking/research/subagents/2026-02-26/html5-canvas-patterns-research.md` (Canvas API patterns)

## Implementation Phase 7: Advanced Features

<!-- parallelizable: false -->

### Step 7.1: Implement blend modes

Per-layer blend modes using `globalCompositeOperation`.

Implementation:
- Layer blend mode selector in layer panel: Normal, Multiply, Screen, Overlay, Darken, Lighten
- Map to Canvas `globalCompositeOperation` values:
  - Normal → `source-over`
  - Multiply → `multiply`
  - Screen → `screen`
  - Overlay → `overlay`
  - Darken → `darken`
  - Lighten → `lighten`
- Apply during layer compositing: when flattening or rendering the composite view, set `globalCompositeOperation` on the output canvas context before calling `drawImage()` for each layer

Files:
* `src/renderer/canvas/LayerManager.ts` — Add `blendMode` property to layer interface, default to `'source-over'`; apply blend mode in compositing loop
* `src/renderer/ui/LayerPanel.ts` — Add blend mode dropdown per layer; update on change

Success criteria:
* Blend mode changes are visible immediately in the composite view
* Multiply darkens, Screen lightens as expected
* Default (Normal) behavior is unchanged

Context references:
* mac-paint-app-features-research.md (Lines 555-555) — Blend modes

Dependencies:
* Plan 05 Step 6.1 (layers) completion

### Step 7.2: Implement layer opacity

Per-layer transparency slider.

Implementation:
- Add `opacity` property (0.0–1.0) to layer interface, default 1.0
- Set `globalAlpha` to layer opacity value before `drawImage()` during compositing
- Restore `globalAlpha` to 1.0 after each layer is drawn
- Opacity slider (0–100%) in layer panel for each layer
- Layer thumbnail reflects opacity (render thumbnail with globalAlpha applied)

Files:
* `src/renderer/canvas/LayerManager.ts` — Add `opacity` property to layer interface; apply `globalAlpha` in compositing loop
* `src/renderer/ui/LayerPanel.ts` — Add opacity slider per layer (range input 0–100); update layer opacity on input change

Success criteria:
* Layer opacity slider changes transparency in real time
* Thumbnail preview reflects opacity
* 100% opacity = fully opaque (default), 0% = fully transparent

Context references:
* mac-paint-app-features-research.md (Lines 556-556) — Layer opacity

Dependencies:
* Plan 05 Step 6.1 (layers) completion

### Step 7.3: Implement pressure sensitivity

Variable brush width from `PointerEvent.pressure` for stylus and trackpad.

Implementation:
- Read `e.pressure` from PointerEvent (range 0.0–1.0)
- Map pressure to line width: `width = minWidth + pressure * (maxWidth - minWidth)`
  - `minWidth` = 1 (or configurable minimum)
  - `maxWidth` = current line size slider value
- Only apply pressure mapping when `e.pointerType === 'pen'` (stylus) or trackpad force events
- Mouse input always reports `pressure = 0.5` — use this as default, behavior unchanged
- Render variable-width strokes by drawing filled circles at each point with `radius = pressureMappedWidth / 2`
- Interpolate between points for smooth strokes when pointer moves quickly
- Apply same logic to both BrushTool and EraserTool

Files:
* `src/renderer/tools/BrushTool.ts` — Add pressure reading in `onPointerMove`, apply pressure-to-width mapping, render variable-width circles instead of fixed-width `lineTo`
* `src/renderer/tools/EraserTool.ts` — Add pressure support mirroring BrushTool implementation

Success criteria:
* Pressing harder with stylus produces thicker strokes
* Light pressure produces thin strokes
* Mouse input (pressure always 0.5) works unchanged — no regression
* Smooth variable-width strokes without gaps

Context references:
* mac-paint-app-features-research.md (Lines 557-557) — Pressure sensitivity

Dependencies:
* Plan 02 Step 2.3 (BrushTool) completion

### Step 7.4: Implement custom brush engine

User-defined brush textures, spacing, and jitter.

Implementation:
- Brush stamp: draw brush tip onto a small offscreen canvas, stamp along stroke path using `drawImage()`
- Spacing: control distance between stamps as percentage of brush diameter (e.g., 25% = stamp every quarter of diameter)
  - Calculate distance between consecutive points; accumulate until spacing threshold reached
- Scatter/jitter: random offset perpendicular to stroke direction
  - Offset = random value × scatter amount in pixels
- Rotation: stamp rotation along stroke path (angle = atan2 of direction) or random rotation
  - Apply via `ctx.rotate()` before stamping
- Texture: load image file as brush tip via `Image()` + `drawImage()`
  - Default round brush tip as fallback
- Preset save/load:
  - Preset = JSON object: `{ name, tipImageData, spacing, scatter, rotation, size }`
  - Save to localStorage or app data directory
  - Load from preset list UI

Files:
* `src/renderer/tools/BrushEngine.ts` — Create new: BrushEngine class with `stamp()`, `strokeTo()`, spacing accumulator, scatter calculation, rotation, tip loading
* `src/renderer/ui/BrushPresetPanel.ts` — Create new: Preset list UI, save/load/delete presets, tip preview

Success criteria:
* Custom brush tips stamp correctly along stroke path
* Spacing parameter controls stamp density (low = dense, high = sparse)
* Jitter adds natural randomness to stamp positions
* Presets save and restore correctly across sessions

Context references:
* mac-paint-app-features-research.md (Lines 558-558) — Custom brush engine

Dependencies:
* Plan 05 Step 6.4 (brush presets) completion

### Step 7.5: Implement curves/levels

Color correction with histogram display.

Implementation:
- Levels:
  - Input range: black point (0–255), white point (0–255) — clamp input values
  - Output range: map clamped input to output range
  - Per-channel: separate R, G, B controls + combined RGB mode
  - Formula: `output = outputMin + ((input - inputBlack) / (inputWhite - inputBlack)) * (outputMax - outputMin)`
  - Clamp result to 0–255
- Curves:
  - 256-entry lookup table (LUT) per channel
  - User adds/drags control points on a curve graph
  - Interpolate between control points using monotone cubic spline
  - Apply LUT: `outputPixel[channel] = LUT[channel][inputPixel[channel]]`
- Histogram:
  - Calculate pixel value distribution for R, G, B channels
  - Count occurrences of each value 0–255 using `getImageData()`
  - Display as bar chart overlay in curves dialog
- Apply:
  - Get `ImageData` from active layer
  - Map each pixel through LUT
  - Put modified `ImageData` back

Files:
* `src/renderer/canvas/Adjustments.ts` — Create new: `applyLevels()`, `applyCurves()`, `buildLUT()`, `calculateHistogram()`, cubic spline interpolation
* `src/renderer/ui/CurvesDialog.ts` — Create new: Curves/levels dialog with canvas-based curve editor, histogram display, channel selector, draggable control points, preview toggle

Success criteria:
* Levels adjust black/white points correctly — dragging black point right darkens shadows
* Curves UI is draggable and updates preview in real time
* Histogram displays accurate R/G/B distribution
* Per-channel and combined modes work independently

Context references:
* mac-paint-app-features-research.md (Lines 290-291) — Levels and Curves

Dependencies:
* Plan 05 Step 6.5 (filters infrastructure) completion

### Step 7.6: Implement symmetry drawing

Multi-axis mirror drawing mode.

Implementation:
- Symmetry axes: 1 (horizontal or vertical mirror), 2–12 rotational axes
- Mirror mode (1 axis):
  - Reflect stroke points across the selected axis (horizontal center or vertical center)
  - For horizontal mirror: `mirroredX = canvasWidth - x`
  - For vertical mirror: `mirroredY = canvasHeight - y`
- Rotational symmetry (N axes, N ≥ 2):
  - Center of rotation = canvas center (or user-defined)
  - For each stroke point, generate N-1 additional points rotated by `(360/N) * k` degrees for k = 1..N-1
  - Rotation formula:
    - `dx = x - centerX`, `dy = y - centerY`
    - `rotatedX = centerX + dx * cos(angle) - dy * sin(angle)`
    - `rotatedY = centerY + dx * sin(angle) + dy * cos(angle)`
- All duplicated strokes draw simultaneously during pointer move
- Visual overlay: draw symmetry axes as dashed lines on a non-destructive overlay canvas
- Toggle: symmetry mode on/off in tool options, axis count selector

Files:
* `src/renderer/tools/BrushTool.ts` — Add symmetry mode: when enabled, duplicate stroke points across axes and draw all simultaneously
* `src/renderer/ui/PropertyPanel.ts` — Add symmetry controls: on/off toggle, axis type (mirror H/V, rotational), axis count slider (2–12)

Success criteria:
* Horizontal mirror duplicates strokes across vertical center line
* Rotational symmetry (e.g., 6-axis) creates mandala-like patterns
* Symmetry axes are visually indicated with dashed overlay lines
* Toggle on/off works without affecting existing canvas content

Context references:
* mac-paint-app-features-research.md (Lines 562-562) — Symmetry drawing

Dependencies:
* Plan 02 Step 2.3 (BrushTool) completion

### Step 7.7: Validate Advanced Features

Validation commands:
* `npx tsc --noEmit` — TypeScript compilation check
* `npm start` — Launch app and manually test:
  - Blend modes: select different modes, verify visual compositing
  - Layer opacity: slide to 50%, verify transparency
  - Pressure: test with trackpad/stylus if available, verify mouse unchanged
  - Custom brushes: create preset, stamp along path, verify spacing/jitter
  - Curves/levels: open dialog, adjust curve, verify pixel changes
  - Symmetry: enable 6-axis, draw stroke, verify rotational pattern

## Implementation Phase 8: Final Validation

<!-- parallelizable: false -->

### Step 8.1: Run full project validation

Execute all validation commands for the complete project:

Commands:
* `npx tsc --noEmit` — TypeScript compilation check (zero errors expected)
* `npm run lint` — Linting check (if configured)
* `npm run make` — Build distributables for current platform

The `npm run make` command should produce a distributable app in the `out/` directory. Verify the output exists and the app launches from the built artifact.

### Step 8.2: Fix minor validation issues

Iterate on TypeScript errors, build warnings, and any runtime issues discovered during validation. Apply fixes directly when corrections are straightforward and isolated. Do not attempt large-scale refactoring.

### Step 8.3: End-to-end functional testing

Comprehensive manual testing covering all features from Plans 01–06:

**Complete workflow:**
* New document → draw with brush → fill with paint bucket → select region → add text → save → reopen → verify integrity

**Tool testing:**
* Each tool with line size slider at min (1), mid (50), max (100)

**Paint bucket tolerance:**
* Test at tolerance values: 0, 32, 128, 255
* Verify: 0 = exact match only, 255 = fills everything

**Color-tolerance selection gradiance:**
* Test at gradiance values: 0, 32, 128, 255
* Verify: 0 = exact match only, 255 = selects all similar colors

**Undo/redo:**
* Perform 50+ operations, undo all, redo all — verify state consistency

**Layers:**
* Create 5 layers, draw on each, reorder, flatten — verify correct compositing

**File I/O:**
* Save as PNG, JPEG, WebP
* Reopen each format — verify pixel data preserved (PNG lossless, JPEG approximate)

### Step 8.4: Report blocking issues

When validation failures require changes beyond minor fixes:
* Document the issues and affected files
* Provide the user with next steps and recommendations
* Recommend additional research and planning rather than inline fixes
* Avoid large-scale refactoring within this phase
* Categorize issues by severity: critical (app won't build/launch), major (feature broken), minor (cosmetic/warning)

## Dependencies

* Plan 05 completion — layer system must exist for blend modes, layer opacity, and filter infrastructure
* Plan 02 completion — BrushTool and EraserTool must exist for pressure sensitivity and symmetry
* Plan 05 Step 6.4 — brush presets must exist for custom brush engine extension
* Plan 05 Step 6.5 — filters infrastructure must exist for curves/levels

## Success Criteria

* All P3 features implemented and functional
* Blend modes composite correctly using globalCompositeOperation
* Pressure sensitivity produces variable-width strokes with stylus; mouse unchanged
* Custom brushes stamp along path with configurable spacing and jitter
* Curves/levels dialog provides draggable curve editing with histogram
* Symmetry drawing creates mirrored/rotational patterns correctly
* `npx tsc --noEmit` passes with zero errors
* `npm run make` produces distributable app bundle in `out/`
* E2E tests cover complete workflow, all tools at min/mid/max, all tolerance/gradiance ranges, 50+ undo/redo, layer operations, and multi-format file I/O
