---
applyTo: '.copilot-tracking/changes/2026-02-26/plan-01-foundation-changes.md'
---
<!-- markdownlint-disable-file -->
# Implementation Plan: Plan 01 — Foundation and Canvas Engine

## Overview

Bootstrap Electron + Vite + TypeScript project, configure the project scaffold with canvas layout, and initialize the PaintEngine and Tool interface that all subsequent plans build upon.

## Objectives

### User Requirements

* Paint Bucket (flood fill) with tolerance slider as a core drawing tool — Source: User specification (research scope)
* Color-tolerance selection tool with gradiance slider — Source: User specification (research scope)
* Line size slider on ALL drawing/stroke tools — Source: User specification (research scope)
* Simple but powerful paint app (Paint.NET sweet spot between MS Paint and Krita) — Source: User specification (research scope)
* Runs locally on Mac, no publishing/cloud — Source: User specification (research scope)
* Cross-platform preferred (macOS primary, Windows/Linux bonus) — Source: User specification (research scope)

### Derived Objectives

* Use Electron + Vite + TypeScript scaffold — Derived from: Framework comparison in research showing Electron + Canvas provides best pixel manipulation performance (~15ms flood fill), trivial UI widgets, and cross-platform support
* Implement PaintEngine with pointer events handling — Derived from: Research recommending PointerEvent over MouseEvent for future pressure sensitivity support
* Establish Tool interface with lineWidth property from shared slider — Derived from: Research core requirement that all stroke tools share a line size slider
* Establish the platform and architecture all subsequent plans build on — Derived from: Plan splitting strategy identifying Plan 01 as the foundation with zero predecessor dependencies

## Context Summary

### Project Files

* `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md` — Primary research: 170+ features, framework comparison, P0–P3 ranking, tech stack recommendation
* `.copilot-tracking/research/subagents/2026-02-26/cross-platform-framework-research.md` — Electron vs Tauri vs Python comparison
* `.copilot-tracking/research/subagents/2026-02-26/html5-canvas-patterns-research.md` — Canvas initialization, coordinate mapping, drawing patterns
* `.copilot-tracking/research/subagents/2026-02-26/mac-tech-stack-research.md` — Apple frameworks, architecture, drawing APIs

### References

* [Electron Forge](https://electronforge.io/) — Electron build toolkit with Vite + TypeScript template
* [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — HTML5 Canvas reference
* [MDN: PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent) — Pointer events reference

### Standards References

* Electron Forge Vite TypeScript template conventions
* HTML5 Canvas 2D API standard patterns

## Implementation Checklist

### [x] Implementation Phase 1: Project Scaffold & Electron Shell

<!-- parallelizable: false -->

* [x] Step 1.1: Bootstrap Electron + Vite + TypeScript project using `npm init electron-app@latest`
  * Details: .copilot-tracking/details/2026-02-26/plan-01-foundation-details.md (Lines 12-45)
* [x] Step 1.2: Configure project structure — `src/main.ts`, `src/preload.ts`, `src/renderer/`
  * Details: .copilot-tracking/details/2026-02-26/plan-01-foundation-details.md (Lines 47-96)
* [x] Step 1.3: Set up main HTML layout with canvas container, toolbar sidebar, and property panel
  * Details: .copilot-tracking/details/2026-02-26/plan-01-foundation-details.md (Lines 98-131)
* [x] Step 1.4: Validate scaffold — `npm start` launches Electron window with canvas visible
  * Details: .copilot-tracking/details/2026-02-26/plan-01-foundation-details.md (Lines 133-148)

### [x] Implementation Phase 2: Core Canvas Engine

<!-- parallelizable: false -->

* [x] Step 2.1: Implement `PaintEngine.ts` — canvas initialization, coordinate mapping, rendering loop
  * Details: .copilot-tracking/details/2026-02-26/plan-01-foundation-details.md (Lines 154-250)
* [x] Step 2.2: Implement tool abstraction (`Tool` interface) with `lineWidth` property from shared slider
  * Details: .copilot-tracking/details/2026-02-26/plan-01-foundation-details.md (Lines 252-310)

## Planning Log

See [plan-01-foundation-log.md](../logs/2026-02-26/plan-01-foundation-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* Node.js 18+ installed
* npm available
* Electron Forge CLI (installed via `npm init electron-app@latest`)
* No predecessor plan — this is the first plan in the dependency chain

## Success Criteria

* Electron window launches with `npm start` — Traces to: User requirement (runs locally on Mac)
* Canvas element visible and fills the center area — Traces to: Derived objective (establish platform)
* Canvas responds to pointer events via PaintEngine — Traces to: Derived objective (PaintEngine with pointer events)
* Tool interface defined with `lineWidth` property — Traces to: User requirement (line size slider on all tools)
* Shared types defined: `ToolType` enum, `Point`, `Color` — Traces to: Derived objective (TypeScript throughout)
* `npx tsc --noEmit` passes with no errors — Traces to: Derived objective (TypeScript compiles)
* `npm start` launches Electron app successfully — Traces to: User requirement (runs locally)
