<!-- markdownlint-disable-file -->
# Implementation Details: Split Monolithic Mac Paint Plan into 6 Focused Plans

## Context Reference

Sources: `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` (A-prime strategy, Sections 4–9), `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` (monolithic plan), `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` (monolithic details, 1492 lines), `.copilot-tracking/plans/logs/2026-02-26/mac-paint-app-log.md` (monolithic log)

## Implementation Phase 1: Create Plan 01 — Foundation and Canvas Engine

<!-- parallelizable: true -->

### Step 1.1: Create plan-01-foundation.instructions.md

Create `.copilot-tracking/plans/2026-02-26/plan-01-foundation.instructions.md` by extracting content from the monolithic plan.

**Source mapping from monolithic plan:**
* Phase 1: Steps 1.1–1.4 (Project Scaffold & Electron Shell) — monolithic plan Lines 39–53
* Phase 2: Steps 2.1–2.2 (PaintEngine.ts and Tool interface) — monolithic plan Lines 61–67

**Plan structure:**
* Overview: Bootstrap Electron + Vite + TypeScript project, initialize PaintEngine and Tool interface
* Objectives: inherit User Requirements from monolithic plan; Derived Objective = establish the platform all subsequent plans build on
* Phase 1 (4 steps): Scaffold, project structure, HTML layout, validate scaffold
* Phase 2 (2 steps): PaintEngine.ts canvas init + pointer events, Tool interface with lineWidth
* Validation phase: `npm start` launches Electron with canvas, `npx tsc --noEmit` passes
* Dependencies: Node.js 18+, npm, Electron Forge CLI
* Success criteria: Electron launches, canvas responds to pointer events, Tool interface defined, TypeScript compiles

**Key details:**
* `applyTo` frontmatter pointing to plan-01-specific changes file
* No predecessor plan dependency (this is the first plan)
* All phases sequential (scaffold must complete before engine code)
* Include full dependency list (Node.js, npm, Electron Forge)

Files:
* `.copilot-tracking/plans/2026-02-26/plan-01-foundation.instructions.md` — Create new

Success criteria:
* Plan file follows template structure with frontmatter, overview, objectives, checklist, dependencies, success criteria
* 6 steps extracted correctly from monolithic plan
* No references to steps belonging to other plans

Context references:
* plan-splitting-strategy-research.md (Lines 123–157) — Plan 1 breakdown table
* mac-paint-app-plan.instructions.md (Lines 39–67) — Phase 1 and Steps 2.1–2.2

Dependencies:
* None (first phase, can execute immediately)

### Step 1.2: Create plan-01-foundation-details.md

Create `.copilot-tracking/details/2026-02-26/plan-01-foundation-details.md` by extracting content from the monolithic details file.

**Source mapping from monolithic details:**
* Phase 1 (Steps 1.1–1.4): Lines 10–155
* Steps 2.1–2.2: Lines 155–260

**Content to extract:**
* Step 1.1: Electron Forge `npm init` command, package.json, forge.config.ts, tsconfig.json, vite configs
* Step 1.2: Full directory tree, types.ts creation, main.ts/preload.ts modification
* Step 1.3: HTML layout structure with CSS Grid, canvas container, toolbar sidebar, property panel
* Step 1.4: Validation commands (tsc, npm start)
* Step 2.1: PaintEngine.ts — canvas init, coordinate mapping, PointerEvent handling, `willReadFrequently: true`
* Step 2.2: Tool interface definition (TypeScript), ToolType enum, Point/Color types

**Key details:**
* Preserve ALL code snippets verbatim
* Preserve all file lists, success criteria, context references, and dependency chains
* Update line references to be relative to the new details file (not the monolithic one)
* Context Reference section pointing to research files

Files:
* `.copilot-tracking/details/2026-02-26/plan-01-foundation-details.md` — Create new

Success criteria:
* All code snippets from monolithic details Lines 10–260 preserved
* Line references in the plan file match the new details file line numbers
* No references to steps from other plans

Context references:
* mac-paint-app-details.md (Lines 10–260) — Source content

Dependencies:
* None (can execute in parallel with Step 1.1)

### Step 1.3: Create plan-01-foundation-log.md

Create `.copilot-tracking/plans/logs/2026-02-26/plan-01-foundation-log.md` with plan-specific discrepancy tracking.

**Content:**

Unaddressed Research Items:
* None specific to Plan 1 — all Plan 1 steps implement research recommendations directly

Plan Deviations from Research:
* DD-01 (inherited): Phase structure expanded from 4 research phases to 8 implementation phases — Plan 1 covers the first 1.5 of the 8 phases

Implementation Paths Considered:
* Selected: Electron + HTML5 Canvas 2D + TypeScript (inherited from monolithic plan)
* IP-01: Tauri + HTML5 Canvas — rejected per monolithic plan rationale
* IP-02: Python + PyQt6/PySide6 — rejected per monolithic plan rationale

Suggested Follow-On Work:
* WI-01: DrawingContext abstraction — Consider implementing in Step 2.1 per research Section 8 mitigation, to ease layer integration in Plan 5

Files:
* `.copilot-tracking/plans/logs/2026-02-26/plan-01-foundation-log.md` — Create new

Success criteria:
* Log follows Planning Log Template
* DrawingContext mitigation referenced
* Implementation paths inherited from monolithic plan

Context references:
* plan-splitting-strategy-research.md (Lines 300–320) — DrawingContext abstraction mitigation
* mac-paint-app-log.md — Source DRs and DDs

Dependencies:
* None (can execute in parallel with Steps 1.1, 1.2)

## Implementation Phase 2: Create Plan 02 — P0 Core Drawing Tools

<!-- parallelizable: true -->

### Step 2.1: Create plan-02-drawing-tools.instructions.md

Create `.copilot-tracking/plans/2026-02-26/plan-02-drawing-tools.instructions.md` by extracting content from the monolithic plan.

**Source mapping from monolithic plan:**
* Steps 2.3–2.9 — monolithic plan Lines 68–87

**Plan structure:**
* Overview: Implement all P0 drawing tools as standalone files implementing the Tool interface
* Objectives: User Requirement = paint bucket with tolerance, color-tolerance selection with gradiance, line size on all tools; Derived = standalone tool files with zero PaintEngine.ts modification
* Phase 1 (7 steps): BrushTool, EraserTool, ShapeTool, FloodFill + FillTool wrapper, ColorSelection, UndoManager, validate
* Validation phase: Each tool draws correctly, flood fill with tolerance 0/32/128, undo/redo 50+ operations
* Dependencies: Plan 01 completion (PaintEngine.ts and Tool interface must exist)
* Success criteria: All P0 tools functional, PaintEngine.ts unchanged

**Key details:**
* `applyTo` frontmatter pointing to plan-02-specific changes file
* Predecessor dependency: Plan 01 must be complete
* FillTool.ts explicitly added as wrapper around FloodFill.ts (addresses research gap per plan-splitting-strategy-research.md Section 8)
* Zero PaintEngine.ts modification — this is the cleanest plan

Files:
* `.copilot-tracking/plans/2026-02-26/plan-02-drawing-tools.instructions.md` — Create new

Success criteria:
* 7 steps extracted correctly
* FillTool.ts wrapper included in Step 2.6
* Plan explicitly notes zero PaintEngine.ts modifications
* Dependency on Plan 01 documented

Context references:
* plan-splitting-strategy-research.md (Lines 158–192) — Plan 2 breakdown
* mac-paint-app-plan.instructions.md (Lines 68–87) — Steps 2.3–2.9

Dependencies:
* None (can execute in parallel with Phase 1)

### Step 2.2: Create plan-02-drawing-tools-details.md

Create `.copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md` by extracting monolithic details Lines 260–500.

**Content to extract:**
* Step 2.3: BrushTool — quadraticCurveTo smoothing algorithm, lineCap/lineJoin, midpoint calculation
* Step 2.4: EraserTool — destination-out compositing, restore source-over
* Step 2.5: ShapeTool — line/rect/ellipse, stroke/fill toggle, Shift-constrain, overlay canvas preview
* Step 2.6: FloodFill — scanline queue algorithm with Euclidean distance, performance target ~15ms, FillTool wrapper
* Step 2.7: ColorSelection — full-canvas pixel scan, gradiance slider, marching ants overlay with requestAnimationFrame
* Step 2.8: UndoManager — ImageData snapshot stack (50 levels), memory calculation (~150MB for 50 snapshots)
* Step 2.9: Validation — manual test checklist

Files:
* `.copilot-tracking/details/2026-02-26/plan-02-drawing-tools-details.md` — Create new

Success criteria:
* All algorithms preserved verbatim (flood fill, color selection, smoothing)
* Code snippets preserved (colorDistance function, smoothing midpoint calculation)
* Performance targets preserved

Context references:
* mac-paint-app-details.md (Lines 260–500) — Source content

Dependencies:
* None

### Step 2.3: Create plan-02-drawing-tools-log.md

Create `.copilot-tracking/plans/logs/2026-02-26/plan-02-drawing-tools-log.md`.

**Content:**

Unaddressed Research Items:
* DR-06 (inherited): Euclidean RGB distance used instead of perceptual weighting — standard and sufficient per research

Plan Deviations:
* None — Plan 2 directly implements research-recommended algorithms

Implementation Paths:
* Selected: Scanline queue-based flood fill — per research benchmarking
* IP-01: Recursive flood fill — rejected (stack overflow risk)

Suggested Follow-On Work:
* WI-01: Perceptual color distance — optional upgrade to use CIE ΔE*ab instead of Euclidean RGB

Files:
* `.copilot-tracking/plans/logs/2026-02-26/plan-02-drawing-tools-log.md` — Create new

Success criteria:
* DR-06 inherited and documented
* Flood fill algorithm path documented

Dependencies:
* None

## Implementation Phase 3: Create Plan 03 — P0 MVP UI, File I/O and Polish

<!-- parallelizable: true -->

### Step 3.1: Create plan-03-mvp-ui.instructions.md

Create `.copilot-tracking/plans/2026-02-26/plan-03-mvp-ui.instructions.md` by extracting monolithic plan Phase 3 (Steps 3.1–3.9).

**Source mapping from monolithic plan:**
* Phase 3: Steps 3.1–3.9 — monolithic plan Lines 93–131

**Plan structure:**
* Overview: Complete the P0 MVP with UI components, file I/O, keyboard shortcuts, and styling
* Objectives: User Requirement = simple but powerful paint app, runs locally; Derived = complete P0 feature set
* Phase 1 (9 steps): ColorPicker, Toolbar, PropertyPanel, zoom/pan, file I/O, New Document, keyboard shortcuts, CSS, validate MVP
* Important notes: PaintEngine.ts modified 3× (Steps 3.4, 3.5, 3.6) — all additive methods, medium risk
* Milestone: After this plan completes, the app is a fully usable paint application
* Dependencies: Plan 02 completion (all P0 tools must exist)

**Key details:**
* DR-10 from monolithic log is RESOLVED in this plan — New Document dialog is Step 3.6
* This plan produces the first complete user-visible MVP
* main.ts and preload.ts modified for IPC handlers

Files:
* `.copilot-tracking/plans/2026-02-26/plan-03-mvp-ui.instructions.md` — Create new

Success criteria:
* 9 steps extracted correctly
* PaintEngine.ts modification count (3×) documented
* MVP milestone clearly stated
* DR-10 resolution documented

Context references:
* plan-splitting-strategy-research.md (Lines 193–227) — Plan 3 breakdown
* mac-paint-app-plan.instructions.md (Lines 93–131) — Phase 3

Dependencies:
* None (can execute in parallel)

### Step 3.2: Create plan-03-mvp-ui-details.md

Create `.copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md` by extracting monolithic details Lines 500–730.

**Content to extract:**
* Step 3.1: ColorPicker — input type="color", fg/bg swap, X key shortcut
* Step 3.2: Toolbar — vertical sidebar, tool buttons, active state, keyboard shortcuts
* Step 3.3: PropertyPanel — line size/tolerance/gradiance sliders, shape mode, brush size cursor (canvas data URL technique)
* Step 3.4: Zoom/pan — CSS transform scale, wheel/pinch events, coordinate mapping update
* Step 3.5: File I/O — full IPC handler code (main.ts), contextBridge code (preload.ts), save/open renderer code
* Step 3.6: New Document — dialog implementation, unsaved changes prompt, PaintEngine.newDocument() method
* Step 3.7: Keyboard shortcuts — full event handler code, tool keystroke map, meta key handling
* Step 3.8: CSS — Grid layout dimensions, component styles, checkerboard pattern
* Step 3.9: Full MVP validation workflow (10-step manual test)

Files:
* `.copilot-tracking/details/2026-02-26/plan-03-mvp-ui-details.md` — Create new

Success criteria:
* All IPC code snippets preserved (main.ts handlers, preload bridge, renderer save/open)
* Keyboard shortcut event handler code preserved
* CSS layout grid specification preserved
* Full MVP validation workflow preserved

Context references:
* mac-paint-app-details.md (Lines 500–730) — Source content

Dependencies:
* None

### Step 3.3: Create plan-03-mvp-ui-log.md

Create `.copilot-tracking/plans/logs/2026-02-26/plan-03-mvp-ui-log.md`.

**Content:**

Unaddressed Research Items:
* DR-10 (RESOLVED): New Document dialog — now implemented as Step 3.6 in this plan

Plan Deviations:
* DD-01 (inherited): Phase structure expanded for finer granularity

Implementation Paths:
* Selected: HTML `<input type="color">` for color picker — simple, native
* IP-01: Custom canvas-based HSV picker — more control but unnecessary for P0

Suggested Follow-On Work:
* WI-01: Sub-manager extraction — Consider extracting ZoomManager, FileManager from PaintEngine.ts during this plan (1–2 extra steps) to reduce modification pressure in Plans 4–5

Files:
* `.copilot-tracking/plans/logs/2026-02-26/plan-03-mvp-ui-log.md` — Create new

Success criteria:
* DR-10 marked as resolved
* Sub-manager extraction documented as follow-on

Dependencies:
* None

## Implementation Phase 4: Create Plan 04 — P1 Features: Content and Canvas

<!-- parallelizable: true -->

### Step 4.1: Create plan-04-p1-features.instructions.md

Create `.copilot-tracking/plans/2026-02-26/plan-04-p1-features.instructions.md` by extracting monolithic plan Phases 4–5 (Steps 4.1–5.6).

**Source mapping from monolithic plan:**
* Phase 4: Steps 4.1–4.5 — monolithic plan Lines 137–156
* Phase 5: Steps 5.1–5.6 — monolithic plan Lines 162–185

**Plan structure:**
* Overview: Add P1 features — selection tools, text, clipboard, canvas management, additional shapes, curves
* Objectives: User Requirement = powerful app; Derived = P1 feature completion
* Phase 1 (5 steps): Marquee selection, eyedropper, text tool, clipboard, validate
* Phase 2 (6 steps): Canvas resize/crop, export formats, drag-drop, additional shapes, curves, validate
* Important notes: PaintEngine.ts modified 5× — heaviest modification load across all plans, but all additive
* Dependencies: Plan 03 completion (UI components and file I/O must exist)

**Key details:**
* DD-02 and DD-03 context: Phases 4 and 5 are sequential because both modify PaintEngine.ts
* This is the heaviest PaintEngine.ts modification plan — 5 new methods added
* Two internal validation steps (4.5 and 5.6)

Files:
* `.copilot-tracking/plans/2026-02-26/plan-04-p1-features.instructions.md` — Create new

Success criteria:
* 11 steps extracted correctly (5 from Phase 4, 6 from Phase 5)
* PaintEngine.ts modification count (5×) and risk level documented
* Both internal phases marked sequential
* Dependency on Plan 03 documented

Context references:
* plan-splitting-strategy-research.md (Lines 228–268) — Plan 4 breakdown
* mac-paint-app-plan.instructions.md (Lines 137–185) — Phases 4–5

Dependencies:
* None (can execute in parallel)

### Step 4.2: Create plan-04-p1-features-details.md

Create `.copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md` by extracting monolithic details Lines 730–1050.

**Content to extract:**
* Step 4.1: SelectionTool — marquee drag, overlay canvas, move/copy/paste, marching ants, PaintEngine selection state
* Step 4.2: EyedropperTool — getImageData sampling, Alt+click from any tool, color preview
* Step 4.3: TextTool — contenteditable overlay, ctx.fillText(), font picker, PropertyPanel text controls
* Step 4.4: Clipboard — navigator.clipboard API, Electron clipboard module, IPC bridge, cut/copy/paste/paste-as-new
* Step 4.5: Phase 4 validation
* Step 5.1: Canvas resize/crop — ResizeDialog, anchor position grid, getImageData/putImageData
* Step 5.2: Export formats — PNG/JPEG/WebP via toBlob(), quality parameter, format from extension
* Step 5.3: Drag-and-drop — HTML5 drag events, image type check, URL.createObjectURL
* Step 5.4: Additional shapes — roundRect(), polygon vertex placement, stroke/fill toggle
* Step 5.5: Curve/Bézier tool — quadratic/cubic curves, control point handles, commit on Enter
* Step 5.6: Phase 5 validation

Files:
* `.copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md` — Create new

Success criteria:
* All clipboard IPC code preserved
* Selection tool mechanics preserved (overlay canvas, marching ants)
* Drag-drop code snippet preserved
* Curve tool control point mechanics preserved

Context references:
* mac-paint-app-details.md (Lines 730–1050) — Source content

Dependencies:
* None

### Step 4.3: Create plan-04-p1-features-log.md

Create `.copilot-tracking/plans/logs/2026-02-26/plan-04-p1-features-log.md`.

**Content:**

Unaddressed Research Items:
* DR-04 (inherited): Pen/Bézier SVG-style path editing deferred — curve tool in Step 5.5 covers basic needs
* DR-08 (inherited): Advanced selection features (feather, global mask, add/subtract) deferred — basic marquee + color tolerance sufficient

Plan Deviations:
* DD-02 (inherited): Phases 4 and 5 sequential due to shared PaintEngine.ts modifications
* DD-03 (inherited): Both phases modify PaintEngine.ts — sequential to avoid merge conflicts

Implementation Paths:
* Selected: PaintEngine receives additive methods — no refactoring of existing code
* IP-01: Extract CanvasManager to reduce PaintEngine — rejected per DD-03 (simpler to keep sequential)

Suggested Follow-On Work:
* WI-01: Advanced selection modes (add/subtract/feather) — extend SelectionTool after basic selection proven
* WI-02: SVG path editing — would require vector layer concept, significant architecture change

Files:
* `.copilot-tracking/plans/logs/2026-02-26/plan-04-p1-features-log.md` — Create new

Success criteria:
* DR-04, DR-08 inherited
* DD-02, DD-03 context preserved
* PaintEngine additive method approach documented

Dependencies:
* None

## Implementation Phase 5: Create Plan 05 — P2 Power: Layers and Effects

<!-- parallelizable: true -->

### Step 5.1: Create plan-05-layers-power.instructions.md

Create `.copilot-tracking/plans/2026-02-26/plan-05-layers-power.instructions.md` by extracting monolithic plan Phase 6 (Steps 6.1–6.10).

**Source mapping from monolithic plan:**
* Phase 6: Steps 6.1–6.10 — monolithic plan Lines 191–227

**Plan structure:**
* Overview: Introduce multi-layer architecture and P2 power features — architecturally disruptive plan
* Objectives: User Requirement = powerful app with layers; Derived = multi-canvas layer system, filters, transforms
* Phase 1 (10 steps): Layer system (disruptive), lasso selection, gradient, brush presets, filters, transforms, transparency, dark mode, grid/status bar, validate
* ARCHITECTURAL WARNING: Step 6.1 changes PaintEngine.ts drawing routing and UndoManager state management
* Mitigation: DrawingContext abstraction (if implemented in Plan 1) makes this transition transparent to tools
* Dependencies: Plan 04 completion (all P1 features and 5 PaintEngine methods must exist)

**Key details:**
* Step 6.1 is the most disruptive step in the entire project — routes drawing through active layer instead of single canvas
* UndoManager must switch from single-canvas snapshots to per-layer or composite snapshots
* All disruption is contained within this plan
* PaintEngine.ts modified 3× (layers, transparency, grid)

Files:
* `.copilot-tracking/plans/2026-02-26/plan-05-layers-power.instructions.md` — Create new

Success criteria:
* 10 steps extracted correctly
* Architectural disruption warning prominent
* DrawingContext mitigation referenced
* Layer system dependencies clearly documented

Context references:
* plan-splitting-strategy-research.md (Lines 269–302) — Plan 5 breakdown
* plan-splitting-strategy-research.md (Lines 300–320) — DrawingContext mitigation
* mac-paint-app-plan.instructions.md (Lines 191–227) — Phase 6

Dependencies:
* None (can execute in parallel)

### Step 5.2: Create plan-05-layers-power-details.md

Create `.copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md` by extracting monolithic details Lines 1050–1300.

**Content to extract:**
* Step 6.1: Layer system — multi-canvas architecture (position: absolute, z-index), LayerManager, LayerPanel UI (thumbnails, visibility, reorder drag), PaintEngine routing to active layer, UndoManager adaptation
* Step 6.2: LassoTool — freeform path, isPointInPath/scanline fill, marching ants
* Step 6.3: GradientTool — createLinearGradient/createRadialGradient, mode toggle
* Step 6.4: Brush presets — globalAlpha opacity, gaussian hardness, preset library in PropertyPanel
* Step 6.5: Filters — invert/brightness/contrast/blur/sharpen algorithms, kernel convolution, per-selection application
* Step 6.6: Transform — rotate via translate+rotate+drawImage, flip via scale, resize
* Step 6.7: Transparency — checkerboard CSS background, transparent default canvas
* Step 6.8: Dark mode — prefers-color-scheme, CSS variables, manual toggle
* Step 6.9: Grid overlay — pixel grid at 800%+ zoom, StatusBar component
* Step 6.10: Phase 6 validation

Files:
* `.copilot-tracking/details/2026-02-26/plan-05-layers-power-details.md` — Create new

Success criteria:
* Layer architecture description preserved (multi-canvas, z-index, active layer routing)
* All filter algorithms preserved (invert, brightness, contrast formulas, kernel matrices)
* Dark mode CSS variable scheme preserved

Context references:
* mac-paint-app-details.md (Lines 1050–1300) — Source content

Dependencies:
* None

### Step 5.3: Create plan-05-layers-power-log.md

Create `.copilot-tracking/plans/logs/2026-02-26/plan-05-layers-power-log.md`.

**Content:**

Unaddressed Research Items:
* DR-01 (inherited): Native `.paintdoc` format deferred — layers now exist but format spec would be additional scope
* DR-05 (inherited): Non-destructive filter layers deferred — destructive filters in Step 6.5 are sufficient initially

Plan Deviations:
* DD-01 (inherited): Phase structure expanded for finer granularity

Implementation Paths:
* Selected: Multi-canvas layer system (stacked `<canvas>` elements) — per research html5-canvas-patterns-research.md
* IP-01: Single canvas with off-screen layer buffers — rejected (more complex compositing, no z-index benefit)
* IP-02: OffscreenCanvas + Worker — rejected (unnecessary complexity for initial implementation)

Suggested Follow-On Work:
* WI-01: Native .paintdoc format — preserve layers, undo history, tool state across save/load
* WI-02: Non-destructive filter layers — requires filter layer abstraction atop layer system
* WI-03: Layer groups/folders — organize layers hierarchically

Files:
* `.copilot-tracking/plans/logs/2026-02-26/plan-05-layers-power-log.md` — Create new

Success criteria:
* DR-01, DR-05 inherited with context that layers now exist
* Layer implementation path documented with alternatives
* Follow-on items for native format and non-destructive filters

Dependencies:
* None

## Implementation Phase 6: Create Plan 06 — P3 Advanced and Final Validation

<!-- parallelizable: true -->

### Step 6.1: Create plan-06-advanced.instructions.md

Create `.copilot-tracking/plans/2026-02-26/plan-06-advanced.instructions.md` by extracting monolithic plan Phases 7–8 (Steps 7.1–8.4).

**Source mapping from monolithic plan:**
* Phase 7: Steps 7.1–7.7 — monolithic plan Lines 233–262
* Phase 8: Steps 8.1–8.4 — monolithic plan Lines 268–289

**Plan structure:**
* Overview: Advanced drawing features and final project validation + distributable build
* Objectives: User Requirement = powerful app; Derived = P3 features + distributable
* Phase 1 (7 steps): Blend modes, layer opacity, pressure sensitivity, custom brush engine, curves/levels, symmetry, validate
* Phase 2 (4 steps): Full tsc + lint + make validation, fix minor issues, E2E testing, report blockers
* Important notes: Zero PaintEngine.ts modifications — cleanest plan, all changes target Layer/Brush files
* Dependencies: Plan 05 completion (layer system must exist for blend modes and opacity)

**Key details:**
* Include comprehensive E2E test checklist from monolithic plan Step 8.3
* `npm run make` produces distributable app bundle
* Final plan — no successor dependency
* Blocking issues documented rather than fixed inline

Files:
* `.copilot-tracking/plans/2026-02-26/plan-06-advanced.instructions.md` — Create new

Success criteria:
* 11 steps extracted correctly (7 from Phase 7, 4 from Phase 8)
* Zero PaintEngine.ts modifications noted
* Full E2E test checklist preserved
* `npm run make` included in validation

Context references:
* plan-splitting-strategy-research.md (Lines 303–340) — Plan 6 breakdown
* mac-paint-app-plan.instructions.md (Lines 233–289) — Phases 7–8

Dependencies:
* None (can execute in parallel)

### Step 6.2: Create plan-06-advanced-details.md

Create `.copilot-tracking/details/2026-02-26/plan-06-advanced-details.md` by extracting monolithic details Lines 1300–1492.

**Content to extract:**
* Step 7.1: Blend modes — per-layer globalCompositeOperation (multiply, screen, overlay, darken, lighten), LayerManager + LayerPanel modifications
* Step 7.2: Layer opacity — per-layer globalAlpha, opacity slider in LayerPanel
* Step 7.3: Pressure sensitivity — PointerEvent.pressure (0.0–1.0), pressure-to-width mapping, pointerType === 'pen', variable-width circle rendering
* Step 7.4: Custom brush engine — BrushEngine.ts (stamp textures, spacing, scatter/jitter, rotation), BrushPresetPanel.ts
* Step 7.5: Curves/levels — Adjustments.ts (256-entry lookup table, per-channel), CurvesDialog.ts (draggable curve points, histogram)
* Step 7.6: Symmetry drawing — multi-axis mirror (1–12 axes), rotational duplication (360/N), visual axis overlay
* Step 7.7: Phase 7 validation
* Step 8.1: Full validation (tsc, lint, make)
* Step 8.2: Fix minor issues
* Step 8.3: E2E testing (comprehensive workflow test, all tools, all tolerance/gradiance levels, 50+ undo, layers, file I/O)
* Step 8.4: Report blocking issues

Files:
* `.copilot-tracking/details/2026-02-26/plan-06-advanced-details.md` — Create new

Success criteria:
* Pressure sensitivity implementation preserved (PointerEvent.pressure, mapping formula)
* Custom brush stamp mechanics preserved
* Curves/levels lookup table approach preserved
* Full E2E test script preserved from Step 8.3

Context references:
* mac-paint-app-details.md (Lines 1300–1492) — Source content

Dependencies:
* None

### Step 6.3: Create plan-06-advanced-log.md

Create `.copilot-tracking/plans/logs/2026-02-26/plan-06-advanced-log.md`.

**Content:**

Unaddressed Research Items:
* DR-02 (inherited): HEIF/HEIC, TIFF, PSD, SVG, RAW, OpenEXR, ICO/ICNS format support — beyond scope
* DR-03 (inherited): Animation support with frame timeline — niche, separate investigation
* DR-07 (inherited): Full Color Management (ICC profiles) and HDR — professional-grade, beyond target
* DR-09 (inherited): Batch Processing — beyond scope

Plan Deviations:
* None — Plan 6 implements research P3 recommendations directly

Implementation Paths:
* Selected: Canvas globalCompositeOperation for blend modes — native API support
* IP-01: Manual pixel-by-pixel blending — rejected (vastly more complex, no benefit over native API)

Suggested Follow-On Work:
* WI-01: Animation/frame timeline — requires significant architecture (frame manager, timeline UI, GIF encoder)
* WI-02: Additional export formats (HEIF/TIFF/PSD) — requires format-specific libraries
* WI-03: ICC color profiles — requires color management library
* WI-04: Batch processing — apply operations to multiple files

Files:
* `.copilot-tracking/plans/logs/2026-02-26/plan-06-advanced-log.md` — Create new

Success criteria:
* All remaining DRs (02, 03, 07, 09) inherited
* Follow-on items cover animation, formats, color management, batch
* Blend mode implementation path documented

Dependencies:
* None

## Implementation Phase 7: Archive and Cross-Reference Validation

<!-- parallelizable: false -->

### Step 7.1: Archive monolithic plan files

Rename the original monolithic files to indicate they have been superseded by the 6 split plans. Append `.archived` suffix to each file.

Files to rename:
* `.copilot-tracking/plans/2026-02-26/mac-paint-app-plan.instructions.md` → `mac-paint-app-plan.instructions.md.archived`
* `.copilot-tracking/details/2026-02-26/mac-paint-app-details.md` → `mac-paint-app-details.md.archived`
* `.copilot-tracking/plans/logs/2026-02-26/mac-paint-app-log.md` → `mac-paint-app-log.md.archived`

Command:
```bash
cd /Users/allengreaves/projects/agreaves-ms/mac-paint-tool/.copilot-tracking
mv plans/2026-02-26/mac-paint-app-plan.instructions.md plans/2026-02-26/mac-paint-app-plan.instructions.md.archived
mv details/2026-02-26/mac-paint-app-details.md details/2026-02-26/mac-paint-app-details.md.archived
mv plans/logs/2026-02-26/mac-paint-app-log.md plans/logs/2026-02-26/mac-paint-app-log.md.archived
```

Success criteria:
* Original files renamed with `.archived` suffix
* No broken references in new plan files (they should not reference the monolithic files)

Dependencies:
* Phases 1–6 completion (all 18 new files must exist before archiving originals)

### Step 7.2: Validate all cross-references

Check every plan file to verify:
1. `Details:` lines in each plan reference correct line ranges in the corresponding details file
2. Each plan's Dependencies section references its predecessor plan correctly:
   * Plan 01: No predecessor
   * Plan 02: Plan 01 completion
   * Plan 03: Plan 02 completion
   * Plan 04: Plan 03 completion
   * Plan 05: Plan 04 completion
   * Plan 06: Plan 05 completion
3. Each log file references correct DR- and DD- items from the monolithic log
4. Research references point to existing files

Validation approach:
* Open each plan file and verify `Details:` line numbers against the details file
* Verify predecessor references match the dependency graph
* Verify log DR/DD item numbers match the monolithic log source

Success criteria:
* All line references are accurate
* All dependency chains are correct
* All DR/DD items trace back to monolithic log

Dependencies:
* Phases 1–6 completion

### Step 7.3: Validate plan coverage

Verify complete coverage of all 54 monolithic steps:

**Expected mapping:**
| Plan | Steps | Count |
|------|-------|-------|
| 01 | 1.1, 1.2, 1.3, 1.4, 2.1, 2.2 | 6 |
| 02 | 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9 | 7 |
| 03 | 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9 | 9 |
| 04 | 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 | 11 |
| 05 | 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10 | 10 |
| 06 | 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4 | 11 |
| **Total** | | **54** |

Check:
* No step appears in more than one plan
* No step is missing from all plans
* Step counts match: 6 + 7 + 9 + 11 + 10 + 11 = 54

Success criteria:
* All 54 steps accounted for
* No duplicates
* Step counts match research recommendation

Dependencies:
* Phases 1–6 completion

## Dependencies

* Monolithic plan file (source for extraction)
* Monolithic details file (source for extraction)
* Monolithic log file (source for DR/DD items)
* Plan-splitting-strategy research (structure and step mapping)

## Success Criteria

* 18 new files created (6 plans + 6 details + 6 logs)
* All 54 monolithic steps assigned to exactly one plan
* Step counts per plan match: 6, 7, 9, 11, 10, 11
* Monolithic files archived
* Cross-references validated
