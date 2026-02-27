<!-- markdownlint-disable-file -->
# Planning Log: Plan 02 — P0 Core Drawing Tools

**Related Plan**: [plan-02-drawing-tools.instructions.md](../../2026-02-26/plan-02-drawing-tools.instructions.md)

## Discrepancy Log

### Unaddressed Research Items

* DR-06 (inherited): Euclidean RGB distance used instead of perceptual weighting — standard and sufficient per research
  * Source: mac-paint-app-features-research.md (Lines 377-380)
  * Reason: Euclidean RGB distance is standard and sufficient; perceptual weighting noted as optional enhancement
  * Impact: low

## Implementation Paths Considered

* Selected: Scanline queue-based flood fill — per research benchmarking (mac-paint-app-features-research.md Lines 343-366)
  * Reason: O(n) time, no stack overflow risk, ~15ms on 1024×768
* IP-01: Recursive flood fill — rejected
  * Reason: Stack overflow risk on large uniform regions; JavaScript call stack limit ~10K–25K frames

## Suggested Follow-On Work

* WI-01: Perceptual color distance — optional upgrade to use CIE ΔE*ab instead of Euclidean RGB for color-tolerance selection and flood fill tolerance
  * Rationale: Euclidean RGB treats all channels equally; perceptual weighting better matches human color perception
  * Priority: Low — current approach is standard and functional
* WI-02: Tool wiring in app.ts — instantiate tools, register keyboard shortcuts (B=brush, E=eraser, G=fill), connect `setActiveTool()` on PaintEngine
  * Source: Phase 1, Step 2.9
  * Dependency: UI plan (Plan 03 or later)
* WI-03: UndoManager integration — PaintEngine or coordinator should invoke `saveState()` in pointerdown handler before dispatching to tools
  * Source: Phase 1, Step 2.8
  * Dependency: Tool wiring (WI-02)
* WI-04: Color binding — BrushTool.color, ShapeTool.color/fillColor, FillTool.fillColor need binding to UI color picker
  * Source: Phase 1, Step 2.3/2.5/2.6
  * Dependency: PropertyPanel/ColorPanel implementation
* WI-05: Canvas scaling — getCanvasCoords uses getBoundingClientRect without CSS-vs-attribute scale factors; needs update when zoom is added
  * Source: Phase 1, all tools
  * Dependency: Zoom/pan implementation
* WI-06: Overlay repositioning — ShapeTool and ColorSelection overlays position once; resize observer needed for container scroll/resize
  * Source: Phase 1, Step 2.5/2.7
  * Dependency: Responsive layout work

## User Decisions

(No user decisions recorded yet.)
