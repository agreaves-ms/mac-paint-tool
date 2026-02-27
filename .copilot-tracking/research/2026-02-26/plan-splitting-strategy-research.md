<!-- markdownlint-disable-file -->
# Task Research: Plan Splitting Strategy for Mac Paint App

Determine the optimal way to split the monolithic mac-paint-app implementation plan into multiple independent, incrementally-deliverable plans.

## Task Implementation Requests

* Analyze the current 8-phase monolithic plan and identify natural split boundaries
* Map file-level dependencies between phases and steps
* Determine which groupings produce independently testable deliverables
* Recommend a plan splitting strategy with clear dependency ordering

## Scope and Success Criteria

* Scope: Structural analysis of the existing plan at `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` and details at `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md`
* Assumptions:
  * All state is managed through the `.copilot-tracking` folder files
  * The next agent instructions will be Task Implementor — user will switch to it when done with Task Planner
  * Each split plan must produce a testable artifact (app should work after each plan completes)
  * Plans are executed sequentially — no parallel plan execution
  * Each plan needs its own `.instructions.md` plan file, details file, and log file
* Success Criteria:
  * Each split plan is independently implementable and produces a runnable/testable state
  * Dependencies between plans are explicit and minimal
  * No plan exceeds ~15 implementation steps (manageable for a single Task Implementor session)
  * The full set of split plans covers everything in the original monolithic plan
  * Effort distribution is reasonably balanced

## Outline

1. Current Plan Structure Analysis
2. File Dependency Map and Hot Files
3. Splitting Strategies Evaluated
4. Selected Splitting Strategy (A-prime — Modified Priority Tier, 6 Plans)
5. Detailed Plan Breakdown
6. Plan Dependency Graph
7. File Conflict Analysis Per Boundary
8. Mitigation Recommendations
9. Implementation Guidance

---

## 1. Current Plan Structure Analysis

### Phase Summary

| Phase | Name | Steps | Priority | Key Deliverables |
|-------|------|-------|----------|-----------------|
| 1 | Project Scaffold and Electron Shell | 4 | P0 | Electron window with canvas |
| 2 | Core Drawing Engine and Tools | 9 | P0 | PaintEngine, Brush, Eraser, Shapes, FloodFill, ColorSelection, UndoManager |
| 3 | UI, Color, File I/O and Keyboard Shortcuts | 9 | P0 | ColorPicker, Toolbar, PropertyPanel, Zoom, File I/O, Keyboard Shortcuts, CSS |
| 4 | Selection, Text and Clipboard | 5 | P1 | Marquee selection, Eyedropper, Text, Clipboard |
| 5 | Canvas Management and Additional Shapes | 6 | P1 | Resize, Export, Drag-drop, Rounded rect, Polygon, Curves |
| 6 | Layers and Power Features | 10 | P2 | Layers, Lasso, Gradient, Brush presets, Filters, Transforms, Dark mode, Grid |
| 7 | Advanced Features | 7 | P3 | Blend modes, Pressure sensitivity, Custom brushes, Curves/Levels, Symmetry |
| 8 | Final Validation | 4 | -- | TypeScript check, Build, E2E testing |

**Total: 54 steps** across 8 phases covering P0-P3 features.

---

## 2. File Dependency Map and Hot Files

### 6 Hot Files Modified in 3+ Phases

| Rank | File | Phases | Steps | Details |
|------|------|--------|-------|---------|
| 1 | `PaintEngine.ts` | 5 (P2-P6) | 12 | Canvas init, zoom, file I/O, selection, clipboard, resize, export, drag-drop, layers, transparency, grid |
| 2 | `main.ts` | 5 (P1-P5) | 6 | scaffold, IPC handlers, menu items, clipboard IPC, export filters |
| 3 | `PropertyPanel.ts` | 4 (P3-P7) | 4 | line/tolerance sliders, text controls, brush presets, symmetry controls |
| 4 | `preload.ts` | 3 (P1, P3, P4) | 4 | scaffold, file I/O bridge, clipboard bridge |
| 5 | `BrushTool.ts` | 3 (P2, P6, P7) | 4 | freehand drawing, opacity/presets, pressure/symmetry |
| 6 | `app.css` | 3 (P1, P3, P6) | 4 | base layout, component styles, dark mode/checkerboard |

**Key finding:** `PaintEngine.ts` is the bottleneck — modified in 12 of 54 steps across 5 phases. Phase 6 Step 6.1 (layers) is the most architecturally disruptive, changing drawing routing and undo state management.

### Discovered Gaps

* `FillTool.ts` listed in project structure (Step 1.2) but no step explicitly implements it — likely a thin wrapper around `FloodFill.ts`
* `app.ts` component wiring is implicit across many steps — not captured in file dependency tracking

---

## 3. Splitting Strategies Evaluated

Four strategies were scored against 5 weighted criteria:

| Criterion (Weight) | A: Priority Tier | B: Technical Concern | C: Functional Milestone | D: Fine-Grained |
|---|---|---|---|---|
| Independent Testability (25%) | 4 | 2 | 4 | 2 |
| Step Count Balance (20%) | 2 | 4 | 2 | 3 |
| File Conflict Min (25%) | 3 | 3 | 3 | 4 |
| Natural Boundary (15%) | 5 | 3 | 4 | 1 |
| Incremental Value (15%) | 5 | 2 | 4 | 1 |
| **Weighted Score** | **3.65** | **2.65** | **3.35** | **2.10** |
| **Rank** | **1st** | **3rd** | **2nd** | **4th** |

### Strategy A: Priority Tier (4 Plans)

* P0 MVP (22 steps), P1 (11), P2 (10), P3 (11)
* **Pro:** Natural P0-P3 alignment, excellent incremental value
* **Con:** Plan 1 is 22 steps — far exceeds the ~15 step target

### Strategy B: Technical Concern (6 Plans)

* Scaffold (4), Engine (9), UI (9), Content (11), Layers (10), Advanced (11)
* **Pro:** Well-balanced step counts
* **Con:** Engine plan has no UI — tools cannot be manually tested; two plans deliver no user-visible value

### Strategy C: Functional Milestone (5 Plans)

* Bootstrap+Engine (6), Tools+UI (16), P1 (11), P2 (10), P3 (11)
* **Pro:** Clear milestones, better bootstrap split
* **Con:** Plan 2 still at 16 steps

### Strategy D: Fine-Grained (8+ Plans)

* 10 tiny plans, some with 1-3 steps
* **Pro:** Small plans
* **Con:** Four plans deliver no testable app state; excessive overhead; arbitrary boundaries

### Rejected Alternative Details

**Strategy B** rejected primarily because Phase 2 (drawing engine) creates tools with no UI — a toolbar and sliders are required to test them manually. Plans B1 and B2 together deliver zero user-visible value.

**Strategy D** rejected because 4 of 10 plans are not independently testable as a working app, and the overhead of maintaining 10+ plan files with tiny step counts outweighs the benefit.

---

## 4. Selected Splitting Strategy: A-prime — Modified Priority Tier (6 Plans)

**Combines Strategy A's natural priority alignment with Strategy C's bootstrap split to fix the 22-step Plan 1 problem.**

| Plan | Content | Steps | Name | Milestone |
|------|---------|-------|------|-----------|
| **1** | Phase 1 + Steps 2.1-2.2 | **6** | Foundation and Canvas Engine | Electron launches, canvas responds to pointer events, Tool interface defined |
| **2** | Steps 2.3-2.9 | **7** | P0 Core Drawing Tools | All P0 tools functional (brush, eraser, shapes, flood fill, color selection, undo) |
| **3** | Phase 3 (Steps 3.1-3.9) | **9** | P0 MVP: UI, File I/O and Polish | Complete P0 MVP — toolbar, sliders, file save/open, keyboard shortcuts |
| **4** | Phases 4-5 (Steps 4.1-5.6) | **11** | P1 Features: Content and Canvas | Selection, text, clipboard, canvas mgmt, shapes, curves |
| **5** | Phase 6 (Steps 6.1-6.10) | **10** | P2 Power: Layers and Effects | Multi-layer architecture, filters, transforms, dark mode |
| **6** | Phases 7-8 (Steps 7.1-8.4) | **11** | P3 Advanced and Final Validation | Blend modes, pressure, custom brushes, symmetry, final build |

### Why This Split

1. **Plan 1 (6 steps):** Creates the platform — Electron shell, PaintEngine, and Tool interface contract. Produces a launching app with a canvas that responds to pointer events.

2. **Plan 2 (7 steps):** Implements all P0 tools as standalone files implementing Plan 1's Tool interface. **PaintEngine.ts is NOT modified** — tools are standalone classes. Cleanest plan boundary.

3. **Plan 3 (9 steps):** Integrates UI, adds file I/O, completes the P0 MVP. **Modifies PaintEngine.ts 3x** (zoom, file I/O, new doc) — all additive methods. After this plan, the app is a complete drawing application.

4. **Plan 4 (11 steps):** Adds P1 features. Heaviest PaintEngine.ts modification (5 steps), but all are new methods (selection, clipboard, resize, export, drag-drop).

5. **Plan 5 (10 steps):** Architecturally disruptive layer system (Step 6.1) plus all P2 features. **Disruption is self-contained** — all prior plans work on single canvas, Plan 5 introduces multi-canvas.

6. **Plan 6 (11 steps):** Cleanest plan — zero PaintEngine.ts modifications. Advanced features plus final validation and distributable build.

---

## 5. Detailed Plan Breakdown

### Plan 1: Foundation and Canvas Engine (6 Steps)

| Step | Description | Files Created | Files Modified |
|------|-------------|---------------|----------------|
| 1.1 | Bootstrap Electron + Vite + TS | 6 config files | -- |
| 1.2 | Configure project structure | types.ts, app.ts, directories | main.ts, preload.ts |
| 1.3 | HTML layout with canvas | index.html structure, app.css | -- |
| 1.4 | Validate scaffold | -- | -- |
| 2.1 | PaintEngine.ts — canvas init, pointer events | PaintEngine.ts | -- |
| 2.2 | Tool interface with lineWidth | Tool.ts | types.ts |

**Validation:** `npm start` launches Electron window with canvas. PaintEngine captures pointer events. `npx tsc --noEmit` passes.

### Plan 2: P0 Core Drawing Tools (7 Steps)

| Step | Description | Files Created | Files Modified |
|------|-------------|---------------|----------------|
| 2.3 | BrushTool — freehand with smoothing | BrushTool.ts | -- |
| 2.4 | EraserTool — destination-out | EraserTool.ts | -- |
| 2.5 | ShapeTool — line, rect, ellipse | ShapeTool.ts | -- |
| 2.6 | FloodFill — scanline queue + FillTool wrapper | FloodFill.ts, FillTool.ts | -- |
| 2.7 | ColorSelection — pixel scan + marching ants | ColorSelection.ts | -- |
| 2.8 | UndoManager — ImageData snapshot stack | UndoManager.ts | -- |
| 2.9 | Validate Phase 2 | -- | -- |

**Key:** PaintEngine.ts is NOT modified. Tools are standalone files implementing the Tool interface. App.ts wiring registers each tool.

**Validation:** Each tool draws correctly when activated via keyboard or code. FloodFill works with tolerance 0/32/128. Undo/redo traverses 50+ operations.

### Plan 3: P0 MVP — UI, File I/O and Polish (9 Steps)

| Step | Description | Files Created | Files Modified |
|------|-------------|---------------|----------------|
| 3.1 | ColorPicker — fg/bg + swap | ColorPicker.ts | -- |
| 3.2 | Toolbar — tool palette sidebar | Toolbar.ts | -- |
| 3.3 | PropertyPanel — sliders, toggles | PropertyPanel.ts | -- |
| 3.4 | Zoom/pan — CSS transform | -- | PaintEngine.ts |
| 3.5 | File I/O — open/save dialogs | -- | PaintEngine.ts, main.ts, preload.ts |
| 3.6 | New Document dialog | NewDocumentDialog.ts | PaintEngine.ts, main.ts |
| 3.7 | Keyboard shortcuts | -- | app.ts |
| 3.8 | CSS layout and component styles | -- | app.css |
| 3.9 | Validate full P0 MVP | -- | -- |

**Key:** PaintEngine.ts modified 3x (zoom, file I/O, new doc) — all additive methods. After completion, the app is a fully usable paint application.

**Validation:** Complete end-to-end: draw, fill, select colors, zoom, save, reopen, new doc, keyboard shortcuts all work.

### Plan 4: P1 Features — Content and Canvas (11 Steps)

| Step | Description | Files Created | Files Modified |
|------|-------------|---------------|----------------|
| 4.1 | Marquee selection | SelectionTool.ts | PaintEngine.ts |
| 4.2 | Eyedropper | EyedropperTool.ts | Toolbar.ts |
| 4.3 | Text tool | TextTool.ts | PropertyPanel.ts |
| 4.4 | Clipboard integration | -- | PaintEngine.ts, main.ts, preload.ts |
| 4.5 | Validate Selection/Text | -- | -- |
| 5.1 | Canvas resize/crop | ResizeDialog.ts | PaintEngine.ts |
| 5.2 | Export formats (PNG/JPEG/WebP) | -- | PaintEngine.ts, main.ts |
| 5.3 | Drag-and-drop | -- | PaintEngine.ts |
| 5.4 | Additional shapes — rounded rect, polygon | -- | ShapeTool.ts |
| 5.5 | Curve/Bezier tool | CurveTool.ts | -- |
| 5.6 | Validate Canvas/Shapes | -- | -- |

**Key:** PaintEngine.ts modified 5x — heaviest modification plan, but all additive new methods.

**Validation:** Selections work, text renders, clipboard interop, canvas resize/crop, all export formats, drag-drop, new shapes and curves.

### Plan 5: P2 Power — Layers and Effects (10 Steps)

| Step | Description | Files Created | Files Modified |
|------|-------------|---------------|----------------|
| 6.1 | Layer system — multi-canvas + panel | LayerManager.ts, LayerPanel.ts | PaintEngine.ts, UndoManager.ts |
| 6.2 | Lasso selection | LassoTool.ts | -- |
| 6.3 | Gradient tool | GradientTool.ts | -- |
| 6.4 | Brush presets | -- | BrushTool.ts, PropertyPanel.ts |
| 6.5 | Image filters | Filters.ts | -- |
| 6.6 | Transform tools | Transform.ts | -- |
| 6.7 | Transparency support | -- | PaintEngine.ts, app.css |
| 6.8 | Dark mode | -- | app.css |
| 6.9 | Grid overlay + status bar | StatusBar.ts | PaintEngine.ts |
| 6.10 | Validate Layers and Power | -- | -- |

**Key:** Step 6.1 is architecturally disruptive — changes drawing routing in PaintEngine and undo state in UndoManager. Disruption is self-contained within this plan.

**Validation:** 5 layers created/drawn independently, visibility toggles, layer reorder, filters/transforms, dark mode, grid at high zoom.

### Plan 6: P3 Advanced and Final Validation (11 Steps)

| Step | Description | Files Created | Files Modified |
|------|-------------|---------------|----------------|
| 7.1 | Blend modes | -- | LayerManager.ts, LayerPanel.ts |
| 7.2 | Layer opacity | -- | LayerManager.ts, LayerPanel.ts |
| 7.3 | Pressure sensitivity | -- | BrushTool.ts, EraserTool.ts |
| 7.4 | Custom brush engine | BrushEngine.ts, BrushPresetPanel.ts | -- |
| 7.5 | Curves/levels | Adjustments.ts, CurvesDialog.ts | -- |
| 7.6 | Symmetry drawing | -- | BrushTool.ts, PropertyPanel.ts |
| 7.7 | Validate Advanced Features | -- | -- |
| 8.1 | Full project validation (tsc, lint, make) | -- | -- |
| 8.2 | Fix minor validation issues | -- | Various |
| 8.3 | End-to-end functional testing | -- | -- |
| 8.4 | Report blocking issues | -- | -- |

**Key:** Cleanest plan — zero PaintEngine.ts modifications. All modifications target Layer/Brush files. `npm run make` produces distributable.

**Validation:** Blend modes composite correctly, pressure sensitivity responds to stylus, custom brushes stamp, curves/levels adjust. Final: `npx tsc --noEmit`, `npm run make`, full E2E test.

---

## 6. Plan Dependency Graph

```text
Plan 1: Foundation and Canvas Engine (6 steps)
  |
  +--- Plan 2: P0 Core Drawing Tools (7 steps)
         |
         +--- Plan 3: P0 MVP — UI, File I/O and Polish (9 steps)
                |
                +--- Plan 4: P1 Features — Content and Canvas (11 steps)
                       |
                       +--- Plan 5: P2 Power — Layers and Effects (10 steps)
                              |
                              +--- Plan 6: P3 Advanced and Final Validation (11 steps)
```

**All plans are strictly sequential.** No plan can execute in parallel because each builds on files created/modified by the prior plan.

---

## 7. File Conflict Analysis Per Boundary

| Boundary | PaintEngine.ts Risk | Overall Risk | Key Conflicts |
|----------|-------------------|--------------|---------------|
| Plan 1 to Plan 2 | None (created in P1, not modified in P2) | **Low** | Cleanest boundary — P2 creates standalone tool files |
| Plan 2 to Plan 3 | Modified 3x (zoom, file I/O, new doc) | **Medium** | All additive methods; no existing code refactored |
| Plan 3 to Plan 4 | Modified 5x (selection, clipboard, resize, export, drag-drop) | **High** | Heaviest modification load, but all additive new methods |
| Plan 4 to Plan 5 | Modified 3x (layers, transparency, grid) — Step 6.1 is disruptive | **Critical** | Layer architecture changes drawing routing + undo state |
| Plan 5 to Plan 6 | Not modified | **Low** | Cleanest boundary — Layer/Brush file additions only |

---

## 8. Mitigation Recommendations

### PaintEngine.ts God Object Risk

PaintEngine accumulates 12+ responsibilities across 5 phases. Two mitigations recommended:

1. **DrawingContext abstraction (Plan 1, Step 2.1):** Design PaintEngine with a `DrawingContext` wrapper from the start. Tools receive `DrawingContext` instead of raw `CanvasRenderingContext2D`. When layers arrive (Plan 5), `DrawingContext` switches from wrapping the single canvas to wrapping the active layer — transparent to all tools.

2. **Sub-manager extraction (Plan 3, optional):** Extract `ZoomManager`, `FileManager` during Plan 3 to reduce PaintEngine's API surface before Plan 4 adds more methods. This would add 1-2 steps but significantly reduce Plans 4-5 modification pressure.

### FillTool.ts Gap

`FillTool.ts` is listed in the project structure (Step 1.2) but has no implementing step. **Recommendation:** Add it as part of Step 2.6 — a thin wrapper around `FloodFill.ts` that implements the Tool interface.

---

## 9. Implementation Guidance

### File Organization

Each plan gets its own set of tracking files:

```text
.copilot-tracking/
  plans/
    2026-02-26/
      mac-paint-app-plan.instructions.md    (original monolithic — archive)
      plan-01-foundation.instructions.md     (Plan 1)
      plan-02-drawing-tools.instructions.md  (Plan 2)
      plan-03-mvp-ui.instructions.md         (Plan 3)
      plan-04-p1-features.instructions.md    (Plan 4)
      plan-05-layers-power.instructions.md   (Plan 5)
      plan-06-advanced.instructions.md       (Plan 6)
  details/
    2026-02-26/
      mac-paint-app-details.md               (original — archive)
      plan-01-foundation-details.md
      plan-02-drawing-tools-details.md
      plan-03-mvp-ui-details.md
      plan-04-p1-features-details.md
      plan-05-layers-power-details.md
      plan-06-advanced-details.md
  plans/logs/
    2026-02-26/
      mac-paint-app-log.md                   (original — archive)
      plan-01-foundation-log.md
      plan-02-drawing-tools-log.md
      plan-03-mvp-ui-log.md
      plan-04-p1-features-log.md
      plan-05-layers-power-log.md
      plan-06-advanced-log.md
```

### Execution Workflow

1. User completes Task Planner (creates all 6 plan files)
2. User switches to **Task Implementor** mode
3. User opens Plan 1's `.instructions.md` and begins implementation
4. After Plan 1 validation, user opens Plan 2 and continues
5. Each plan's log tracks discrepancies and issues for that plan specifically

---

## Potential Next Research

* Evaluate whether `DrawingContext` abstraction adds steps or changes plan boundaries
* Research automated testing strategy (currently zero test files across all plans)
* Quantify `app.ts` implicit wiring count across all steps
* Investigate `PaintEngine.ts` sub-manager extraction timing and step cost

## Research Executed

### File Analysis

* `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` — 8 phases, 54 steps, covers P0-P3
* `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` — 1500+ lines of detailed implementation instructions
* `.copilot-tracking/plans/logs/2026-02-26/mac-paint-app-log.md` — Discrepancy log with 10 DRs, 3 DDs
* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — 170+ features, P0-P3 ranking, 4-phase delivery recommendation

### Subagent Research Documents

* [file-dependency-analysis.md](../subagents/2026-02-26/file-dependency-analysis.md) — 41 files x 8 phases, hot file identification, dependency chains
* [splitting-strategy-analysis.md](../subagents/2026-02-26/splitting-strategy-analysis.md) — 4 strategies scored, hybrid A-prime recommended, detailed plan breakdown, file conflict analysis

### Project Conventions

* All state managed through `.copilot-tracking` folder files
* Next agent: Task Implementor — user switches when done with Task Planner

## Key Discoveries

### 1. PaintEngine.ts is the Critical Bottleneck

Modified in 12 of 54 steps across 5 phases, accumulating canvas init, zoom, file I/O, selection, clipboard, resize, export, drag-drop, layer routing, transparency, and grid responsibilities. No splitting strategy eliminates this coupling — mitigation requires architectural abstraction.

**Evidence:** [file-dependency-analysis.md](../subagents/2026-02-26/file-dependency-analysis.md) — File x Phase matrix and hot file ranking

### 2. The Plan 1 to Plan 2 Boundary Is the Cleanest

Plan 2 creates 7 standalone tool files implementing Plan 1's Tool interface. PaintEngine.ts is NOT modified in Plan 2. This is the only plan boundary with zero hot-file modifications.

**Evidence:** [splitting-strategy-analysis.md](../subagents/2026-02-26/splitting-strategy-analysis.md) — Boundary: Plan 1 to Plan 2

### 3. The Plan 4 to Plan 5 Boundary Is the Most Disruptive

Step 6.1 (layer system) changes PaintEngine's drawing routing and UndoManager's state storage. This architectural change is intentionally contained within Plan 5 to avoid spreading disruption.

**Evidence:** [splitting-strategy-analysis.md](../subagents/2026-02-26/splitting-strategy-analysis.md) — Plan 5 analysis

### 4. Strategy A (Priority Tier) Wins on Natural Alignment and Value

Strategies B and D fail on independent testability — they produce plans with no user-visible value. Strategy A scores highest but its Plan 1 (22 steps) is too large. Strategy A-prime fixes this by splitting the P0 tier into 3 plans (foundation, tools, MVP).

**Evidence:** [splitting-strategy-analysis.md](../subagents/2026-02-26/splitting-strategy-analysis.md) — Scored comparison table

### 5. FillTool.ts Implementation Gap

The project structure (Step 1.2) lists `FillTool.ts` but no step implements it. This should be addressed in Step 2.6 as a thin wrapper around `FloodFill.ts`.

**Evidence:** [file-dependency-analysis.md](../subagents/2026-02-26/file-dependency-analysis.md) — FillTool.ts note
