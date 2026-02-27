<!-- markdownlint-disable-file -->
# Release Changes: Plan 01 — Foundation and Canvas Engine

**Related Plan**: plan-01-foundation.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Bootstrap Electron + Vite + TypeScript project, set up canvas layout, and implement PaintEngine and Tool interface.

## Changes

### Added

* `src/renderer/canvas/PaintEngine.ts` — Core canvas engine class with initialization, coordinate mapping, pointer event dispatch to active tool
* `src/renderer/tools/Tool.ts` — Tool interface definition with lineWidth property for shared slider binding
* `package.json` — Project manifest with Electron Forge scripts, Vite + TypeScript toolchain
* `package-lock.json` — Dependency lock file
* `forge.config.ts` — Electron Forge build configuration with Vite plugin and fuses
* `forge.env.d.ts` — Vite environment type declarations for Electron Forge
* `tsconfig.json` — TypeScript configuration with strict mode enabled
* `vite.main.config.ts` — Vite config for main process
* `vite.renderer.config.ts` — Vite config for renderer process (root set to src/renderer)
* `vite.preload.config.ts` — Vite config for preload script
* `.eslintrc.json` — ESLint configuration
* `src/main.ts` — Electron main process with 1280x800 window, File/Edit/View menus, file I/O IPC handlers
* `src/preload.ts` — Preload script exposing electronAPI via contextBridge (open, save, menu events)
* `src/shared/types.ts` — Shared type definitions (Color, Point, ToolType enum)
* `src/shared/electron-api.d.ts` — TypeScript declarations for window.electronAPI
* `src/renderer/index.html` — Main HTML layout with toolbar, canvas-container, property-panel, color-panel, status-bar
* `src/renderer/app.ts` — App entry point, initializes 1024x768 canvas with willReadFrequently context
* `src/renderer/styles/app.css` — CSS Grid layout with dark/light theme support, checkerboard canvas background

### Modified

* `src/renderer/app.ts` — Replaced direct canvas initialization with PaintEngine instantiation

### Removed

## Additional or Deviating Changes

* TypeScript upgraded from scaffold default ~4.5.4 to ~5.7.0 due to incompatibility with current @types/node
  * Required to resolve type errors in node_modules declarations
* Added `Eyedropper` to ToolType enum beyond Phase 1 scope
  * Required by implementation details Step 2.2 which specifies the full enum

## Release Summary
