<!-- markdownlint-disable-file -->
# Planning Log: Plan 05 — P2 Power: Layers and Effects

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan.

### Unaddressed Research Items

* DR-01 (inherited): Native `.paintdoc` format deferred — layers now exist but format spec would be additional scope
  * Source: mac-paint-app-features-research.md (Lines 307–307)
  * Reason: Deferred to post-Phase 6 — layers are implemented in this plan but the native format preserving layers, selections, and history requires additional specification work
  * Impact: low

* DR-05 (inherited): Non-destructive filter layers deferred — destructive filters in Step 6.5 are sufficient initially
  * Source: mac-paint-app-features-research.md (Lines 563–563)
  * Reason: High architectural complexity — requires filter layer abstraction on top of layer system; destructive pixel manipulation filters are the standard approach for initial implementation
  * Impact: medium

### Plan Deviations from Research

* DD-01 (inherited): Phase structure expanded for finer granularity
  * Research recommends: 4 phases (MVP, Expected, Powerful, Advanced)
  * Plan implements: Monolithic Phase 6 content extracted as a single implementation phase in this focused plan
  * Rationale: Preserves sequential step ordering within the phase while isolating the architecturally disruptive layer system from other plans

## Implementation Paths Considered

### Selected: Multi-canvas layer system (stacked `<canvas>` elements)

* Approach: Each layer is a separate `<canvas>` element with `position: absolute` and `z-index` stacking. LayerManager tracks layers, active layer, and compositing order. PaintEngine routes drawing to active layer's context.
* Rationale: Native browser z-index compositing, each layer has its own independent `CanvasRenderingContext2D`, straightforward add/remove via DOM operations, visibility toggle via CSS display/opacity
* Evidence: html5-canvas-patterns-research.md — Layer implementation patterns

### IP-01: Single canvas with off-screen layer buffers

* Approach: Single visible canvas, each layer stored as an off-screen canvas buffer. Composite all buffers onto the visible canvas after each operation.
* Trade-offs: Simpler DOM (one visible canvas), but requires manual compositing after every drawing operation; no z-index benefit; more complex rendering pipeline
* Rejection rationale: More complex compositing code, no performance advantage for this use case, loses native CSS stacking

### IP-02: OffscreenCanvas + Worker

* Approach: Each layer as an OffscreenCanvas managed in a Web Worker for background compositing
* Trade-offs: Non-blocking compositing, better performance on large canvases
* Rejection rationale: Unnecessary complexity for initial implementation; Worker communication overhead; OffscreenCanvas API has limited browser support for some operations; can be added later as a performance optimization

## Suggested Follow-On Work

Items identified during planning that fall outside current scope.

* WI-01: Native `.paintdoc` format — Custom file format preserving layers, undo history, tool state across save/load
  * Source: Research feature #107, DR-01
  * Dependency: This plan (layer system) must complete first

* WI-02: Non-destructive filter layers — Filter layer abstraction atop layer system, re-applicable and removable filters
  * Source: Research P3 features, DR-05
  * Dependency: This plan (Filters.ts and LayerManager.ts) must complete first

* WI-03: Layer groups/folders — Organize layers hierarchically, collapse/expand groups, group-level visibility and opacity
  * Source: Identified during layer system design
  * Dependency: This plan (LayerManager.ts) must complete first

* WI-04: Layer-aware resize/crop — `resizeCanvas()` and `cropToSelection()` should resize all layer canvases (medium)
  * Source: Phase 1, Step 6.1 implementation
  * Dependency: LayerManager.ts must exist

* WI-05: Lasso clipboard integration — Freeform selection copy/cut/paste requires common selection interface (medium)
  * Source: Phase 1, Step 6.2 implementation
  * Dependency: LassoTool.ts and PaintEngine clipboard methods

* WI-06: Layer opacity slider — Per-layer opacity UI control in LayerPanel (low)
  * Source: Phase 1, Step 6.1 implementation
  * Dependency: LayerPanel.ts, LayerManager already supports setLayerOpacity()

* WI-07: Interactive filter dialogs — Brightness/contrast filters need parameter UI (slider dialog) (low)
  * Source: Phase 1, Step 6.5 implementation
  * Dependency: Filters.ts

* WI-08: Grid resize observer — Grid overlay should respond to window resizes (low)
  * Source: Phase 1, Step 6.9 implementation
  * Dependency: PaintEngine grid overlay

## User Decisions

No user decisions pending.
