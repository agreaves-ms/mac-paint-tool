<!-- markdownlint-disable-file -->

# Follow-Up Work Items After Playwright Automation Skill

## Research Topics

1. Gaps in the playwright-automation skill
2. Current C# test coverage vs app features
3. Missing agent definitions
4. Documentation state
5. Untested features/tools in the renderer
6. Package.json integration gaps
7. Playwright npm dependency status

## Key Discoveries

### 1. Skill Coverage (SKILL.md)

The skill at `.github/skills/playwright-automation/` is **complete** per the review at `.copilot-tracking/reviews/2026-02-27/playwright-skill-review.md`:

- 17 files total: SKILL.md, 7 scripts + shared module, 4 reference docs, 4 templates
- All 18 Playwright feature categories covered
- Review found 0 critical, 0 major issues; 5 minor (all fixed)
- Templates include `playwright.config.ts`, `test-spec.ts`, `page-interaction.ts`, `cli.config.json`

**Gap**: The skill produces TypeScript-based Playwright tests, but the project only has C# tests. No `playwright.config.ts` exists at the project root. No `@playwright/test` in `package.json`.

### 2. Existing C# Test Coverage

Three C# test files exist at `tests/playwright/MacPaintTool.Tests/`:

| File | What It Tests |
| --- | --- |
| `DrawingRegressionTests.cs` | Complex canvas drawing via `Page.EvaluateAsync` (sky, sun, city, neural network overlay) — visual regression screenshot |
| `HouseDrawingRegressionTests.cs` | Canvas drawing via evaluate (house scene) — PNG + SVG export validation |
| `PencilDrawingRegressionTests.cs` | Pencil tool via dispatched `PointerEvent` to canvas — tool selection, pointer-event drawing |

**Gap**: All 3 tests are visual regression tests that draw via `EvaluateAsync` JavaScript. Only `PencilDrawingRegressionTests` actually exercises a tool through pointer events. No tests exist for:

- UI tool selection (toolbar buttons)
- Property panel interactions (sliders, dropdowns)
- Keyboard shortcuts (B, E, G, etc.)
- Undo/redo workflow
- Layer management
- Color picker
- Zoom/pan
- File operations (limited by standalone mode)
- Dark mode toggle
- Most of the 15 drawing tools

### 3. Agent Definitions

- **No `.github/agents/` directory exists**
- **No `*.agent.md` files exist anywhere**
- **No `AGENTS.md` file exists**
- Only one skill exists: `playwright-automation`

**Gap**: The skill has no consuming agent. An agent (e.g., `browser-testing.agent.md`) could orchestrate the skill scripts and provide a higher-level workflow.

### 4. Documentation State

- `docs/` directory does **not exist** (contrary to the user's mention of 9 docs files)
- `.github/instructions/playwright-features.instructions.md` exists (comprehensive reference)
- `.github/instructions/commit-message.instructions.md` exists
- `.github/copilot-instructions.md` exists (project conventions)

The `playwright-features.instructions.md` and the new skill's `REFERENCE.md` cover overlapping content. The instructions file is 700+ lines of raw reference; the skill breaks this into structured scripts + docs.

**Gap**: Redundant content between `playwright-features.instructions.md` and skill references. The instructions file could be slimmed or replaced with a pointer to the skill.

### 5. Untested App Features

The renderer has 11 drawing tools and 8 UI components:

**Drawing Tools** (from `src/renderer/tools/`):

| Tool | Tested? | Notes |
| --- | --- | --- |
| BrushTool | Partial | PencilDrawingRegressionTests uses pencil preset only |
| EraserTool | No | |
| FillTool | No | Flood fill with tolerance |
| ShapeTool | No | 5 shape types: line, rectangle, ellipse, roundedRect, polygon |
| SelectionTool | No | Marquee selection |
| EyedropperTool | No | Color sampling |
| TextTool | No | Font, size, bold, italic |
| CurveTool | No | Multiple curve types |
| LassoTool | No | Freeform selection |
| GradientTool | No | Gradient modes |
| BrushEngine | No | Brush presets |

**UI Components** (from `src/renderer/ui/`):

| Component | Tested? |
| --- | --- |
| Toolbar | No |
| PropertyPanel | No |
| ColorPicker | No |
| LayerPanel | No |
| BrushPresetPanel | No |
| NewDocumentDialog | No |
| ResizeDialog | No |
| CurvesDialog | No |

**Canvas Features** (from `src/renderer/canvas/`):

| Feature | Tested? |
| --- | --- |
| PaintEngine (zoom, pan, grid) | No |
| UndoManager | No |
| LayerManager | No |
| Filters (invert) | No |
| Transform (flip H/V) | No |
| ColorSelection | No |
| Adjustments (curves) | No |
| FloodFill | No |

### 6. Package.json Integration

- **No Playwright npm packages** in `devDependencies` — no `@playwright/test`, `playwright`, or `@playwright/cli`
- Only test script is `slow-test` which runs C# dotnet tests
- No `test` script exists
- No `playwright.config.ts` at project root

**Gap**: The skill templates reference `@playwright/test` but it's not installed. The `Run-Tests.ps1` script would fail with `npx playwright test` since no config or test dir exists.

### 7. Cross-Platform Considerations

- Scripts are PowerShell 7+ (`pwsh`) — works on macOS/Linux/Windows
- `slow-test` npm script uses bash syntax (`lsof`, `xargs`, `$!`, `kill`) — macOS/Linux only
- No Windows-compatible test runner script in package.json

## Candidate Follow-Up Work Items

### Item 1: Add TypeScript Playwright tests for core tools

**Category**: Testing
**Priority**: High
**Description**: Create TypeScript-based Playwright tests (`*.spec.ts`) for the 11 drawing tools, starting with brush, eraser, fill, and shape tools. Use the skill's `test-spec.ts` template and `playwright.config.ts` template. Tests would exercise tool selection via toolbar clicks, property changes, and canvas drawing via pointer events.
**Rationale**: Current C# tests only cover visual regression via `EvaluateAsync`. No tests exercise UI interactions through Playwright's locator API. The new skill produces TypeScript tests but none exist yet.

### Item 2: Install Playwright npm packages and create project config

**Category**: Integration
**Priority**: High
**Description**: Add `@playwright/test` and `playwright` to `devDependencies`, copy `playwright.config.ts` template to project root, create a `tests/` directory for TypeScript specs, and add a `test` npm script. This enables the skill's `Run-Tests.ps1` to function.
**Rationale**: The skill references `npx playwright test` and TypeScript test templates, but no Playwright npm packages or config exist. The skill is currently unusable for TypeScript test execution.

### Item 3: Create a browser-testing agent

**Category**: Feature
**Priority**: Medium
**Description**: Create `.github/agents/browser-testing.agent.md` that orchestrates the playwright-automation skill. The agent would provide a workflow for running tests, capturing screenshots, and validating UI state. It would restrict tools to terminal + file operations and reference the skill for Playwright knowledge.
**Rationale**: No agents exist in the project. An agent consuming the skill would demonstrate the skill's value and provide a higher-level entry point for automated testing workflows.

### Item 4: Slim down `playwright-features.instructions.md`

**Category**: Refactoring
**Priority**: Medium
**Description**: The 700+ line `playwright-features.instructions.md` now overlaps significantly with the skill's `REFERENCE.md`, `CLI-COMMANDS.md`, `API-MAPPING.md`, and `PITFALLS.md`. Replace the instructions file contents with a brief summary and pointer to the skill, or remove it entirely since the skill covers everything.
**Rationale**: Redundant content wastes context tokens when both are loaded. The skill provides better-structured, equivalent information. Instructions should complement skills, not duplicate them.

### Item 5: Add cross-platform test runner to package.json

**Category**: Integration
**Priority**: Medium
**Description**: The current `slow-test` script uses bash-only syntax (`lsof`, `kill`, `$!`). Add a `test` npm script that invokes the skill's `Run-Tests.ps1` or uses `npx playwright test` with the webServer config in `playwright.config.ts` (which handles server startup automatically). This would work cross-platform and be simpler.
**Rationale**: The existing test script only runs C# tests and only works on macOS/Linux. A cross-platform `test` script would improve CI/CD compatibility and developer experience.

### Item 6: Add UI interaction tests (toolbar, property panel, keyboard shortcuts)

**Category**: Testing
**Priority**: Medium
**Description**: Create Playwright tests that verify toolbar tool selection, property panel slider/dropdown changes, keyboard shortcuts (B/E/G/X etc.), undo/redo, color picker interactions, and theme toggle. These tests would use Playwright's role-based locators rather than canvas evaluation.
**Rationale**: Zero UI interaction tests exist. All current tests bypass the UI and draw directly via JavaScript. UI regressions (broken toolbar, shortcuts, property panel) would go undetected.

### Item 7: Add CI pipeline for Playwright tests

**Category**: Integration
**Priority**: Low
**Description**: Create a GitHub Actions workflow (`.github/workflows/playwright.yml`) that installs dependencies, runs `npx playwright install`, starts the Vite dev server, and executes Playwright tests on push/PR. Use the `playwright.config.ts` template's CI-aware settings (retries, single worker, forbidOnly).
**Rationale**: No CI pipeline exists for any tests. Automated test execution on PR would catch regressions before merge. The skill's templates already include CI-aware configuration.

## Clarifying Questions

1. **Were the 9 docs files in `docs/` removed or do they exist elsewhere?** — The user mentioned "previously created documentation exists in `docs/` (9 files)" but `docs/` does not exist. They may have been cleaned up or the path may be different.
2. **Should TypeScript tests replace or supplement C# tests?** — The C# tests work but are verbose. TypeScript tests would be more idiomatic for a TS project and align with the skill output.
3. **Is `@playwright/cli` intended to be used, or is the direct API preferred?** — The skill supports both, but the project currently uses neither. The CLI approach requires global install; the API approach requires `devDependencies`.
