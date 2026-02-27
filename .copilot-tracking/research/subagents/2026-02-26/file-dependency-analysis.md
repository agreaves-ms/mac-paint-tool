<!-- markdownlint-disable-file -->
# File Dependency Analysis: Mac Paint App Implementation Plan

## Research Topics

- Map every source file referenced in the implementation details to the phase/step where it is created or modified
- Identify "hot files" modified across 3+ phases
- Build dependency chains per file
- Recommend split points that minimize cross-plan file conflicts

## Source

All data extracted from `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` (1500 lines, 8 phases, 42 steps).

---

## File × Phase Matrix

Legend: **C** = Created (first meaningful implementation), **M** = Modified, **S** = Scaffold-generated, **(stub)** = directory structure placeholder

### Configuration & Scaffold Files

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Touches |
|---|---|---|---|---|---|---|---|---|---|
| `package.json` | S:1.1 | | | | | | | | 1 |
| `forge.config.ts` | S:1.1 | | | | | | | | 1 |
| `tsconfig.json` | S:1.1 | | | | | | | | 1 |
| `vite.main.config.ts` | S:1.1 | | | | | | | | 1 |
| `vite.renderer.config.ts` | S:1.1 | | | | | | | | 1 |
| `vite.preload.config.ts` | S:1.1 | | | | | | | | 1 |

### Core Application Files

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Touches |
|---|---|---|---|---|---|---|---|---|---|
| **`src/main.ts`** | S:1.1 M:1.2 | | M:3.5 M:3.6 | M:4.4 | M:5.2 | | | | **5 phases** |
| **`src/preload.ts`** | S:1.1 M:1.2 | | M:3.5 | M:4.4 | | | | | **3 phases** |
| `src/renderer/index.html` | S:1.1 M:1.2 M:1.3 | | | | | | | | 1 |
| `src/renderer/app.ts` | C:1.2 | | M:3.7 | | | | | | 2 |
| `src/shared/types.ts` | C:1.2 | M:2.2 | | | | | | | 2 |

### Canvas Engine Files

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Touches |
|---|---|---|---|---|---|---|---|---|---|
| **`src/renderer/canvas/PaintEngine.ts`** | | C:2.1 | M:3.4 M:3.5 M:3.6 | M:4.1 M:4.4 | M:5.1 M:5.2 M:5.3 | M:6.1 M:6.7 M:6.9 | | | **5 phases, 12 steps** |
| `src/renderer/canvas/FloodFill.ts` | | C:2.6 | | | | | | | 1 |
| `src/renderer/canvas/ColorSelection.ts` | | C:2.7 | | | | | | | 1 |
| `src/renderer/canvas/UndoManager.ts` | | C:2.8 | | | | M:6.1 | | | 2 |
| `src/renderer/canvas/LayerManager.ts` | | | | | | C:6.1 | M:7.1 M:7.2 | | 2 |
| `src/renderer/canvas/Filters.ts` | | | | | | C:6.5 | | | 1 |
| `src/renderer/canvas/Transform.ts` | | | | | | C:6.6 | | | 1 |
| `src/renderer/canvas/Adjustments.ts` | | | | | | | C:7.5 | | 1 |

### Tool Files

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Touches |
|---|---|---|---|---|---|---|---|---|---|
| `src/renderer/tools/Tool.ts` | | C:2.2 | | | | | | | 1 |
| **`src/renderer/tools/BrushTool.ts`** | | C:2.3 | | | | M:6.4 | M:7.3 M:7.6 | | **3 phases** |
| `src/renderer/tools/EraserTool.ts` | | C:2.4 | | | | | M:7.3 | | 2 |
| `src/renderer/tools/ShapeTool.ts` | | C:2.5 | | | M:5.4 | | | | 2 |
| `src/renderer/tools/FillTool.ts` | (stub:1.2) | | | | | | | | 1★ |
| `src/renderer/tools/SelectionTool.ts` | (stub:1.2) | | | C:4.1 | | | | | 1 |
| `src/renderer/tools/TextTool.ts` | (stub:1.2) | | | C:4.3 | | | | | 1 |
| `src/renderer/tools/EyedropperTool.ts` | | | | C:4.2 | | | | | 1 |
| `src/renderer/tools/CurveTool.ts` | | | | | C:5.5 | | | | 1 |
| `src/renderer/tools/LassoTool.ts` | | | | | | C:6.2 | | | 1 |
| `src/renderer/tools/GradientTool.ts` | | | | | | C:6.3 | | | 1 |
| `src/renderer/tools/BrushEngine.ts` | | | | | | | C:7.4 | | 1 |

> ★ `FillTool.ts` is listed in the 1.2 directory structure but has **no step** that explicitly implements it. The flood fill logic lives in `FloodFill.ts` (Step 2.6). FillTool.ts likely acts as a thin wrapper — this is a **potential gap** in the details.

### UI Component Files

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Touches |
|---|---|---|---|---|---|---|---|---|---|
| **`src/renderer/ui/PropertyPanel.ts`** | | | C:3.3 | M:4.3 | | M:6.4 | M:7.6 | | **4 phases** |
| `src/renderer/ui/Toolbar.ts` | | | C:3.2 | M:4.2 | | | | | 2 |
| `src/renderer/ui/ColorPicker.ts` | | | C:3.1 | | | | | | 1 |
| `src/renderer/ui/NewDocumentDialog.ts` | | | C:3.6 | | | | | | 1 |
| `src/renderer/ui/ResizeDialog.ts` | | | | | C:5.1 | | | | 1 |
| `src/renderer/ui/LayerPanel.ts` | | | | | | C:6.1 | M:7.1 M:7.2 | | 2 |
| `src/renderer/ui/StatusBar.ts` | | | | | | C:6.9 | | | 1 |
| `src/renderer/ui/BrushPresetPanel.ts` | | | | | | | C:7.4 | | 1 |
| `src/renderer/ui/CurvesDialog.ts` | | | | | | | C:7.5 | | 1 |

### Style Files

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Touches |
|---|---|---|---|---|---|---|---|---|---|
| **`src/renderer/styles/app.css`** | C:1.3 | | M:3.8 | | | M:6.7 M:6.8 | | | **3 phases** |

---

## Hot Files (Modified in 3+ Phases)

Ranked by total step touches across phases:

| Rank | File | Phases Touched | Total Steps | Details |
|---|---|---|---|---|
| 🔴 1 | `src/renderer/canvas/PaintEngine.ts` | **5** (P2–P6) | **12** | Created P2. Modified for zoom (3.4), file I/O (3.5), new doc (3.6), selection state (4.1), clipboard (4.4), resize/crop (5.1), export (5.2), drag-drop (5.3), layers (6.1), transparency (6.7), grid/statusbar (6.9) |
| 🟠 2 | `src/main.ts` | **5** (P1–P5) | **6** | Scaffold P1. Modified for structure (1.2), IPC file handlers (3.5), menu items (3.6), clipboard IPC (4.4), export filters (5.2) |
| 🟡 3 | `src/renderer/ui/PropertyPanel.ts` | **4** (P3–P7) | **4** | Created P3. Modified for text controls (4.3), brush presets (6.4), symmetry controls (7.6) |
| 🟡 4 | `src/preload.ts` | **3** (P1, P3, P4) | **4** | Scaffold P1. Modified for structure (1.2), file I/O bridge (3.5), clipboard bridge (4.4) |
| 🟡 5 | `src/renderer/tools/BrushTool.ts` | **3** (P2, P6, P7) | **4** | Created P2. Modified for presets/opacity (6.4), pressure sensitivity (7.3), symmetry (7.6) |
| 🟡 6 | `src/renderer/styles/app.css` | **3** (P1, P3, P6) | **4** | Created P1. Modified for component styles (3.8), checkerboard transparency (6.7), dark mode (6.8) |

---

## Dependency Chains Per File

### Critical Path: `PaintEngine.ts`

```
Step 2.1 [C] Canvas init, coordinate mapping, pointer events
  └─ Step 3.4 [M] + zoom/pan via CSS transform, coordinate adjustment
  └─ Step 3.5 [M] + save/open methods (IPC bridge)
  └─ Step 3.6 [M] + newDocument(width, height, bgColor) method
  └─ Step 4.1 [M] + selection state management
  └─ Step 4.4 [M] + clipboard methods (copy/cut/paste)
  └─ Step 5.1 [M] + resize/crop methods
  └─ Step 5.2 [M] + format-specific export
  └─ Step 5.3 [M] + drag-and-drop handlers
  └─ Step 6.1 [M] + route drawing to active layer context
  └─ Step 6.7 [M] + ensure canvas starts transparent
  └─ Step 6.9 [M] + grid overlay rendering
```

This file accumulates responsibility across 12 steps. By Phase 6, it manages: canvas init, pointer events, coordinate mapping, zoom/pan, file I/O, document lifecycle, selection state, clipboard, canvas resize, export, drag-drop, layer routing, transparency, and grid overlay.

### Critical Path: `src/main.ts`

```
Step 1.1 [S] Electron scaffold
  └─ Step 1.2 [M] Window size, title, menu
  └─ Step 3.5 [M] + IPC handlers: dialog:openFile, dialog:saveFile
  └─ Step 3.6 [M] + File > New menu item with accelerator
  └─ Step 4.4 [M] + Clipboard IPC handlers
  └─ Step 5.2 [M] + Update save dialog filters (PNG, JPEG, WebP)
```

### Critical Path: `PropertyPanel.ts`

```
Step 3.3 [C] Line size slider, tolerance slider, gradiance slider, shape mode toggle
  └─ Step 4.3 [M] + text-specific controls (font family, size, bold/italic)
  └─ Step 6.4 [M] + brush preset picker (opacity, hardness)
  └─ Step 7.6 [M] + symmetry controls (axis count, mirror mode)
```

### Critical Path: `BrushTool.ts`

```
Step 2.3 [C] Freehand drawing with quadraticCurveTo smoothing, lineWidth
  └─ Step 6.4 [M] + opacity (globalAlpha), hardness, presets
  └─ Step 7.3 [M] + pressure sensitivity (PointerEvent.pressure)
  └─ Step 7.6 [M] + symmetry mode (duplicate strokes across axes)
```

### Critical Path: `app.css`

```
Step 1.3 [C] Base layout CSS (grid, canvas container, toolbar, property panel)
  └─ Step 3.8 [M] + complete component styles (toolbar buttons, sliders, color picker)
  └─ Step 6.7 [M] + checkerboard transparency pattern
  └─ Step 6.8 [M] + dark mode CSS variables and media query
```

### Critical Path: `preload.ts`

```
Step 1.1 [S] Scaffold default
  └─ Step 1.2 [M] Expose file I/O APIs via contextBridge
  └─ Step 3.5 [M] + openFile/saveFile IPC bridges
  └─ Step 4.4 [M] + clipboard IPC bridge
```

### Remaining Files (2-phase touch)

| File | Chain |
|---|---|
| `src/renderer/app.ts` | C:1.2 (app entry) → M:3.7 (keyboard shortcuts) |
| `src/shared/types.ts` | C:1.2 (shared type defs) → M:2.2 (ToolType, Point, Color) |
| `src/renderer/canvas/UndoManager.ts` | C:2.8 (ImageData snapshot stack) → M:6.1 (adapt for multi-layer) |
| `src/renderer/tools/ShapeTool.ts` | C:2.5 (line/rect/ellipse) → M:5.4 (rounded rect, polygon) |
| `src/renderer/tools/EraserTool.ts` | C:2.4 (destination-out) → M:7.3 (pressure sensitivity) |
| `src/renderer/ui/Toolbar.ts` | C:3.2 (tool palette) → M:4.2 (add eyedropper button) |
| `src/renderer/canvas/LayerManager.ts` | C:6.1 (layer architecture) → M:7.1, M:7.2 (blend modes, opacity) |
| `src/renderer/ui/LayerPanel.ts` | C:6.1 (layer panel UI) → M:7.1, M:7.2 (blend mode dropdown, opacity slider) |
| `src/renderer/index.html` | S:1.1 → M:1.2, M:1.3 (layout structure) — stable after Phase 1 |

---

## Files Per Phase Summary

| Phase | Files Created | Files Modified | Total File Ops |
|---|---|---|---|
| Phase 1 (Scaffold) | 8 (6 config + types.ts + app.css) | 3 (main.ts, preload.ts, index.html) | 11 |
| Phase 2 (Core Engine) | 7 (PaintEngine, Tool, Brush, Eraser, Shape, FloodFill, ColorSelection, UndoManager) | 1 (types.ts) | 8+1=9 |
| Phase 3 (UI/File/Keys) | 4 (ColorPicker, Toolbar, PropertyPanel, NewDocumentDialog) | 5 (PaintEngine×3, main.ts×2, preload.ts, app.ts, app.css) | 4+8=12 |
| Phase 4 (Selection/Text) | 3 (SelectionTool, EyedropperTool, TextTool) | 4 (PaintEngine×2, Toolbar, PropertyPanel, preload.ts, main.ts) | 3+6=9 |
| Phase 5 (Canvas/Shapes) | 2 (ResizeDialog, CurveTool) | 4 (PaintEngine×3, main.ts, ShapeTool) | 2+5=7 |
| Phase 6 (Layers/Power) | 7 (LayerManager, LayerPanel, LassoTool, GradientTool, Filters, Transform, StatusBar) | 5 (PaintEngine×3, UndoManager, BrushTool, PropertyPanel, app.css×2) | 7+8=15 |
| Phase 7 (Advanced) | 4 (BrushEngine, BrushPresetPanel, Adjustments, CurvesDialog) | 5 (LayerManager×2, LayerPanel×2, BrushTool×2, EraserTool, PropertyPanel) | 4+7=11 |
| Phase 8 (Validation) | 0 | 0 (fix only) | 0 |

**Phase 6 has the highest total file operations (15)** and the most modifications to existing files (8).

---

## Cross-Phase Conflict Analysis

### Files Shared Across Phase Boundaries

| File | Phases Where Modified | Conflict Risk |
|---|---|---|
| `PaintEngine.ts` | P3, P4, P5, P6 | 🔴 **Critical** — If any two phases were parallelized, this file would conflict |
| `main.ts` | P3, P4, P5 | 🟠 **High** — IPC handlers added incrementally |
| `PropertyPanel.ts` | P4, P6, P7 | 🟡 **Medium** — Controls added per-tool, additive nature reduces conflict |
| `preload.ts` | P3, P4 | 🟡 **Medium** — Bridge API additions, mostly additive |
| `BrushTool.ts` | P6, P7 | 🟢 **Low** — Modifications are in different areas (presets vs pressure vs symmetry) |
| `app.css` | P3, P6 | 🟢 **Low** — CSS additions are typically non-conflicting |

### Steps Within the Same Phase Sharing Files

| Phase | File | Steps | Risk |
|---|---|---|---|
| Phase 3 | `PaintEngine.ts` | 3.4, 3.5, 3.6 | Must be sequential |
| Phase 3 | `main.ts` | 3.5, 3.6 | Must be sequential |
| Phase 4 | `PaintEngine.ts` | 4.1, 4.4 | Must be sequential |
| Phase 5 | `PaintEngine.ts` | 5.1, 5.2, 5.3 | Must be sequential |
| Phase 6 | `PaintEngine.ts` | 6.1, 6.7, 6.9 | Must be sequential |
| Phase 7 | `LayerManager.ts` | 7.1, 7.2 | Must be sequential |
| Phase 7 | `LayerPanel.ts` | 7.1, 7.2 | Must be sequential |
| Phase 7 | `BrushTool.ts` | 7.3, 7.6 | Must be sequential |

---

## Recommended Split Points

### Split Strategy: 4 Independent Plans

Based on minimizing cross-plan file modifications:

#### Plan A: P0 MVP (Phases 1–3)

**Scope:** Project scaffold → Core engine → UI/file I/O → Working paint app

- **Files created:** 19 files
- **Internal modifications only** — no dangling references to later phases
- **Delivers:** Complete P0 product — draw, fill, select colors, save/open, keyboard shortcuts
- **Boundary analysis:** After Plan A completes, the following files are "stable APIs" that later plans extend:
  - `PaintEngine.ts` — has public API surface but will grow significantly
  - `main.ts` — IPC handler registry, will add more handlers
  - `PropertyPanel.ts` — control panel, will add more tool controls

#### Plan B: P1 Features (Phases 4–5)

**Scope:** Selection → Text → Clipboard → Canvas management → More shapes

- **Files created:** 5 new files (SelectionTool, EyedropperTool, TextTool, ResizeDialog, CurveTool)
- **Files modified from Plan A:** PaintEngine.ts (5 steps!), main.ts (2), preload.ts (1), Toolbar.ts (1), PropertyPanel.ts (1), ShapeTool.ts (1)
- **Key risk:** PaintEngine.ts is modified in 5 of 10 steps — heavy coupling
- **Mitigation:** PaintEngine.ts additions are mostly new methods (additive), not refactoring existing code

#### Plan C: P2 Power Features (Phase 6)

**Scope:** Layers → Lasso → Gradient → Brush presets → Filters → Transforms → Dark mode → Grid

- **Files created:** 7 new files (LayerManager, LayerPanel, LassoTool, GradientTool, Filters, Transform, StatusBar)
- **Files modified from earlier plans:** PaintEngine.ts (3 steps), UndoManager.ts (1), BrushTool.ts (1), PropertyPanel.ts (1), app.css (2)
- **Key risk:** Step 6.1 (layers) is an **architectural change** — modifies how PaintEngine routes drawing and how UndoManager stores state. This is the most disruptive step in the entire plan.
- **Recommendation:** Step 6.1 should be its own sub-plan or treated as a "migration step" with careful API design

#### Plan D: P3 Advanced Features (Phase 7)

**Scope:** Blend modes → Layer opacity → Pressure → Custom brushes → Curves/levels → Symmetry

- **Files created:** 4 new files (BrushEngine, BrushPresetPanel, Adjustments, CurvesDialog)
- **Files modified from earlier plans:** LayerManager.ts (2), LayerPanel.ts (2), BrushTool.ts (2), EraserTool.ts (1), PropertyPanel.ts (1)
- **Key risk:** Low — modifications are to Phase 6 files (LayerManager, LayerPanel) and Phase 2 files (BrushTool, EraserTool). Additive in nature.

### Why These Split Points?

| Boundary | Forward Modifications | Backward Risk |
|---|---|---|
| **After Phase 3** (Plan A → B) | PaintEngine.ts heavily modified in P4/P5 | PaintEngine is already large; consider interface extraction |
| **After Phase 5** (Plan B → C) | PaintEngine.ts architecturally changed in P6 (layers) | Layers change drawing routing — must design for this in Plan A |
| **After Phase 6** (Plan C → D) | Only additive changes to Layer/Brush files | Clean boundary — lowest risk |

### Alternative Split: 2 Plans

If fewer plans are preferred:

- **Plan 1 (Phases 1–5):** Complete P0 + P1 product. 24 files created. PaintEngine.ts is heavily evolved but all changes are additive methods.
- **Plan 2 (Phases 6–8):** Layers + advanced features. 11 files created. Architecturally disruptive (layers) but self-contained.

This boundary is clean because **Phase 6 (layers) is the only step that fundamentally changes the architecture** of earlier files.

---

## Discovered Issues

1. **`FillTool.ts` gap:** Listed in the Step 1.2 directory structure but no step explicitly implements it. `FloodFill.ts` (Step 2.6) contains the algorithm. FillTool.ts likely needs to be a Tool interface wrapper around FloodFill — this should be added to Step 2.6 or as a separate step.

2. **PaintEngine.ts god object risk:** By Phase 6, PaintEngine.ts manages 12+ distinct responsibilities. Consider extracting interfaces or splitting into sub-managers (ZoomManager, FileManager, SelectionManager) during Phase 3 or Phase 5 to reduce modification pressure.

3. **Implicit app.ts wiring:** `src/renderer/app.ts` is created in Step 1.2 and only explicitly modified in Step 3.7 (keyboard shortcuts), but it must also wire together PaintEngine, Toolbar, ColorPicker, PropertyPanel, and all tools as they are created in Phases 2–3. This wiring is not captured in any step's Files section — it is an **implicit modification** in many steps.

4. **index.html stable after Phase 1:** The HTML layout is set up in Steps 1.2–1.3 and never modified again. Later UI components (LayerPanel, StatusBar, dialogs) presumably create DOM elements programmatically. This is a good pattern but should be documented.

5. **No test files in the plan:** The entire plan relies on manual validation. No automated test files are created. Adding test infrastructure could be a separate plan track.

---

## Clarifying Questions

1. Should `FillTool.ts` be explicitly planned as a wrapper tool in Phase 2, or is the intent for PaintEngine to use FloodFill.ts directly?
2. Is the `app.ts` wiring of components handled implicitly within each component's step, or should it be called out explicitly?
3. For the layer system (Step 6.1), should PaintEngine.ts be refactored to support a `DrawingTarget` abstraction early (Phase 2) to reduce the disruption when layers are added?
