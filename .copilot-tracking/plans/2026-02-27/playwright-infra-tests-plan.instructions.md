<!-- markdownlint-disable-file -->

# Implementation Plan: Playwright Infrastructure & Test Refactoring

## Overview

### User Requirements
1. Install Playwright npm packages and create project config
2. Delete `playwright-features.instructions.md` since the skill now covers it
3. Create a common C# helper library for Playwright tests with real UI interactions (clicks, typing, drawing)

### Derived Objectives
- Eliminate code duplication across 3 test files (5 methods duplicated identically)
- Provide reusable UI interaction helpers that go through the real app pipeline
- Keep existing artistic drawing tests working (they validate canvas rendering)
- Ensure `dotnet build` still passes

## Context Summary

- Research: `.copilot-tracking/research/2026-02-27/playwright-infra-tests-research.md`
- Codebase conventions: `.github/copilot-instructions.md`
- C# test conventions: hve-core C# and C# test instructions

## Implementation Checklist

### Phase 1: Playwright npm Setup <!-- parallelizable: true -->
- [ ] Install `@playwright/test` as devDependency
- [ ] Create `playwright.config.ts` at project root

### Phase 2: Delete Redundant Instructions <!-- parallelizable: true -->
- [ ] Delete `.github/instructions/playwright-features.instructions.md`
- [ ] Update `.github/copilot-instructions.md` to remove references to the deleted file (if any direct references exist)

### Phase 3: Create MacPaintTestBase <!-- parallelizable: false -->
- [ ] Create `tests/playwright/MacPaintTool.Tests/MacPaintTestBase.cs`
  - Shared constants (AppUrl, viewport dimensions)
  - ContextOptions() override
  - NavigateToApp() — navigation + title assertion
  - SaveCanvasToFile() — PNG export via toDataURL
  - SaveCanvasAsSvg() — SVG export
  - GetOutputDirectory() / FindProjectRoot() — path resolution
  - AssertFileExistsAndNotEmpty() — output validation
  - SelectToolAsync() — click toolbar button by data-tool attribute
  - DrawLineAsync() — dispatch pointer events for line stroke on canvas
  - DrawPathAsync() — multi-point path drawing
  - SetSliderValueAsync() — adjust property panel sliders
  - GetCanvasPixelColorAsync() — read pixel RGBA from canvas
  - AssertCanvasNotBlankAsync() — verify canvas has drawn pixels
  - ClickCanvasAtAsync() — single point click on canvas
  - SetForegroundColorAsync() — change foreground color input
  - DispatchPointerEventAsync() — low-level pointer event dispatch helper

### Phase 4: Refactor Existing Tests <!-- parallelizable: false -->
- [ ] Refactor `DrawingRegressionTests.cs` — extend `MacPaintTestBase`, remove duplicated methods, use base helpers
- [ ] Refactor `HouseDrawingRegressionTests.cs` — extend `MacPaintTestBase`, remove duplicated methods, use base helpers
- [ ] Refactor `PencilDrawingRegressionTests.cs` — extend `MacPaintTestBase`, remove duplicated methods, use base helpers with real UI interaction pattern

### Phase 5: Build Verification <!-- parallelizable: false -->
- [ ] Run `dotnet build` to verify compilation

## Dependencies

- Phase 1 and Phase 2 can run in parallel
- Phase 3 depends on research completion (already done)
- Phase 4 depends on Phase 3 (needs MacPaintTestBase to exist)
- Phase 5 depends on Phase 4

## Success Criteria

- [x] `@playwright/test` in `devDependencies`
- [x] `playwright.config.ts` exists with correct port/viewport config
- [x] `playwright-features.instructions.md` deleted
- [x] `MacPaintTestBase.cs` has all shared + UI interaction methods
- [x] All 3 test files extend `MacPaintTestBase`
- [x] No duplicated utility methods across test files
- [x] `dotnet build` passes
