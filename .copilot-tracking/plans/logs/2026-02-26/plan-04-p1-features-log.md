<!-- markdownlint-disable-file -->
# Planning Log: Plan 04 — P1 Features: Content and Canvas

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan.

### Unaddressed Research Items

* DR-04 (inherited): Pen/Bézier SVG-style path editing deferred
  * Source: mac-paint-app-features-research.md (Lines 565-565) — P3 Feature
  * Reason: High effort; curve tool in Step 5.5 covers basic quadratic/cubic curve needs; full SVG-style path editing is a vector feature requiring a fundamentally different architecture
  * Impact: low

* DR-08 (inherited): Advanced selection features (feather, global mask, add/subtract) deferred
  * Source: mac-paint-app-features-research.md (Lines 227-231) — Features #25, #26, #29
  * Reason: Basic rectangular marquee plus color-tolerance selection (Plan 02) cover core P0/P1 needs; advanced selection modes are P2+ features
  * Impact: low

### Plan Deviations from Research

* DD-02 (inherited): Phases 4 and 5 (P1 features) sequential
  * Research recommends: Sequential P1 delivery
  * Plan implements: Selection/Text/Clipboard (Phase 1) and Canvas/Shapes/Curves (Phase 2) as sequential phases
  * Rationale: Both phases modify PaintEngine.ts — Phase 1 adds selection state and clipboard methods, Phase 2 adds resize/export/drag-drop methods; sequential execution avoids merge conflicts

* DD-03 (inherited): Both phases share PaintEngine.ts modifications — resolved by sequential execution
  * Research recommends: N/A (implementation concern, not a research recommendation)
  * Plan implements: Both phases marked `parallelizable: false` to avoid conflicting edits to PaintEngine.ts
  * Rationale: Simpler than extracting a CanvasManager.ts module; parallelization benefit was marginal for 2 phases; PaintEngine.ts receives 5 additive method groups (selection state, clipboard, resize/crop, export, drag-drop)

## Implementation Paths Considered

### Selected: PaintEngine additive methods — no refactoring of existing code

* Approach: Add new methods to PaintEngine.ts for selection state, clipboard, resize/crop, export formats, and drag-drop — all additive, no changes to existing Phase 1–3 methods
* Rationale: Simplest approach; existing code is stable and tested; additive methods cannot break prior functionality
* Evidence: plan-splitting-strategy-research.md Section 8 — PaintEngine.ts modification analysis

### IP-01: Extract CanvasManager to reduce PaintEngine.ts size

* Approach: Refactor PaintEngine.ts to extract canvas management (resize, crop, export) into a separate CanvasManager.ts
* Trade-offs: Reduces PaintEngine.ts growth, improves separation of concerns, but requires modifying existing code and updating all references
* Rejection rationale: Rejected per DD-03 — sequential execution is simpler; refactoring adds risk to existing stable code; the benefit of reduced file size is outweighed by the cost of restructuring

## Suggested Follow-On Work

Items identified during planning and implementation that fall outside current scope.

* WI-01: Advanced selection modes — add/subtract from selection, feather selection edge, magnetic lasso
  * Source: Research features #25, #26, #29; DR-08
  * Dependency: Step 4.1 (basic marquee selection) must be proven first
  * Priority: medium — extends basic selection into professional-grade tooling

* WI-02: SVG path editing — full vector path tool with nodes, handles, and Bézier curve manipulation
  * Source: Research P3 feature; DR-04
  * Dependency: Would require vector layer concept — significant architecture change beyond bitmap-only canvas
  * Priority: low — niche use case for a bitmap paint application

* WI-03: Undo integration for clipboard/text operations — saveState() before paste, text commit, and selection move
  * Source: Phase 1 implementation (Step 4.1, 4.3, 4.4)
  * Dependency: Steps 4.1, 4.3, 4.4 complete
  * Priority: medium — undo currently only fires on pointerdown, missing clipboard paste and text commit

* WI-04: Zoom-aware overlays — sync selection/text overlay transforms with PaintEngine zoom/pan state
  * Source: Phase 1 implementation (Step 4.1, 4.3)
  * Dependency: Steps 4.1, 4.3 complete
  * Priority: low — overlays display correctly at 1x zoom but not during zoom/pan

* WI-05: cropToSelection keyboard shortcut/menu — wire cropToSelection() to a menu item or shortcut
  * Source: Phase 2 implementation (Step 5.1)
  * Dependency: Step 5.1 complete
  * Priority: low — method exists but has no user-facing trigger

* WI-06: Canvas size status bar sync — update canvasSizeEl after crop and drag-and-drop image load
  * Source: Phase 2 implementation (Steps 5.1, 5.3)
  * Dependency: Steps 5.1, 5.3 complete
  * Priority: low — cosmetic issue only

## User Decisions

* None recorded — no user decisions required for this plan
