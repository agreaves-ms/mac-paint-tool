# Mac Paint Tool — Test Infrastructure Research

## Research Status: Complete

## 1. Package.json Analysis

### Dependencies Relevant to Testing

- **No Playwright npm packages** in either `dependencies` or `devDependencies`
- Testing uses C#/.NET Playwright, not the Node.js Playwright package
- **Vite** (`^5.4.21`) is used as standalone dev server for testing

### Scripts

| Script | Command | Notes |
|---|---|---|
| `start` | `electron-forge start` | Electron dev (NOT usable by Playwright) |
| `slow-test` | Kills port 5174, starts Vite on 5174, runs `dotnet test`, kills Vite | Full integration test runner |
| `package` | `electron-forge package` | Build distributable |
| `make` | `electron-forge make` | Build installer |

### Key Script Detail — `slow-test`

```bash
lsof -ti :5174 | xargs kill -9 2>/dev/null;
npx vite --config vite.renderer.config.ts --port 5174 --strictPort &
VITE_PID=$!;
sleep 2 && dotnet test tests/playwright/MacPaintTool.Tests;
TEST_EXIT=$?;
kill $VITE_PID 2>/dev/null;
exit $TEST_EXIT
```

### Node Version

- No explicit Node version requirement in package.json
- Uses Electron 40.6.1

---

## 2. C# Test Files — Complete Analysis

### 2a. DrawingRegressionTests.cs (~635 lines)

**Location:** `tests/playwright/MacPaintTool.Tests/DrawingRegressionTests.cs`

**What it tests:** Complex canvas scene drawing (sunset cityscape with neural network overlays) and PNG output capture.

**Test methods:**

- `WhenDrawingCompleted_CaptureCanvas_ProducesExpectedImage` — Single fact test

**Interaction pattern: FULL UI BYPASS via `EvaluateAsync`**

- Does NOT click any toolbar buttons
- Does NOT use pointer events
- Directly calls Canvas 2D API via `Page.EvaluateAsync()` with inline JavaScript
- Gets canvas via `document.getElementById('paint-canvas')`
- Uses `getContext('2d', { willReadFrequently: true })` pattern

**Drawing methods (all use EvaluateAsync with raw Canvas 2D API):**

- `DrawSkyAndStars()` — Gradient sky, seeded random stars with glow effects
- `DrawSunAndWater()` — Sun disc/glow, water reflections with ripples
- `DrawCityScapeSilhouette()` — Building silhouettes with lit windows, antenna spires
- `DrawNeuralNetworkOverlay()` — Neural network nodes with connections, two clusters
- `DrawTitleAndDetails()` — Title text, data stream particles, thought bubbles, shooting star, crescent moon

**Helper methods:**

- `SaveCanvasToFile(string outputPath)` — Extracts canvas via `toDataURL('image/png')`, base64 decodes, writes to disk
- `GetOutputDirectory()` — Returns `{projectRoot}/tests/playwright/output/`
- `FindProjectRoot()` — Walks up from `AppContext.BaseDirectory` looking for `package.json`

**Constants:**

- `AppUrl = "http://localhost:5174"`
- `OutputFileName = "what-i-think-about.png"`

**Determinism:** Uses seeded pseudo-random number generators in JavaScript for reproducible output.

---

### 2b. HouseDrawingRegressionTests.cs (~580 lines)

**Location:** `tests/playwright/MacPaintTool.Tests/HouseDrawingRegressionTests.cs`

**What it tests:** Complex house scene drawing with PNG and SVG output capture.

**Test methods:**

- `WhenHouseDrawn_CaptureCanvas_ProducesExpectedPng` — Draws then saves PNG
- `WhenHouseDrawn_ExportAsSvg_ProducesValidSvg` — Draws then saves SVG with content assertions

**Interaction pattern: FULL UI BYPASS via `EvaluateAsync`**

- Same pattern as DrawingRegressionTests — no UI interaction, direct canvas API
- ALL drawing done through `Page.EvaluateAsync()` with inline JS

**Drawing methods (all EvaluateAsync):**

- `DrawSkyAndGround()` — Sky gradient, sun with rays, clouds, grass, walkway
- `DrawHouseBody()` — Main rectangle wall
- `DrawRoofAndChimney()` — Triangular roof with shingle lines, chimney, smoke, attic window
- `DrawDoorAndWindows()` — Door with knob/panel, two windows with crosshair panes
- `DrawGardenAndTrees()` — Flowers, two trees, grass tufts
- `DrawFenceAndDetails()` — White fence, mailbox, title text, signature

**Helper methods:**

- `SaveCanvasToFile(string outputPath)` — IDENTICAL to DrawingRegressionTests
- `SaveCanvasAsSvg(string outputPath)` — Generates SVG wrapping canvas as embedded PNG
- `GetOutputDirectory()` — IDENTICAL to DrawingRegressionTests
- `FindProjectRoot()` — IDENTICAL to DrawingRegressionTests

**Constants:**

- `AppUrl = "http://localhost:5174"`
- `PngOutputFileName = "house-drawing.png"`
- `SvgOutputFileName = "house-drawing.svg"`

**SVG assertion checks:**

- `<svg` present
- `xmlns="http://www.w3.org/2000/svg"` present
- `<image` present
- File size > 10,000 bytes

---

### 2c. PencilDrawingRegressionTests.cs (~217 lines)

**Location:** `tests/playwright/MacPaintTool.Tests/PencilDrawingRegressionTests.cs`

**What it tests:** Drawing with the Pencil preset using REAL pointer events dispatched to the canvas.

**Test methods:**

- `WhenPencilDrawingCompleted_CaptureCanvas_ProducesExpectedImage` — Single fact test

**Interaction pattern: MIXED — Real UI clicks + Simulated pointer events**

- **Uses real Playwright UI interaction** to select the Pencil preset:

  ```csharp
  await Page.GetByRole(AriaRole.Button, new() { Name = "Pencil" }).ClickAsync();
  ```

- **Verifies UI state** via assertion:

  ```csharp
  var sizeSlider = Page.GetByRole(AriaRole.Slider).First;
  await Expect(sizeSlider).ToHaveValueAsync("1");
  ```

- **Uses simulated PointerEvents** via `EvaluateAsync` for drawing:
  - Dispatches `pointerdown`, `pointermove`, `pointerup` events to the canvas
  - Each event includes `clientX`, `clientY`, `pressure`, `pointerId`, `pointerType`
  - Uses a `drawLine(x1, y1, x2, y2, steps)` helper function inside JS

**Drawing content:**

- Ground line, house body (rectangle), roof (triangle)
- Door with knob, left/right windows with cross panes
- Chimney with smoke, tree trunk and canopy (triangles)
- Sun circle (drawn as arc segments), sun rays, path from door, fence posts and rail

**Helper methods:**

- `SaveCanvasToFile(string outputPath)` — IDENTICAL to DrawingRegressionTests
- `GetOutputDirectory()` — IDENTICAL to DrawingRegressionTests
- `FindProjectRoot()` — IDENTICAL to DrawingRegressionTests

**Constants:**

- `AppUrl = "http://localhost:5174"`
- `OutputFileName = "pencil-drawing.png"`

---

## 3. C# Project File (csproj)

**Target framework:** `net10.0`
**Nullable:** enabled
**Implicit usings:** enabled

### NuGet Package References

| Package | Version | Purpose |
|---|---|---|
| `coverlet.collector` | 6.0.4 | Code coverage |
| `Microsoft.NET.Test.Sdk` | 17.14.1 | Test SDK |
| `Microsoft.Playwright.Xunit` | 1.58.0 | Playwright + xUnit integration |
| `xunit` | 2.9.3 | Test framework |
| `xunit.runner.visualstudio` | 3.1.4 | VS test runner |

**Key:** Uses `Microsoft.Playwright.Xunit` which provides `PageTest` base class with automatic browser lifecycle management.

---

## 4. App UI Structure

### HTML DOM (index.html)

```
body
  #app
    #toolbar         ← Left panel (48px wide)
    #canvas-container
      #paint-canvas  ← Main drawing canvas
    #property-panel  ← Right panel (200px wide)
    #color-panel     ← Color picker area
    #status-bar
      #cursor-pos    (e.g., "0, 0")
      #zoom-level    (e.g., "100%")
      #canvas-size   (e.g., "1024 × 768")
```

### Toolbar Buttons (Toolbar.ts)

15 tools with names, icons, and keyboard shortcuts:

| Name | Shortcut | Icon |
|---|---|---|
| brush | B | Pencil path |
| eraser | E | Eraser path |
| fill | G | Bucket path |
| gradient | D | Gradient rect |
| selection | W | Target/crosshair |
| marquee | M | Dashed rectangle |
| lasso | A | Lasso path |
| eyedropper | I | Dropper path |
| text | T | Text T |
| line | L | Line with dots |
| rectangle | R | Rectangle |
| ellipse | O | Ellipse |
| roundedRect | U | Rounded rectangle |
| polygon | P | Pentagon |
| curve | C | Bezier curve |

**Button attributes:**

- `data-tool="{name}"` on each button
- `title="{DisplayName} ({Shortcut})"`
- Each has shortcut badge span (`shortcut-indicator`) and hover label (`tool-name-label`)

**Selection:** Uses `pointerdown` event to select tools.

### Property Panel (PropertyPanel.ts)

**Sections (visibility depends on active tool):**

- **Size** — Slider (1-100), for STROKE_TOOLS: brush, eraser, line, rectangle, ellipse, roundedRect, polygon, curve
- **Opacity** — Slider (0-100%), BRUSH_TOOLS only
- **Hardness** — Slider (0-100%), BRUSH_TOOLS only
- **Presets** — Buttons for brush presets (from BRUSH_PRESETS), BRUSH_TOOLS only
- **Tolerance** — Slider (0-255), fill tool
- **Gradiance** — Slider (0-255), selection tool
- **Shape Mode** — Buttons: Stroke/Fill/Both, SHAPE_TOOLS
- **Text** — Font dropdown, size input, Bold/Italic toggles, TEXT_TOOLS
- **Corner Radius** — Slider (0-50), roundedRect only
- **Curve Type** — Buttons: Quadratic/Cubic, curve tool
- **Gradient Mode** — Buttons: Linear/Radial, gradient tool
- **Symmetry** — Toggle + axis type (Mirror H/V/Rotational) + axis count slider, brush only
- **Export Quality** — Slider for export

### App Initialization (app.ts)

- Creates PaintEngine with canvas 1024×768
- Initializes white background
- Creates LayerManager + all tool instances
- Creates UndoManager (saves state on every `pointerdown`)
- Wires color picker to update tool colors
- Wires toolbar to `selectTool()` function
- Keyboard shortcuts for tools + meta-key combos for undo/redo/save/copy/paste
- Electron IPC wiring for menu events (conditionally via `window.electronAPI?.`)

---

## 5. Playwright Instructions File

**Exact path:** `.github/instructions/playwright-features.instructions.md`

**Full path:** `/Users/allengreaves/projects/agreaves-ms/mac-paint-tool/.github/instructions/playwright-features.instructions.md`

---

## 6. Tool Interface (Tool.ts)

```typescript
export interface Tool {
  name: string;
  cursor: string;
  lineWidth: number;
  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void;
  onActivate?(): void;
  onDeactivate?(): void;
}
```

---

## 7. Duplicated Code Patterns Across Test Files

### Exact Duplications (copy-paste identical across ALL 3 test files)

| Method/Pattern | DrawingRegression | HouseDrawing | PencilDrawing |
|---|---|---|---|
| `SaveCanvasToFile()` | ✅ | ✅ | ✅ |
| `GetOutputDirectory()` | ✅ | ✅ | ✅ |
| `FindProjectRoot()` | ✅ | ✅ | ✅ |
| `ContextOptions()` (1400×1100) | ✅ | ✅ | ✅ |
| `AppUrl` constant | ✅ | ✅ | ✅ |
| Page navigation + title check | ✅ | ✅ | ✅ |
| PNG file existence + size assertions | ✅ | ✅ | ✅ |

### Additional Only in HouseDrawingRegressionTests

- `SaveCanvasAsSvg()` — SVG export with embedded PNG image

### Additional Only in PencilDrawingRegressionTests

- `SelectPencilPreset()` — Real UI interaction to click preset button
- `pointerEvent()` JS helper function for dispatching PointerEvents
- `drawLine()` JS helper function for drawing line strokes via pointer events

---

## 8. Recommendations for Shared C# Helper Library

### Recommended Class: `MacPaintTestBase : PageTest`

A base class extending `PageTest` that all test classes inherit from.

#### Should contain

1. **Constants:**
   - `AppUrl = "http://localhost:5174"`
   - Default viewport size (1400×1100)

2. **`ContextOptions()` override** — Standard 1400×1100 viewport

3. **Navigation helpers:**
   - `NavigateToApp()` — `Page.GotoAsync(AppUrl, ...)` + title assertion

4. **Canvas output helpers:**
   - `SaveCanvasToFile(string outputPath)` — Extract canvas as PNG to disk
   - `SaveCanvasAsSvg(string outputPath)` — Extract canvas as SVG to disk
   - `GetOutputDirectory()` — Resolve output path
   - `FindProjectRoot()` — Walk up to find package.json

5. **Assertion helpers:**
   - `AssertFileExistsAndNotEmpty(string path, int minBytes = 10_000)` — File existence + size check

6. **Canvas interaction helpers:**
   - `EvaluateCanvasAsync(string jsBody)` — Wrapper that injects standard canvas+ctx setup boilerplate
   - `GetCanvasContext()` — Returns JS snippet to get canvas and 2D context

7. **Pointer event helpers (from PencilDrawingRegressionTests):**
   - `DispatchPointerEvent(string type, double canvasX, double canvasY)` — Dispatch pointer event to canvas
   - `DrawLineViaPointer(double x1, double y1, double x2, double y2, int steps = 20)` — Draw line via simulated pointer events

8. **UI interaction helpers:**
   - `SelectToolByName(string toolName)` — Click toolbar button by tool name
   - `SelectPreset(string presetName)` — Click a brush preset button
   - `SetSliderValue(string sliderId, int value)` — Set a property panel slider

### Recommended File Structure

```
tests/playwright/MacPaintTool.Tests/
  Helpers/
    MacPaintTestBase.cs      ← Base class with all shared methods
  DrawingRegressionTests.cs  ← Extends MacPaintTestBase
  HouseDrawingRegressionTests.cs  ← Extends MacPaintTestBase
  PencilDrawingRegressionTests.cs ← Extends MacPaintTestBase
```

### Benefits

- **Eliminates ~60 lines of duplicated code** per test file
- **Consistency** — Single source of truth for viewport, URL, output paths
- **Easier maintenance** — Change output format once, affects all tests
- **Enables new test patterns** — UI interaction helpers make it easy to write tests that actually use the toolbar and property panel
- **Testability** — Shared pointer event helpers enable more tests like PencilDrawingRegressionTests that exercise the real tool pipeline

---

## Discovered Research Topics

### Seeded Random Pattern

All three test files (where drawing is done via EvaluateAsync) use the same seeded PRNG pattern:

```javascript
const seededRandom = (function() {
    let seed = 42; // different seeds per section
    return function() {
        seed = (seed * 16807 + 0) % 2147483647;
        return seed / 2147483647;
    };
})();
```

This ensures deterministic output — identical images on every run. This pattern could be standardized in the helper library as a JS snippet constant.

### Test Execution

Tests run via `dotnet test` and require a standalone Vite dev server on port 5174. The `slow-test` npm script automates this. No CI pipeline configuration was found in the researched files.

### Two Interaction Paradigms

1. **Canvas API bypass** (`EvaluateAsync` with raw Canvas 2D) — Used by DrawingRegressionTests and HouseDrawingRegressionTests
2. **Simulated pointer events** (`dispatchEvent(new PointerEvent(...))`) — Used by PencilDrawingRegressionTests

The pointer event approach actually exercises the tool pipeline (BrushTool processes the events), while the Canvas API approach bypasses all application logic. Both are valid but test different things:

- Canvas API bypass: Tests that the canvas rendering infrastructure works
- Pointer events: Tests that the tool pipeline processes input correctly

---

## Clarifying Questions

None — all research questions have been answered through the codebase analysis.
