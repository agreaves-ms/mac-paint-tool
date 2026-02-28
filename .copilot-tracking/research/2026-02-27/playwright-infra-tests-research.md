<!-- markdownlint-disable-file -->

# Playwright Infrastructure & Test Refactoring Research

## Scope

Three tasks:
1. Install Playwright npm packages and create `playwright.config.ts`
2. Delete redundant `playwright-features.instructions.md` (replaced by skill)
3. Create a common C# Playwright helper library; refactor tests to use real UI interactions

## Current State

### No Playwright npm packages
- `package.json` has no Playwright packages in `dependencies` or `devDependencies`
- Only .NET `Microsoft.Playwright.Xunit 1.58.0` in `MacPaintTool.Tests.csproj`
- Tests run via `dotnet test` not `npx playwright test`

### Redundant instructions file
- `.github/instructions/playwright-features.instructions.md` — 700+ lines
- Content now covered by `.github/skills/playwright-automation/` (17 files)
- Safe to delete

### Test Analysis — Common Patterns (Duplicated 3x)
All three test classes extend `PageTest` and duplicate:
- `ContextOptions()` — viewport 1400×1100
- `SaveCanvasToFile()` — extract canvas toDataURL, base64 decode, write to disk
- `SaveCanvasAsSvg()` — (HouseDrawingRegressionTests only)
- `GetOutputDirectory()` — resolve `tests/playwright/output` path
- `FindProjectRoot()` — walk up directory tree for `package.json`
- `AppUrl = "http://localhost:5174"` constant
- Navigation + title assertion pattern

### Test Analysis — UI Bypass Problem
- `DrawingRegressionTests.cs`: ALL drawing via `Page.EvaluateAsync` — directly calls Canvas 2D API (gradients, fillRect, arc, etc.). Never clicks toolbar, never uses pointer events. Tests canvas rendering, not the app.
- `HouseDrawingRegressionTests.cs`: Same pattern — ALL drawing via `Page.EvaluateAsync`. Zero UI interaction.
- `PencilDrawingRegressionTests.cs`: PARTIAL real interaction:
  - ✅ Clicks "Pencil" preset button via `Page.GetByRole(AriaRole.Button, new() { Name = "Pencil" })`
  - ✅ Dispatches PointerEvents to canvas via `EvaluateAsync` but creates proper PointerEvent objects with clientX/clientY, pressure, button
  - The pointer event dispatch is the RIGHT pattern — it goes through the real PaintEngine pipeline

### App UI Elements for Real Interactions
15 tool buttons: brush, eraser, fill, gradient, selection, marquee, lasso, eyedropper, text, line, rectangle, ellipse, roundedRect, polygon, curve

Property panel controls:
- Size slider (STROKE_TOOLS)
- Opacity slider (BRUSH_TOOLS)
- Hardness slider (BRUSH_TOOLS)
- Tolerance slider (fill tool)
- Shape mode buttons (SHAPE_TOOLS)
- Font family, font size, bold, italic (text tool)
- Corner radius slider (roundedRect)
- Gradient mode (gradient tool)
- Brush presets section (brush tool)
- Symmetry controls

Color panel with foreground/background colors

### Pointer Event Dispatch Pattern (from PencilDrawingRegressionTests)
The correct pattern for dispatching drawing events:
```javascript
const canvas = document.getElementById('paint-canvas');
const rect = canvas.getBoundingClientRect();
function pointerEvent(type, canvasX, canvasY) {
    const clientX = rect.left + (canvasX * rect.width / canvas.width);
    const clientY = rect.top + (canvasY * rect.height / canvas.height);
    canvas.dispatchEvent(new PointerEvent(type, {
        clientX, clientY, bubbles: true, pointerId: 1,
        pointerType: 'mouse', pressure: type === 'pointerup' ? 0 : 0.5,
        button: 0, buttons: type === 'pointerup' ? 0 : 1,
    }));
}
```

## Recommended Helper Library Design

### `MacPaintTestBase.cs` — Base class extending `PageTest`

Methods to extract:
1. `ContextOptions()` — shared viewport config
2. `NavigateToApp()` — navigation + title assertion
3. `SaveCanvasToFile(string outputPath)` — PNG export
4. `SaveCanvasAsSvg(string outputPath)` — SVG export
5. `GetOutputDirectory()` — output path resolution
6. `FindProjectRoot()` — project root detection
7. `AssertFileExistsAndNotEmpty(string path, long minBytes)` — output validation

New UI interaction helpers:
8. `SelectToolAsync(string toolName)` — clicks toolbar button by `data-tool` attribute
9. `DrawLineAsync(int x1, int y1, int x2, int y2, int steps)` — dispatch pointer events for a line stroke
10. `DrawPathAsync(IEnumerable<(int x, int y)> points)` — multi-point path
11. `SetSliderValueAsync(string label, int value)` — property panel slider interaction
12. `GetCanvasPixelColorAsync(int x, int y)` — read pixel RGBA at coordinates
13. `AssertCanvasNotBlank()` — verify canvas has non-white/non-transparent pixels
14. `ClickCanvasAtAsync(int x, int y)` — single click on canvas at coordinates
15. `SetForegroundColorAsync(string hexColor)` — change foreground color

## Selected Approach

1. Install `@playwright/test` as devDependency (for potential future TS tests; also installs browsers)
2. Create `playwright.config.ts` based on skill template
3. Delete `.github/instructions/playwright-features.instructions.md`
4. Create `MacPaintTestBase.cs` with all shared methods + new UI interaction helpers
5. Refactor existing test files to extend `MacPaintTestBase`
6. Keep the artistic `EvaluateAsync` drawing tests as-is (they test canvas output) but update them to use base class utilities
7. The PencilDrawingRegressionTests already uses real interactions — ensure new base class supports its pattern

## Success Criteria

- `npm install` succeeds with Playwright packages
- `playwright.config.ts` exists and references port 5174
- `playwright-features.instructions.md` deleted
- `MacPaintTestBase.cs` contains all shared + new UI helpers
- All 3 test files use `MacPaintTestBase` instead of duplicated code
- `dotnet build` passes for test project
- Tests use real UI interactions via base class helpers (SelectToolAsync, DrawLineAsync, etc.)
