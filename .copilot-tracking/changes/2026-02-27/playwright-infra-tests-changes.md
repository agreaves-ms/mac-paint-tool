<!-- markdownlint-disable-file -->

# Changes Log: Playwright Infrastructure & Test Refactoring

**Plan**: `.copilot-tracking/plans/2026-02-27/playwright-infra-tests-plan.instructions.md`
**Date**: 2026-02-27

## Summary

Installed Playwright npm packages, created project config, deleted redundant instructions file,
created a shared C# test base class with real UI interaction helpers, and refactored all 3 existing
test files to use the shared base class.

## Changes by Category

### Added
- `playwright.config.ts` — Playwright Test config with port 5174, 3 browser projects, Vite webServer
- `tests/playwright/MacPaintTool.Tests/MacPaintTestBase.cs` — Shared base class with:
  - Navigation helpers (NavigateToAppAsync)
  - Tool selection (SelectToolAsync, SelectPresetAsync)
  - Real pointer event drawing (DispatchPointerEventAsync, DrawLineAsync, DrawPathAsync, ClickCanvasAtAsync)
  - Property panel controls (SetSliderValueAsync, SetForegroundColorAsync)
  - Canvas inspection (GetCanvasPixelColorAsync, AssertCanvasNotBlankAsync)
  - File output (SaveCanvasToFileAsync, SaveCanvasAsSvgAsync)
  - Path resolution (GetOutputDirectory, FindProjectRoot)
  - Assertion helpers (AssertFileExistsAndNotEmpty)

### Modified
- `package.json` — Added `@playwright/test` ^1.58.2 to devDependencies
- `DrawingRegressionTests.cs` — Extends MacPaintTestBase, removed 5 duplicated methods
- `HouseDrawingRegressionTests.cs` — Extends MacPaintTestBase, removed 6 duplicated methods
- `PencilDrawingRegressionTests.cs` — Extends MacPaintTestBase, removed 5 duplicated methods, converted JavaScript EvaluateAsync pointer event block to C# DrawLineAsync calls

### Removed
- `.github/instructions/playwright-features.instructions.md` — Redundant with playwright-automation skill

## Release Summary

Playwright npm infrastructure established. All C# tests now share a common base class (`MacPaintTestBase`) that provides real UI interaction helpers for clicking tools, drawing with pointer events, adjusting sliders, and inspecting canvas pixels. The PencilDrawingRegressionTests now uses pure C# DrawLineAsync calls instead of a JavaScript EvaluateAsync block, making it fully testable and debuggable from C#. Build passes with 0 warnings/errors.
