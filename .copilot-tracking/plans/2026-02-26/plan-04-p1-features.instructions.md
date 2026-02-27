---
applyTo: '.copilot-tracking/changes/2026-02-26/plan-04-p1-features-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Plan 04 — P1 Features: Content and Canvas

## Overview

Add P1 features to the Mac Paint application: selection tools (rectangular marquee, eyedropper), text tool, clipboard integration, canvas management (resize/crop, export formats, drag-and-drop), additional shapes (rounded rectangle, polygon), and curve/Bézier tool. This plan extracts monolithic plan Phases 4–5 (Steps 4.1–5.6, 11 steps). PaintEngine.ts is modified 5× — the heaviest modification load across all plans, but all changes are additive new methods.

## Objectives

### User Requirements

* Simple but powerful paint app (Paint.NET sweet spot between MS Paint and Krita) — Source: User specification (research scope)
* Runs locally on Mac, no publishing/cloud — Source: User specification (research scope)

### Derived Objectives

* Complete P1 feature set — selection, text, clipboard, canvas management, shapes, curves — Derived from: Research P1 ranking (expected features users anticipate)
* PaintEngine.ts receives additive methods only — no refactoring of existing Plan 01–03 code — Derived from: DD-03 (sequential execution avoids merge conflicts)
* Both internal phases execute sequentially — Derived from: DD-02 (shared PaintEngine.ts modifications)

## Context Summary

### Project Files

* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — Primary research: 170+ features, P0–P3 ranking
* `.copilot-tracking/research/2026-02-26/plan-splitting-strategy-research.md` — Splitting strategy: A-prime 6-plan breakdown
* `.copilot-tracking/research/subagents/2026-02-26/file-dependency-analysis.md` — 41 files × 8 phases, PaintEngine.ts hot file identification

### References

* [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — HTML5 Canvas reference
* [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) — System clipboard read/write
* [MDN: DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent) — HTML5 drag-and-drop events

### Standards References

* HTML5 Canvas 2D API standard patterns
* Electron IPC bridge conventions (preload.ts contextBridge)

## Implementation Checklist

### [x] Implementation Phase 1: Selection, Text and Clipboard

<!-- parallelizable: false -->

* [x] Step 4.1: Implement rectangular marquee selection — drag to select, move, copy, paste
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 12-49)
* [x] Step 4.2: Implement eyedropper tool — click canvas to sample color, Alt+click from any tool
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 50-75)
* [x] Step 4.3: Implement text tool — ctx.fillText() with font picker, size, and color
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 76-110)
* [x] Step 4.4: Implement clipboard integration — Clipboard API for copy/paste images to/from system
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 111-150)
* [x] Step 4.5: Validate Phase 1 — selections work, text renders, clipboard interop with other apps
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 151-167)

### [x] Implementation Phase 2: Canvas Management and Additional Shapes

<!-- parallelizable: false -->

* [x] Step 5.1: Implement canvas resize/crop — dialog for dimensions, anchor grid, crop to selection
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 172-209)
* [x] Step 5.2: Implement export formats — PNG, JPEG, WebP via canvas.toBlob()
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 210-253)
* [x] Step 5.3: Implement drag-and-drop — HTML5 drag events to open images
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 254-296)
* [x] Step 5.4: Implement additional shapes — rounded rectangle, polygon with line size slider
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 297-330)
* [x] Step 5.5: Implement curve/Bézier tool — quadratic/cubic curves with control points and line size slider
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 331-375)
* [x] Step 5.6: Validate Phase 2 — canvas resize works, all export formats produce valid files, drag-and-drop opens images, shapes and curves draw correctly
  * Details: .copilot-tracking/details/2026-02-26/plan-04-p1-features-details.md (Lines 376-394)

## Planning Log

See [plan-04-p1-features-log.md](../logs/2026-02-26/plan-04-p1-features-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* Plan 03 completion — UI components (Toolbar, PropertyPanel, ColorPicker), file I/O, keyboard shortcuts, and CSS styling must exist
* Plan 02 completion — Tool interface, ShapeTool base class must exist
* Plan 01 completion — PaintEngine.ts canvas initialization, coordinate mapping, and pointer event handling must exist
* Node.js 18+, npm, Electron (inherited from Plan 01)

## Success Criteria

* Rectangular marquee selection allows drag-to-select, move, copy, paste, and delete — Traces to: Research P1 selection tools
* Eyedropper tool samples pixel color on click and supports Alt+click from any tool — Traces to: Research P1 eyedropper
* Text tool renders text to canvas with configurable font, size, and color — Traces to: Research P1 text tool
* Clipboard copy/cut/paste works between canvas and system clipboard — Traces to: Research P1 clipboard operations
* Canvas resize/crop dialog preserves content with anchor positioning — Traces to: Research P1 canvas management
* Export produces valid PNG, JPEG, and WebP files with quality parameter — Traces to: Research P1 export formats
* Drag-and-drop opens image files from Finder onto canvas — Traces to: Research P1 drag-and-drop
* Rounded rectangle and polygon shapes draw correctly with line size slider — Traces to: Research P1 additional shapes
* Curve/Bézier tool draws smooth quadratic and cubic curves with visual control points — Traces to: Research P1 curve tool
* `npx tsc --noEmit` passes with no errors — Traces to: Derived objective (TypeScript throughout)
* `npm start` launches app with all P1 features functional — Traces to: User requirement (local run)
