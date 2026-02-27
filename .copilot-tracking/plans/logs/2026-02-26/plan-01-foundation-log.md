<!-- markdownlint-disable-file -->
# Planning Log: Plan 01 — Foundation and Canvas Engine

**Related Plan**: [plan-01-foundation.instructions.md](../../2026-02-26/plan-01-foundation.instructions.md)

## Discrepancy Log

### Unaddressed Research Items

* None specific to Plan 01 — all Plan 01 steps implement research recommendations directly

### Implementation Deviations

* DD-01 (inherited): Phase structure expanded from 4 research phases to 8 implementation phases
  * Research recommends: 4 phases (MVP, Expected, Powerful, Advanced)
  * Plan implements: 8 phases split across 6 plans; Plan 01 covers the first 1.5 of the 8 phases (Scaffold + PaintEngine/Tool interface from Core Engine)
  * Rationale: Finer-grained phases improve implementability — scaffold must complete before engine code

## Implementation Paths Considered

### Selected: Electron + HTML5 Canvas 2D + TypeScript

* Approach: Electron Forge + Vite scaffold with TypeScript, HTML5 Canvas 2D API for drawing engine, raw `Uint8ClampedArray` for pixel manipulation, HTML/CSS for UI widgets
* Rationale: Best pixel manipulation performance (~15ms flood fill), trivial UI (sliders/pickers are single HTML elements), cross-platform, proven at scale (VS Code, Figma), fully local
* Evidence: mac-paint-app-features-research.md (Lines 89-115), cross-platform-framework-research.md

### IP-01: Tauri + HTML5 Canvas (Rust backend)

* Approach: Same Canvas drawing engine but with Tauri instead of Electron — Rust backend, system webview
* Trade-offs: ~600KB bundle vs ~150MB (Electron), but requires Rust toolchain (~1GB install + compile times), potential webview inconsistencies across platforms, smaller ecosystem
* Rejection rationale: Bundle size doesn't matter for local-only use; Rust toolchain complexity adds friction; same Canvas capabilities means no drawing performance advantage

### IP-02: Python + PyQt6/PySide6

* Approach: Qt widget toolkit via Python bindings, QPainter for drawing
* Trade-offs: Excellent widget toolkit with native look, but Python pixel operations 10–100x slower without numpy; Qt learning curve
* Rejection rationale: Core requirement is pixel manipulation (flood fill, color-tolerance selection) — Python is fundamentally slower for these operations

## Suggested Follow-On Work

* WI-01: DrawingContext abstraction — Consider implementing a DrawingContext wrapper in Step 2.1 per research Section 8 mitigation, to ease layer integration in Plan 05 (Layers and Power Features). This wrapper would sit between PaintEngine and the raw CanvasRenderingContext2D, making it simpler to redirect draw calls to per-layer canvases later. Priority: high.

## User Decisions

<!-- No user decisions recorded for this plan -->
