<!-- markdownlint-disable-file -->
# Planning Log: Plan 03 — P0 MVP UI, File I/O and Polish

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan. Sourced from monolithic log and plan-splitting analysis.

### Unaddressed Research Items

* DR-10 (RESOLVED): New Document dialog — research identified this feature gap; now implemented as Step 3.6 in this plan
  * Source: mac-paint-app-log.md — DR-10
  * Resolution: Step 3.6 implements NewDocumentDialog.ts with dimension dialog, presets, and unsaved changes prompt

### Plan Deviations from Research

* DD-01 (inherited): Phase structure expanded from 4 research phases to 8 implementation phases — Plan 3 covers the third of 6 split plans, corresponding to the original Phase 3
  * Research recommends: 4 priority tiers
  * Plan implements: 6 split plans following A-prime strategy
  * Rationale: Finer granularity for manageable Task Implementor sessions

## Implementation Paths Considered

### Selected: HTML input type="color" for color picker

* Approach: Use native `<input type="color">` elements for foreground/background color selection
* Rationale: Simple, native macOS integration, consistent with platform conventions, no custom widget needed for P0
* Evidence: mac-paint-app-features-research.md (Lines 237–241)

### IP-01: Custom canvas-based HSV picker

* Approach: Build a custom HSV/HSL color wheel or gradient picker on canvas
* Trade-offs: More control and features (HSV sliders, color history, eyedropper) but significantly more implementation effort
* Rejection rationale: Unnecessary for P0; can be added in a later plan if needed

## Suggested Follow-On Work

Items identified during planning that fall outside current scope.

* WI-01: Sub-manager extraction — Consider extracting ZoomManager and FileManager from PaintEngine.ts during or after this plan (1–2 extra steps) to reduce Plan 4–5 modification pressure on PaintEngine.ts
  * Source: plan-splitting-strategy-research.md Section 8
  * Dependency: Should evaluate before Plan 04 starts
* WI-02: Tool coordinate fix — All existing tools (BrushTool, EraserTool, ShapeTool, FillTool) use inline getCanvasCoords with getBoundingClientRect() without dividing by zoom. At zoom levels ≠ 1.0, tools will draw at incorrect positions. Each tool should delegate to PaintEngine.mapCoordinates() instead of using its own coordinate helper. (high priority)
  * Source: Phase 1, Step 3.4 implementor
  * Dependency: None — can be done independently
* WI-03: Toolbar double-call cleanup — Keyboard shortcut tool selection calls both selectTool(name) and toolbar.selectTool(name), where the latter fires onToolChangeCallback → selectTool again. Harmless but could be cleaned up with a setActive method that updates visual state without callback. (low priority)
  * Source: Phase 1, Step 3.7 implementor
  * Dependency: None

## User Decisions

None pending.
