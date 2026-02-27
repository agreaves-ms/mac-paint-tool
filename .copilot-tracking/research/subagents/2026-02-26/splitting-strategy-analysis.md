<!-- markdownlint-disable-file -->
# Splitting Strategy Analysis: Mac Paint App Implementation Plan

## Research Topics

- Evaluate 4 candidate strategies for splitting a monolithic 8-phase, ~50-step implementation plan
- Score each strategy against 5 criteria: independent testability, step count balance, file conflict minimization, natural boundary alignment, incremental value
- Recommend a strategy and provide a detailed plan breakdown with dependency graph, file conflict analysis, and validation criteria

## Source Data

- Plan: `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` (8 phases, ~50 steps)
- Details: `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` (1500 lines, full implementation specifics)
- File dependency analysis: `.copilot-tracking/research/subagents/2026-02-26/file-dependency-analysis.md`

---

## Step Inventory by Phase

| Phase | Steps | Priority | Description |
|---|---|---|---|
| 1: Scaffold | 4 | P0 | Bootstrap Electron + Vite + TS, project structure, HTML layout, validate |
| 2: Core Engine | 9 | P0 | PaintEngine, Tool interface, Brush, Eraser, Shape, FloodFill, ColorSelection, UndoManager, validate |
| 3: UI/File/Keys | 9 | P0 | ColorPicker, Toolbar, PropertyPanel, zoom/pan, file I/O, New Doc, keyboard shortcuts, CSS, validate |
| 4: Selection/Text | 5 | P1 | Marquee selection, eyedropper, text tool, clipboard, validate |
| 5: Canvas/Shapes | 6 | P1 | Canvas resize/crop, export formats, drag-drop, shapes, curves, validate |
| 6: Layers/Power | 10 | P2 | Layer system, lasso, gradient, brush presets, filters, transforms, transparency, dark mode, grid/statusbar, validate |
| 7: Advanced | 7 | P3 | Blend modes, layer opacity, pressure, custom brushes, curves/levels, symmetry, validate |
| 8: Final Validation | 4 | — | TypeScript validation, fixes, E2E testing, issue reporting |

**Total: 54 steps** (including validation steps)

---

## Hot File Summary (From Dependency Analysis)

| File | Phases Touched | Total Step Modifications |
|---|---|---|
| `PaintEngine.ts` | 5 (P2–P6) | 12 steps |
| `main.ts` | 5 (P1–P5) | 6 steps |
| `PropertyPanel.ts` | 4 (P3, P4, P6, P7) | 4 steps |
| `preload.ts` | 3 (P1, P3, P4) | 4 steps |
| `BrushTool.ts` | 3 (P2, P6, P7) | 4 steps |
| `app.css` | 3 (P1, P3, P6) | 4 steps |

**Key finding:** `PaintEngine.ts` is the critical bottleneck — modified in 12 of 54 steps spanning 5 phases. Phase 6 (layers) is the most architecturally disruptive, fundamentally changing how PaintEngine routes drawing and how UndoManager stores state.

---

## Strategy Evaluation

### Evaluation Criteria (1–5 scale)

| Criterion | Weight | Description |
|---|---|---|
| Independent Testability | 25% | Each plan produces a working, launchable app state |
| Step Count Balance | 20% | No plan exceeds ~15 steps; plans are roughly balanced |
| File Conflict Minimization | 25% | Minimize modifications to the same files across plan boundaries |
| Natural Boundary Alignment | 15% | Splits feel logical, not arbitrary |
| Incremental Value | 15% | Each plan adds visible, demonstrable value |

---

### Strategy A: By Priority Tier (4 Plans)

| Plan | Phases | Steps | Content |
|---|---|---|---|
| A1: P0 MVP | 1–3 | 22 | Scaffold + Engine + UI/File = complete drawing app |
| A2: P1 Expected | 4–5 | 11 | Selection + Text + Clipboard + Canvas management + Shapes |
| A3: P2 Power | 6 | 10 | Layers, lasso, gradient, presets, filters, transforms, dark mode, grid |
| A4: P3 Advanced + Validate | 7–8 | 11 | Blend modes, pressure, custom brushes, curves/levels, symmetry, final validation |

**Independent Testability: 4/5**
- A1: Full drawing app after completion ✅
- A2: Adds selection, text, clipboard — all testable ✅
- A3: Layers + power features — testable ✅
- A4: Advanced + final validation — testable ✅
- ★ All plans produce a working app. Deduction: A1 is a massive plan; if it fails partway, there's no working checkpoint until Step 3.9.

**Step Count Balance: 2/5**
- A1: **22 steps** — far exceeds the ~15 step target 🔴
- A2: 11 steps ✅
- A3: 10 steps ✅
- A4: 11 steps ✅
- ★ Plan A1 is the problem. 22 steps is unwieldy.

**File Conflict Minimization: 3/5**
- A1→A2 boundary: PaintEngine.ts modified 5 times in A2, main.ts 2×, preload.ts 1×, PropertyPanel.ts 1×
- A2→A3 boundary: PaintEngine.ts modified 3× in A3, UndoManager.ts 1×, BrushTool.ts 1×
- A3→A4 boundary: LayerManager.ts 2×, LayerPanel.ts 2×, BrushTool.ts 2×, PropertyPanel.ts 1× — cleanest boundary
- ★ The A1→A2 boundary has the highest file conflict count (PaintEngine.ts 5 step mods)

**Natural Boundary Alignment: 5/5**
- Directly maps to P0–P3 priority tiers from research
- Users can stop after A1 and have a complete MVP
- Each subsequent plan adds a clear tier of capability

**Incremental Value: 5/5**
- A1: Full drawing app (paint, fill, save/open)
- A2: Selection, text, clipboard, export
- A3: Layers, filters, transforms, dark mode
- A4: Pressure sensitivity, custom brushes, advanced color

**Weighted Score: 3.65/5**

---

### Strategy B: By Technical Concern (6 Plans)

| Plan | Phases | Steps | Content |
|---|---|---|---|
| B1: Scaffold | 1 | 4 | Bootstrap, project structure, HTML layout, validate |
| B2: Drawing Engine | 2 | 9 | PaintEngine, tools, flood fill, color selection, undo |
| B3: UI & Integration | 3 | 9 | ColorPicker, Toolbar, PropertyPanel, zoom, file I/O, shortcuts, CSS |
| B4: Content Tools | 4–5 | 11 | Selection, text, clipboard, canvas management, shapes, curves |
| B5: Layers & Effects | 6 | 10 | Layers, lasso, gradient, presets, filters, transforms, dark mode, grid |
| B6: Advanced + Validate | 7–8 | 11 | Blend modes, pressure, custom brushes, curves/levels, symmetry, validation |

**Independent Testability: 2/5**
- B1: Launches Electron with empty canvas — barely testable 🟡
- B2: Engine works but **no UI** — cannot manually test tools without Toolbar or PropertyPanel 🔴
- B3: Now you can actually interact with the app ✅
- B4–B6: All testable ✅
- ★ Critical problem: B2 creates tools with no UI to activate them. You can validate via `npm start` + console, but manual testing of drawing requires B3. Plans B2 and B3 are tightly coupled.

**Step Count Balance: 4/5**
- B1: 4 steps (small but okay — it's bootstrap)
- B2: 9, B3: 9, B4: 11, B5: 10, B6: 11
- ★ Well balanced, though B1 is small. 6 plans adds overhead.

**File Conflict Minimization: 3/5**
- B1→B2: Clean (PaintEngine created in B2)
- B2→B3: PaintEngine.ts modified 3× in B3 (zoom, file I/O, new doc) 🟠
- B3→B4: PaintEngine.ts modified 5× in B4 🔴
- B4→B5: PaintEngine.ts modified 3× in B5 🟠
- B5→B6: Clean-ish (Layer files modified)
- ★ Same PaintEngine burden as Strategy A, but now spread across more boundaries.

**Natural Boundary Alignment: 3/5**
- B1 (scaffold) and B2 (engine) feel natural
- B3 (UI only) feels forced — UI without engine is meaningless, engine without UI is untestable
- B4 (content tools) groups two phases that are unrelated (selection ≠ canvas management)
- ★ The B2/B3 split feels arbitrary and counterproductive.

**Incremental Value: 2/5**
- B1: Empty window — no user value
- B2: Engine exists but unusable without UI — no user-visible value
- B3: Finally usable — but this is really where value starts
- B4–B6: Each adds clear value
- ★ Two plans (B1, B2) deliver no user-visible value.

**Weighted Score: 2.65/5**

---

### Strategy C: By Functional Milestone (5 Plans)

| Plan | Phases/Steps | Steps | Content |
|---|---|---|---|
| C1: Bootstrap to Canvas | P1 + Steps 2.1–2.2 | 6 | Scaffold + PaintEngine init + Tool interface = canvas responds to pointer |
| C2: P0 Drawing Tools & MVP | Steps 2.3–2.9 + P3 | 16 | All P0 tools + UI + file I/O + shortcuts = complete MVP |
| C3: P1 Features | P4–P5 | 11 | Selection + text + clipboard + canvas management + shapes |
| C4: P2 Layers & Power | P6 | 10 | Layers, lasso, gradient, presets, filters, transforms, dark mode, grid |
| C5: P3 Advanced + Validate | P7–P8 | 11 | Blend modes, pressure, custom brushes, curves/levels, symmetry, validation |

**Independent Testability: 4/5**
- C1: Electron launches, canvas responds to pointer events — technically testable but very rudimentary 🟡
- C2: Complete P0 MVP — fully testable ✅
- C3–C5: All testable ✅
- ★ C1 is testable — you can verify canvas init and pointer delegation even without tools. Better than B2 (which has tools but no UI).

**Step Count Balance: 2/5**
- C1: 6 steps ✅
- C2: **16 steps** — exceeds ~15 step target 🟠
- C3: 11, C4: 10, C5: 11 ✅
- ★ C2 is still too large. Splitting at 2.2/2.3 puts 7 tool implementations + all of Phase 3 (9 steps) = 16.

**File Conflict Minimization: 3/5**
- C1→C2: PaintEngine.ts created in C1, modified 3× in C2 (zoom, file I/O, new doc) — **but this is expected since C2 is building on top of C1's foundation**
- C2→C3: PaintEngine.ts modified 5× in C3 🔴
- C3→C4: PaintEngine.ts modified 3× in C4 🟠
- C4→C5: Clean-ish boundary
- ★ Same fundamental PaintEngine problem. The C1→C2 boundary is actually cleaner because creating the file and immediately building on it is natural.

**Natural Boundary Alignment: 4/5**
- C1: "From nothing to a responding canvas" — clear milestone
- C2: "From canvas to complete drawing app" — clear milestone
- C3: "Add content editing features" — clear
- C4: "Add layers and power features" — clear
- C5: "Add advanced features and polish" — clear
- ★ Better than A because C1 gives a smaller bootstrap. Worse than A because the 2.1–2.2 extraction from Phase 2 feels slightly arbitrary.

**Incremental Value: 4/5**
- C1: Canvas responds and there's a working pointer system — developer value if not user value
- C2: Complete drawing app — major user value
- C3–C5: Each adds a tier
- ★ Good incremental progression, though C1's value is primarily for further development rather than user-facing.

**Weighted Score: 3.35/5**

---

### Strategy D: Fine-Grained Split (8+ Plans)

| Plan | Source | Steps | Content |
|---|---|---|---|
| D1: Scaffold | P1 | 4 | Bootstrap |
| D2: Engine Core | 2.1–2.2 | 2 | PaintEngine + Tool interface |
| D3: Drawing Tools | 2.3–2.5 | 3 | Brush, Eraser, Shape |
| D4: Pixel Tools | 2.6–2.9 | 4 | FloodFill, ColorSelection, UndoManager, validate |
| D5: UI Integration | 3.1–3.4 | 4 | ColorPicker, Toolbar, PropertyPanel, zoom |
| D6: File & Polish | 3.5–3.9 | 5 | File I/O, New Doc, shortcuts, CSS, validate |
| D7: Content Tools | P4–P5 | 11 | Selection, text, clipboard, canvas mgmt, shapes |
| D8: Layer System | 6.1 | 1 | Layer architecture only |
| D9: Power Features | 6.2–6.10 | 9 | Lasso, gradient, presets, filters, dark mode, grid |
| D10: Advanced + Validate | P7–P8 | 11 | Blend modes, pressure, curves, symmetry, validation |

**Independent Testability: 2/5**
- D1: Empty window 🔴
- D2: Engine with no tools — pointer does nothing useful 🔴
- D3: Tools with no UI (no toolbar, no sliders) — untestable by user 🔴
- D4: Still no UI 🔴
- D5: Finally UI — but this is plan 5 out of 10 🟡
- D6: Now fully functional ✅
- D7–D10: All testable ✅
- ★ Four plans (D1–D4) are not independently testable as a working app. This violates the primary criterion.

**Step Count Balance: 3/5**
- Plans range from 1 step (D8) to 11 steps (D7, D10)
- D2: 2 steps, D3: 3 steps, D4: 4 steps — very small
- D8: 1 step — too granular for a standalone plan
- ★ The distribution is uneven in the opposite direction from Strategy A.

**File Conflict Minimization: 4/5**
- Tiny plans = fewer file modifications per plan
- But PaintEngine.ts is still modified across D5, D6, D7, D8, D9 — the fundamental problem isn't solved
- ★ Marginal improvement in per-plan file ops, but the same files are touched across multiple plans.

**Natural Boundary Alignment: 1/5**
- Many splits feel arbitrary: separating 2.1–2.2 from 2.3–2.5 forces you to implement an engine with no tools
- D8 (just Step 6.1) as its own plan is excessive overhead
- D3 vs D4 (drawing tools vs pixel tools) is a technical distinction without functional meaning
- ★ Too many plans create coordination overhead and context-switching cost.

**Incremental Value: 1/5**
- D1–D4: No user-visible value (4 plans!)
- D5: Partial UI — some value
- D6: Complete MVP — first real user value
- ★ It takes 6 plans to reach the first user-testable state. Terrible incremental value.

**Weighted Score: 2.10/5**

---

## Scored Comparison Table

| Criterion (Weight) | Strategy A: Priority Tier | Strategy B: Technical Concern | Strategy C: Functional Milestone | Strategy D: Fine-Grained |
|---|---|---|---|---|
| Independent Testability (25%) | 4 | 2 | 4 | 2 |
| Step Count Balance (20%) | 2 | 4 | 2 | 3 |
| File Conflict Min (25%) | 3 | 3 | 3 | 4 |
| Natural Boundary (15%) | 5 | 3 | 4 | 1 |
| Incremental Value (15%) | 5 | 2 | 4 | 1 |
| **Weighted Score** | **3.65** | **2.65** | **3.35** | **2.10** |
| **Rank** | **1st** | **3rd** | **2nd** | **4th** |

---

## Recommendation: Hybrid Strategy A+C (Modified Priority Tier)

**None of the four strategies score above 4.0** because all share the same fundamental weakness: `PaintEngine.ts` is modified across 5 phases, and no splitting strategy can eliminate that coupling without refactoring the plan itself.

The recommended strategy is a **modified Strategy A** that addresses its only weakness (Plan 1 is too large at 22 steps) by borrowing the bootstrap split from Strategy C:

### Recommended: Strategy A′ — Priority Tier with Bootstrap Split (5 Plans)

| Plan | Phases | Steps | Name | Milestone |
|---|---|---|---|---|
| **Plan 1** | P1 (4 steps) + Steps 2.1–2.2 (2 steps) | **6** | **Foundation & Canvas Engine** | Electron launches, canvas responds to pointer, Tool interface defined |
| **Plan 2** | Steps 2.3–2.9 (7 steps) + P3 (9 steps) | **16** → **split below** | **P0 MVP: Drawing Tools & UI** | Complete drawing app with all P0 features |
| **Plan 3** | P4–P5 (11 steps) | **11** | **P1 Features: Content & Canvas** | Selection, text, clipboard, canvas management, shapes |
| **Plan 4** | P6 (10 steps) | **10** | **P2 Power: Layers & Effects** | Layers, filters, transforms, dark mode |
| **Plan 5** | P7 (7 steps) + P8 (4 steps) | **11** | **P3 Advanced & Final Validation** | Blend modes, pressure, custom brushes, symmetry, final build |

**Plan 2 is 16 steps — still over the target.** Apply one more split:

### Final Recommended: Strategy A′ — 6 Plans

| Plan | Content | Steps | Name |
|---|---|---|---|
| **Plan 1** | P1 + Steps 2.1–2.2 | **6** | Foundation & Canvas Engine |
| **Plan 2** | Steps 2.3–2.9 | **7** | P0 Core Drawing Tools |
| **Plan 3** | P3 (Steps 3.1–3.9) | **9** | P0 MVP: UI, File I/O & Polish |
| **Plan 4** | P4–P5 (Steps 4.1–5.6) | **11** | P1 Features: Content & Canvas |
| **Plan 5** | P6 (Steps 6.1–6.10) | **10** | P2 Power: Layers & Effects |
| **Plan 6** | P7–P8 (Steps 7.1–8.4) | **11** | P3 Advanced & Final Validation |

### Why This Split?

1. **Plan 1 (6 steps):** Scaffold + PaintEngine + Tool interface. Produces a launching app with a canvas that responds to pointer events. The Tool interface establishes the contract that Plan 2 will implement. This is the "platform" plan.

2. **Plan 2 (7 steps):** All drawing tools + undo. After this plan, every P0 tool exists and functions but lacks UI chrome. **Testable via keyboard-invoked tool switching in `app.ts` or directly via PaintEngine API.** PaintEngine.ts is only created (Plan 1) and not modified in this plan — tools are standalone files.

3. **Plan 3 (9 steps):** UI integration, file I/O, shortcuts. After this plan, the app is a complete P0 MVP. This plan **modifies PaintEngine.ts 3x** (zoom, file I/O, new doc) and `main.ts` 2x, which is the heaviest modification plan, but all changes are additive methods on the already-created PaintEngine.

4. **Plan 4 (11 steps):** P1 features. Modifies PaintEngine.ts 5x — heaviest single-file coupling, but all additions are new methods (selection state, clipboard, resize, export, drag-drop).

5. **Plan 5 (10 steps):** Layers & power features. **The architecturally disruptive plan.** Step 6.1 changes how PaintEngine routes drawing (to active layer) and how UndoManager stores state. Self-contained disruption is better than spreading it.

6. **Plan 6 (11 steps):** Advanced features + final validation. Cleanest boundary — mostly creates new files and additive modifications to Layer/Brush files.

---

## Detailed Plan Breakdown

### Plan 1: Foundation & Canvas Engine (6 Steps)

**Goal:** From empty directory to a launching Electron app with a responsive canvas and defined tool contract.

| Step | Description | Files Created | Files Modified |
|---|---|---|---|
| 1.1 | Bootstrap Electron + Vite + TS | 6 config files | — |
| 1.2 | Configure project structure | types.ts, app.ts, directories | main.ts, preload.ts |
| 1.3 | HTML layout with canvas | index.html structure, app.css | — |
| 1.4 | Validate scaffold | — | — |
| 2.1 | PaintEngine.ts — canvas init, pointer events | PaintEngine.ts | — |
| 2.2 | Tool interface with lineWidth | Tool.ts | types.ts |

**Files created:** package.json, forge.config.ts, tsconfig.json, vite configs ×3, main.ts, preload.ts, index.html, app.ts, app.css, types.ts, PaintEngine.ts, Tool.ts
**Files modified from prior plans:** None (this is Plan 1)
**Hot files touched:** PaintEngine.ts (created), main.ts (scaffold + modify), app.css (created)

**Validation criteria:**
- `npm start` launches Electron window with canvas visible
- `npx tsc --noEmit` passes
- PaintEngine captures pointer events and logs coordinates
- Tool interface compiles with `lineWidth` property

---

### Plan 2: P0 Core Drawing Tools (7 Steps)

**Goal:** All P0 drawing tools implemented and functional on the canvas.

| Step | Description | Files Created | Files Modified |
|---|---|---|---|
| 2.3 | BrushTool — freehand with smoothing | BrushTool.ts | — |
| 2.4 | EraserTool — destination-out | EraserTool.ts | — |
| 2.5 | ShapeTool — line, rect, ellipse | ShapeTool.ts | — |
| 2.6 | FloodFill — scanline queue | FloodFill.ts, FillTool.ts | — |
| 2.7 | ColorSelection — pixel scan + marching ants | ColorSelection.ts | — |
| 2.8 | UndoManager — ImageData snapshot stack | UndoManager.ts | — |
| 2.9 | Validate Phase 2 | — | — |

**Files created:** BrushTool.ts, EraserTool.ts, ShapeTool.ts, FloodFill.ts, FillTool.ts, ColorSelection.ts, UndoManager.ts
**Files modified from Plan 1:** None! All tools are standalone classes implementing the Tool interface. PaintEngine delegates to them but doesn't need modification to add tools (tool registration is in app.ts wiring).
**Hot files touched:** BrushTool.ts (created), UndoManager.ts (created)

**Note:** `app.ts` wiring (registering tools with PaintEngine) is an **implicit modification** in each step — the file dependency analysis flagged this gap. Each tool step should include updating `app.ts` to register the new tool for testing.

**Validation criteria:**
- Each tool draws correctly when activated via code/console
- FloodFill works with tolerance 0, 32, 128
- ColorSelection highlights matching pixels with marching ants
- Undo/redo traverses 50+ operations
- `npx tsc --noEmit` passes

---

### Plan 3: P0 MVP — UI, File I/O & Polish (9 Steps)

**Goal:** Complete P0 MVP — a fully usable paint application with toolbar, property panel, file operations, and keyboard shortcuts.

| Step | Description | Files Created | Files Modified |
|---|---|---|---|
| 3.1 | ColorPicker — fg/bg + swap | ColorPicker.ts | — |
| 3.2 | Toolbar — tool palette sidebar | Toolbar.ts | — |
| 3.3 | PropertyPanel — sliders, toggles | PropertyPanel.ts | — |
| 3.4 | Zoom/pan — CSS transform | — | **PaintEngine.ts** |
| 3.5 | File I/O — open/save dialogs | — | **PaintEngine.ts**, **main.ts**, **preload.ts** |
| 3.6 | New Document dialog | NewDocumentDialog.ts | **PaintEngine.ts**, **main.ts** |
| 3.7 | Keyboard shortcuts | — | **app.ts** |
| 3.8 | CSS layout & component styles | — | **app.css** |
| 3.9 | Validate Phase 3 — full P0 MVP | — | — |

**Files created:** ColorPicker.ts, Toolbar.ts, PropertyPanel.ts, NewDocumentDialog.ts
**Files modified from Plan 1–2:** PaintEngine.ts (3 steps: zoom, file I/O, new doc), main.ts (2 steps: IPC, menu), preload.ts (1 step: bridge), app.ts (1 step: shortcuts), app.css (1 step: styles)
**Hot files touched:** PaintEngine.ts (modified 3×), main.ts (modified 2×), PropertyPanel.ts (created), app.css (modified)

**This plan has the highest concentration of PaintEngine.ts modifications in the P0 tier**, but all are additive (new methods: zoom/pan, save/open, newDocument). No existing functionality is refactored.

**Validation criteria:**
- Toolbar shows all P0 tools with active state highlighting
- Line size slider adjusts stroke width in real-time
- Tolerance/gradiance sliders work for fill and color selection tools
- Zoom with mouse wheel and trackpad pinch works correctly
- File > Open loads PNG/JPEG onto canvas
- File > Save writes canvas to PNG/JPEG
- File > New creates blank canvas with specified dimensions
- All keyboard shortcuts function (B, E, G, W, Ctrl+Z, Ctrl+S, etc.)
- `npx tsc --noEmit` passes

---

### Plan 4: P1 Features — Content & Canvas (11 Steps)

**Goal:** Add selection, text, clipboard, canvas management, and additional shape tools.

| Step | Description | Files Created | Files Modified |
|---|---|---|---|
| 4.1 | Marquee selection — drag, move, copy | SelectionTool.ts | **PaintEngine.ts** |
| 4.2 | Eyedropper — sample color | EyedropperTool.ts | Toolbar.ts |
| 4.3 | Text tool — font, size, color | TextTool.ts | **PropertyPanel.ts** |
| 4.4 | Clipboard — system copy/paste | — | **PaintEngine.ts**, **main.ts**, **preload.ts** |
| 4.5 | Validate Phase 4 | — | — |
| 5.1 | Canvas resize/crop | ResizeDialog.ts | **PaintEngine.ts** |
| 5.2 | Export formats — PNG/JPEG/WebP | — | **PaintEngine.ts**, **main.ts** |
| 5.3 | Drag-and-drop — open images | — | **PaintEngine.ts** |
| 5.4 | Additional shapes — rounded rect, polygon | — | ShapeTool.ts |
| 5.5 | Curve/Bézier tool | CurveTool.ts | — |
| 5.6 | Validate Phase 5 | — | — |

**Files created:** SelectionTool.ts, EyedropperTool.ts, TextTool.ts, ResizeDialog.ts, CurveTool.ts
**Files modified from Plans 1–3:** PaintEngine.ts (5 steps!), main.ts (2), preload.ts (1), Toolbar.ts (1), PropertyPanel.ts (1), ShapeTool.ts (1)
**Hot files touched:** PaintEngine.ts (modified 5×!!), main.ts (modified 2×), PropertyPanel.ts (modified 1×)

**⚠️ PaintEngine.ts is modified in 5 of 11 steps — the highest concentration.** All modifications are additive methods:
- 4.1: `selectionState`, selection overlay rendering
- 4.4: `copyToClipboard()`, `pasteFromClipboard()`, `cutSelection()`
- 5.1: `resizeCanvas()`, `cropToSelection()`
- 5.2: `exportAs(format, quality)`
- 5.3: `handleDragDrop()` event listeners

**Mitigation:** These are all new methods on PaintEngine — they don't refactor existing drawing or pointer handling code. The risk is API surface growth, not breaking changes.

**Validation criteria:**
- Marquee selection creates visible rectangle, content is movable
- Eyedropper samples pixel color and updates foreground
- Text tool renders text with selected font/size/color at click position
- Copy from canvas → paste in Preview works (and reverse)
- Canvas resize preserves content, crop trims to selection
- PNG, JPEG, WebP exports produce valid files
- Drag image from Finder opens it on canvas
- Rounded rectangle and polygon draw correctly
- Bézier curves draw with control points
- `npx tsc --noEmit` passes

---

### Plan 5: P2 Power — Layers & Effects (10 Steps)

**Goal:** Add multi-layer architecture, selection tools, gradient fills, filters, transforms, dark mode, and grid overlay.

| Step | Description | Files Created | Files Modified |
|---|---|---|---|
| 6.1 | Layer system — multi-canvas, layer panel | LayerManager.ts, LayerPanel.ts | **PaintEngine.ts**, **UndoManager.ts** |
| 6.2 | Lasso selection — freeform path | LassoTool.ts | — |
| 6.3 | Gradient tool — linear/radial | GradientTool.ts | — |
| 6.4 | Brush presets — opacity, hardness | — | **BrushTool.ts**, **PropertyPanel.ts** |
| 6.5 | Filters — blur, sharpen, brightness | Filters.ts | — |
| 6.6 | Transforms — rotate, flip, scale | Transform.ts | — |
| 6.7 | Transparency support — alpha, checkerboard | — | **PaintEngine.ts**, **app.css** |
| 6.8 | Dark mode — system + toggle | — | **app.css** |
| 6.9 | Grid overlay and status bar | StatusBar.ts | **PaintEngine.ts** |
| 6.10 | Validate Phase 6 | — | — |

**Files created:** LayerManager.ts, LayerPanel.ts, LassoTool.ts, GradientTool.ts, Filters.ts, Transform.ts, StatusBar.ts (7 new files)
**Files modified from Plans 1–4:** PaintEngine.ts (3 steps: layers, transparency, grid), UndoManager.ts (1 step: multi-layer), BrushTool.ts (1 step: presets), PropertyPanel.ts (1 step: presets), app.css (2 steps: checkerboard, dark mode)
**Hot files touched:** PaintEngine.ts (modified 3×), BrushTool.ts (modified 1×), PropertyPanel.ts (modified 1×), app.css (modified 2×)

**⚠️ Step 6.1 is the most architecturally disruptive step in the entire plan.** It changes:
1. PaintEngine.ts: must route all drawing operations to the active layer's canvas context instead of the single main context
2. UndoManager.ts: must handle per-layer or composite snapshots instead of single-canvas snapshots
3. All existing tools implicitly affected because they receive `ctx` from PaintEngine — the ctx now points to the active layer

**This disruption is contained within Plan 5** — all prior plans work on a single canvas, and Plan 5 introduces the multi-canvas architecture. Plan 6 (advanced features) builds on top of the layer system already in place.

**Validation criteria:**
- Create 5 layers, draw on each independently
- Layer visibility toggle hides/shows content
- Layer reorder changes compositing order
- Flatten merges layers correctly
- Undo/redo works across layer operations
- Lasso creates freeform selection
- Gradient fills from foreground to background
- Brush opacity/hardness adjust in real-time
- Blur/sharpen/brightness/contrast/invert filters work
- Rotate 90°/180°, flip H/V, scale all work
- Transparent areas show checkerboard
- Dark mode follows system preference and manual toggle
- Grid appears at ≥800% zoom, status bar shows position/zoom/size
- `npx tsc --noEmit` passes

---

### Plan 6: P3 Advanced & Final Validation (11 Steps)

**Goal:** Add advanced drawing features and produce a final validated distributable.

| Step | Description | Files Created | Files Modified |
|---|---|---|---|
| 7.1 | Blend modes — per-layer composite ops | — | LayerManager.ts, LayerPanel.ts |
| 7.2 | Layer opacity — per-layer transparency | — | LayerManager.ts, LayerPanel.ts |
| 7.3 | Pressure sensitivity — PointerEvent.pressure | — | BrushTool.ts, EraserTool.ts |
| 7.4 | Custom brush engine — textures, spacing | BrushEngine.ts, BrushPresetPanel.ts | — |
| 7.5 | Curves/levels — color correction | Adjustments.ts, CurvesDialog.ts | — |
| 7.6 | Symmetry drawing — multi-axis mirror | — | BrushTool.ts, PropertyPanel.ts |
| 7.7 | Validate Phase 7 | — | — |
| 8.1 | Full project validation (tsc, lint, make) | — | — |
| 8.2 | Fix minor validation issues | — | Various |
| 8.3 | End-to-end functional testing | — | — |
| 8.4 | Report blocking issues | — | — |

**Files created:** BrushEngine.ts, BrushPresetPanel.ts, Adjustments.ts, CurvesDialog.ts
**Files modified from Plans 1–5:** LayerManager.ts (2 steps), LayerPanel.ts (2 steps), BrushTool.ts (2 steps), EraserTool.ts (1 step), PropertyPanel.ts (1 step)
**Hot files touched:** BrushTool.ts (modified 2×), PropertyPanel.ts (modified 1×)

**This is the cleanest plan boundary.** No modifications to PaintEngine.ts, main.ts, or preload.ts. All modifications are to Plan 2 files (BrushTool, EraserTool) and Plan 5 files (LayerManager, LayerPanel). Changes are additive (new properties, new methods).

**Validation criteria:**
- Blend mode dropdown changes layer compositing visually
- Layer opacity slider adjusts transparency
- Stylus pressure produces variable-width strokes
- Custom brush with texture/spacing/jitter stamps correctly
- Curves/levels dialog adjusts color with histogram
- Symmetry mode mirrors strokes across axes
- `npx tsc --noEmit` passes with zero errors
- `npm run make` produces distributable app
- Full E2E: new → draw → fill → select → text → layers → save → reopen

---

## Dependency Graph Between Plans

```
Plan 1: Foundation & Canvas Engine
  │
  ├─── Plan 2: P0 Core Drawing Tools
  │        │
  │        ├─── Plan 3: P0 MVP — UI, File I/O & Polish
  │        │        │
  │        │        ├─── Plan 4: P1 Features — Content & Canvas
  │        │        │        │
  │        │        │        ├─── Plan 5: P2 Power — Layers & Effects
  │        │        │        │        │
  │        │        │        │        └─── Plan 6: P3 Advanced & Final Validation
  │        │        │        │
  │        │        │        └─── (Plan 6 also depends on Plan 5)
```

**All plans are strictly sequential.** No plan can execute in parallel with another because:
1. Each plan builds on the files created/modified by the prior plan
2. PaintEngine.ts is the throughline — modified in Plans 1, 3, 4, 5
3. Testing each plan requires the prior plan's output as working state

---

## File Conflict Analysis Per Plan Boundary

### Boundary: Plan 1 → Plan 2

| File | Plan 1 Action | Plan 2 Action | Conflict Risk |
|---|---|---|---|
| PaintEngine.ts | Created (C:2.1) | Not modified | 🟢 None |
| Tool.ts | Created (C:2.2) | Implemented against | 🟢 None |
| app.ts | Created (C:1.2) | Implicit wiring for each tool | 🟡 Low — additive |
| types.ts | Created + modified | Not modified | 🟢 None |

**Overall risk: 🟢 Low** — Plan 2 creates new tool files that implement Plan 1's interfaces. Cleanest boundary.

### Boundary: Plan 2 → Plan 3

| File | Plan 2 Action | Plan 3 Action | Conflict Risk |
|---|---|---|---|
| PaintEngine.ts | Not modified | Modified 3× (zoom, file I/O, new doc) | 🟠 Medium — 3 additive methods |
| main.ts | Not modified | Modified 2× (IPC handlers, menu) | 🟡 Low — additive |
| preload.ts | Not modified | Modified 1× (bridge APIs) | 🟢 None |
| app.ts | Implicit tool wiring | Modified 1× (keyboard shortcuts) | 🟢 None |
| app.css | Created in Plan 1 | Modified 1× (component styles) | 🟢 None |

**Overall risk: 🟠 Medium** — PaintEngine.ts gets 3 new method groups (zoom/pan, save/open, newDocument). All additive; no existing code is changed.

### Boundary: Plan 3 → Plan 4

| File | Plan 3 Action | Plan 4 Action | Conflict Risk |
|---|---|---|---|
| **PaintEngine.ts** | Modified 3× | **Modified 5×** | 🔴 **High** — heaviest modification load |
| main.ts | Modified 2× | Modified 2× (clipboard IPC, export filters) | 🟠 Medium |
| preload.ts | Modified 1× | Modified 1× (clipboard bridge) | 🟡 Low |
| PropertyPanel.ts | Created | Modified 1× (text controls) | 🟡 Low |
| Toolbar.ts | Created | Modified 1× (eyedropper button) | 🟡 Low |
| ShapeTool.ts | Created (Plan 2) | Modified 1× (rounded rect, polygon) | 🟡 Low |

**Overall risk: 🔴 High** — PaintEngine.ts is modified in 5 of 11 steps. However, all are new method additions (selection state, clipboard, resize, export, drag-drop). No refactoring of existing drawing/pointer code.

### Boundary: Plan 4 → Plan 5

| File | Plan 4 Action | Plan 5 Action | Conflict Risk |
|---|---|---|---|
| **PaintEngine.ts** | Modified 5× | **Modified 3× (layers, transparency, grid)** | 🔴 **Critical** — Step 6.1 changes drawing routing |
| UndoManager.ts | Not modified since Plan 2 | Modified 1× (multi-layer) | 🟠 Medium — architectural change |
| BrushTool.ts | Not modified since Plan 2 | Modified 1× (presets) | 🟡 Low |
| PropertyPanel.ts | Modified 1× | Modified 1× (presets) | 🟡 Low |
| app.css | Modified 1× | Modified 2× (checkerboard, dark mode) | 🟡 Low |

**Overall risk: 🔴 Critical** — Step 6.1 (layer system) is the single most disruptive step. PaintEngine must be refactored to route drawing to active layer context. UndoManager must support multi-layer snapshots. This is an intentional architectural evolution, not a conflict — it's correctly scoped to Plan 5.

### Boundary: Plan 5 → Plan 6

| File | Plan 5 Action | Plan 6 Action | Conflict Risk |
|---|---|---|---|
| LayerManager.ts | Created | Modified 2× (blend modes, opacity) | 🟡 Low — additive properties |
| LayerPanel.ts | Created | Modified 2× (blend dropdown, opacity slider) | 🟡 Low — additive UI |
| BrushTool.ts | Modified 1× | Modified 2× (pressure, symmetry) | 🟡 Low — additive features |
| EraserTool.ts | Not modified | Modified 1× (pressure) | 🟢 None |
| PropertyPanel.ts | Modified 1× | Modified 1× (symmetry controls) | 🟢 None |

**Overall risk: 🟢 Low** — Cleanest boundary. All modifications are additive properties and UI elements to files created in Plan 5 (Layers) or Plan 2 (tools). No PaintEngine.ts modifications.

---

## Risk Summary by Plan

| Plan | Steps | PaintEngine.ts Mods | Highest Boundary Risk | Notes |
|---|---|---|---|---|
| Plan 1 | 6 | Created (1) | — (first plan) | Foundation — no conflicts possible |
| Plan 2 | 7 | 0 | 🟢 Low entry | Tools implement interfaces from Plan 1; clean separation |
| Plan 3 | 9 | 3 | 🟠 Medium entry | Adds zoom, file I/O, new doc to PaintEngine; all additive |
| Plan 4 | 11 | 5 | 🔴 High entry | Heaviest PaintEngine modification plan; all additive methods |
| Plan 5 | 10 | 3 | 🔴 Critical entry (6.1) | Layer architecture disruption; contained and intentional |
| Plan 6 | 11 | 0 | 🟢 Low entry | Cleanest plan; no PaintEngine mods |

---

## Mitigation Recommendations

### For Plan 4 → Plan 5 Boundary (Layer Architecture)

The layer system (Step 6.1) changes PaintEngine's fundamental drawing routing. To reduce this disruption:

1. **In Plan 1 (Step 2.1):** Design PaintEngine with a `DrawingContext` abstraction from the start. Instead of tools receiving `CanvasRenderingContext2D` directly, give them a `DrawingContext` wrapper. When layers arrive in Plan 5, `DrawingContext` switches from wrapping the single canvas to wrapping the active layer's canvas — transparent to all tools.

2. **In Plan 5 (Step 6.1):** Write the layer system as a `LayerManager` that plugs into PaintEngine's `DrawingContext`. No tool code changes needed — only PaintEngine's context provider changes.

### For PaintEngine.ts Growth (God Object Risk)

PaintEngine.ts accumulates 12+ responsibilities across 5 phases. Consider extracting sub-managers during Plan 3 or Plan 4:

- `ZoomManager` — zoom/pan state and coordinate transforms (Step 3.4)
- `FileManager` — save/open/export/new doc (Steps 3.5, 3.6, 5.2)
- `SelectionManager` — selection state, marching ants, clipboard (Steps 4.1, 4.4)
- `DragDropHandler` — drag-and-drop (Step 5.3)

This would reduce PaintEngine.ts from a god object to a coordinator that delegates to focused managers, reducing the modification pressure at each plan boundary.

---

## Next Research Not Completed

- [ ] Analyze whether the `DrawingContext` abstraction recommendation affects step count or plan boundaries
- [ ] Estimate implementation time per plan (not done per instructions to avoid time estimates)
- [ ] Evaluate automated testing strategy as a parallel plan track (currently zero test files)
- [ ] Research `app.ts` implicit wiring — quantify the hidden modification count across all steps
- [ ] Evaluate the `FillTool.ts` gap — should it be Step 2.6a or folded into Step 2.6?

---

## Clarifying Questions

1. **Is the ~15 step limit strict or advisory?** Plan 4 has 11 steps, but with implicit `app.ts` wiring modifications the true count may be higher. Should we count implicit modifications?

2. **Should each plan have its own validation step?** The current recommendation includes validation at the end of each plan (Steps 2.9, 3.9, 4.5, 5.6, 6.10, 7.7, 8.1–8.4). If not, some steps could be consolidated.

3. **Should Plan 5 (layers) be further split?** Step 6.1 alone is a substantial architectural change. It could be its own plan (1 step) followed by "power features" (9 steps), but this was rejected in Strategy D evaluation for being too granular.

4. **Should `PaintEngine.ts` sub-manager extraction be added as steps in Plan 3?** This would add 1–2 steps to Plan 3 (which has 9 steps, room for 1–2 more under the 15-step guideline) but significantly reduce boundary conflict risk for Plans 4 and 5.

5. **Are Plans 2 and 3 truly independently testable?** Plan 2 has tools but no UI. It can be tested via code but not via the GUI. Is code-level testability sufficient, or must every plan be GUI-testable?
