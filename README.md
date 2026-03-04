# Mac Paint Tool

## Overview

A paint application built with Electron, TypeScript, and the HTML5 Canvas 2D API. Despite the name, Mac Paint runs on **macOS, Windows, and Linux**. The "Mac" in the name comes from the fact that macOS doesn't ship with a built-in paint tool, and we wanted to fix that.

Mac Paint delivers a classic drawing experience with modern features: layers, undo/redo, flood fill, gradient tools, lasso and marquee selection, text, shapes, curves, and more. It runs in a lightweight Electron shell with no framework dependencies.

## Built with HVE Core

We built this project using the **Research → Plan → Implement (RPI)** workflow from [HVE Core](https://github.com/microsoft/hve-core). Every feature, from the initial brush engine to the regression test suite, went through structured research, planning, implementation, and review phases. The `.copilot-tracking/` directory in this repo contains the full trail of research documents, plans, change logs, and reviews that shaped this codebase.

---

## Contributing: Fork, Clone, and Get Started

This section walks through the end-to-end workflow for contributing to Mac Paint Tool using HVE Core's AI-assisted development tools.

### 1. Fork the Repository

1. Navigate to the [Mac Paint Tool repository](https://github.com/agreaves-ms/mac-paint-tool) on GitHub.
2. Click the **Fork** button in the upper-right corner.
3. Select your GitHub account as the destination.
4. Leave **Copy the `main` branch only** checked (default).
5. Click **Create fork**.

### 2. Clone Your Fork

```bash
git clone https://github.com/<your-username>/mac-paint-tool.git
cd mac-paint-tool
npm install
```

Add the upstream remote so you can sync changes later:

```bash
git remote add upstream https://github.com/agreaves-ms/mac-paint-tool.git
git fetch upstream
```

### 3. Set Up the GitHub MCP Server

The **GitHub MCP Server** enables Copilot agents to interact with GitHub directly: creating pull requests, managing issues, and more. It ships with the **GitHub Pull Requests** VS Code extension.

1. Install the [GitHub Pull Requests and Issues](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension in VS Code.
2. Sign in to your GitHub account when prompted.
3. The GitHub MCP server is automatically available to Copilot Chat once the extension is active. No additional configuration is needed.

### 4. Install and Use GitHub Backlog Manager

**GitHub Backlog Manager** is part of the [HVE Core - GitHub Backlog Management](https://marketplace.visualstudio.com/items?itemName=ise-hve-essentials.hve-github) VS Code extension. It provides AI-powered agents and prompts for triaging, discovering, and managing GitHub issues.

Install the extension:

1. Open VS Code.
2. Go to the Extensions view (`Cmd+Shift+X` / `Ctrl+Shift+X`).
3. Search for **HVE Core - GitHub Backlog Management**.
4. Click **Install**.

#### 4.1 Assign Yourself to an Issue

1. Open Copilot Chat in Agent mode.
2. Use the GitHub Backlog Manager to browse unassigned issues in the upstream repo:

   ```text
   Find unassigned issues in agreaves-ms/mac-paint-tool that I could work on
   ```

3. Once you find an issue you'd like to tackle, ask Copilot to assign it to you:

   ```text
   Assign me to issue #<number> in agreaves-ms/mac-paint-tool
   ```

#### 4.2 Pull Down Issue Details Locally

Collect the issue details into a local markdown file so HVE Core agents can work with them:

```text
Download the details of issue #<number> from agreaves-ms/mac-paint-tool as a markdown file
```

This creates a markdown file (typically in `.copilot-tracking/`) containing the issue title, description, labels, and any conversation context.

#### 4.3 Create a Feature Branch

Before starting any work, create a branch in your fork for the issue. A good convention is to include the issue number and a short description:

```bash
git checkout -b feature/<issue-number>-short-description
```

For example:

```bash
git checkout -b feature/42-gradient-angle-slider
```

This keeps your `main` branch clean and makes it straightforward to create a pull request back to the upstream repo when you're done.

### 5. Working on Your Assigned Issue with HVE Core

HVE Core offers several approaches for AI-assisted development. Choose the workflow that fits the complexity of your task.

#### 5.1 Step-by-Step Workflow (Recommended for Complex Features)

This approach gives you the most control and produces the best results for larger or more ambiguous features. Use `/clear` between steps to reset context, or use the **Compact** button to compress the conversation history.

> [!NOTE]
> The `/compact` command is currently available in VS Code Insiders (as of March 2026). The next stable release of VS Code will include this feature.

Open the downloaded issue markdown file, then run each phase in sequence:

**Research**

```text
/task-research This feature described in this document
```

This produces a research document in `.copilot-tracking/research/` with scope analysis, evaluated alternatives, and a recommended approach.

**Plan**

Open the research document, then run:

```text
/task-plan Create an implementation plan based on this research
```

This produces an implementation plan in `.copilot-tracking/plans/` with phased steps, dependencies, and success criteria.

**Implement**

Open the plan document, then run:

```text
/task-implement Execute this implementation plan
```

This implements each phase of the plan, updates tracking artifacts, and marks completed steps.

**Review**

After implementation is complete, run:

```text
/task-review Validate the implementation against the plan
```

This runs validation checks, captures findings, and determines if the implementation is complete or needs iteration.

> [!TIP]
> If the review identifies issues, it will guide you back to the appropriate phase. Use `/clear` or **Compact** between iterations to keep context manageable.

#### 5.2 Try Undoing the Work

If you'd like to start over or try a different approach, you can undo the implementation. Use Git to reset your changes:

```bash
git stash
# or
git checkout -- .
```

This gives you a clean slate to try the next approach.

#### 5.3 Full RPI Flow (Best for Well-Defined Features)

For features that are clearly scoped and well-defined, you can run the entire Research → Plan → Implement → Review cycle in one shot. Open the downloaded issue markdown file, then run:

```text
/rpi This feature in this document
```

RPI will autonomously research the codebase, create a plan, implement the changes, and review the results. For larger features or tasks with many unknowns, the step-by-step process in 5.1 may produce better results. For straightforward tasks, this is the fastest path.

#### 5.4 Create a Pull Request

Once you're satisfied with the implementation and the review passes, create a pull request back to the upstream repository:

```text
/pull-request branch=upstream/main createPullRequest=true
```

This generates a PR description from your changes and creates the pull request using the GitHub MCP server.

### 6. What's Next?

After your first contribution, here are some ways to keep the momentum going:

- Have an idea but it's not fully fleshed out? Use `/task-research` to explore it:

  ```text
  /task-research I want to add [your feature idea] to Mac Paint Tool
  ```

  This produces a research document with scope analysis, implementation options, and potential acceptance criteria: a great starting point for a new issue.

- Once you have a solid research document, use GitHub Backlog Manager to create a well-structured issue in the upstream repo:

  ```text
  Create a new issue in agreaves-ms/mac-paint-tool based on this research document
  ```

- Browse the backlog for more unassigned issues to tackle. The same workflow from Section 4 applies.

- Add new regression tests for your feature using the Playwright-based test framework described below.

---

## Getting Started (Development)

### Prerequisites

- Node.js 18+ and npm
- PowerShell 7+ (`pwsh`), required for Playwright automation scripts
- .NET 10 SDK, required for running Playwright regression tests
- VS Code with the following extensions:
  - [HVE Core](https://marketplace.visualstudio.com/items?itemName=ise-hve-essentials.hve-core): RPI workflow, agents, and prompts
  - [HVE Core - Coding Standards](https://marketplace.visualstudio.com/items?itemName=ise-hve-essentials.hve-coding-standards): language-specific coding conventions
  - [HVE Core - GitHub Backlog Management](https://marketplace.visualstudio.com/items?itemName=ise-hve-essentials.hve-github): issue triage and backlog management
  - [GitHub Pull Requests and Issues](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github): GitHub MCP server and PR management

### Dev Container

This project includes a dev container configuration that provides a complete development environment with Node.js 22, .NET 10 SDK, and PowerShell 7+.

**Using VS Code:**

1. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.
2. Open the repository in VS Code.
3. When prompted, click **Reopen in Container**, or use the command palette: `Dev Containers: Reopen in Container`.
4. The container installs all dependencies automatically (`npm install`, `dotnet restore`, and Electron's native Linux libraries).

**Using GitHub Codespaces:**

1. Navigate to the repository on GitHub.
2. Click **Code** → **Codespaces** → **Create codespace on main**.

The dev container includes all recommended VS Code extensions (HVE Core, ESLint, C# Dev Kit, Playwright) and forwards port 5174 for the Vite dev server.

### Install Dependencies

```bash
npm install
```

### npm Scripts

| Script | Command | Description |
| ------ | ------- | ----------- |
| `start` | `npm run start` | Launch the Electron app via Electron Forge |
| `dev` | `npm run dev` | Start a standalone Vite dev server on port 5174 (for browser testing) |
| `make` | `npm run make` | Build distributable packages via Electron Forge |
| `package` | `npm run package` | Package the app without creating installers |
| `lint` | `npm run lint` | Run ESLint across TypeScript source files |
| `slow-test` | `npm run slow-test` | Start the Vite dev server, run Playwright regression tests, then shut down |

### Running the App

```bash
# Launch the full Electron application
npm run start

# Or start the standalone Vite dev server (for browser-based testing)
npm run dev
```

The standalone dev server on port 5174 serves the renderer UI without the Electron shell. This is the mode used by Playwright tests. `window.electronAPI` (file dialogs, clipboard, menu events) is not available in standalone mode.

---

## Playwright Automation Skill

The `playwright-automation` skill provides browser automation via CLI commands and PowerShell scripts, without the Playwright MCP server. Use it for visual testing, screenshot capture, and interactive browser automation.

For setup instructions, script reference, and troubleshooting, see the [Playwright Automation Skill README](.github/skills/playwright-automation/README.md).

---

## Regression Testing

Regression tests ensure that drawing operations produce consistent, expected results across code changes. The test suite uses **Playwright for .NET** (C# with xUnit) to automate a real browser, draw on the canvas through real pointer events, and capture the output.

### How It Works

Each regression test:

1. Starts a headed or headless browser and navigates to the standalone Vite dev server (`http://localhost:5174`).
2. Selects tools and presets using real UI interactions (clicking toolbar buttons, setting slider values).
3. Draws on the canvas by dispatching `PointerEvent` sequences through the app's `PaintEngine` pipeline, the same code path as real user interaction.
4. Captures the final canvas state as a PNG (or SVG) and writes it to `tests/playwright/output/`.
5. Asserts the output file exists and meets minimum size thresholds.

### Test Files

| File | Description |
| ---- | ----------- |
| `MacPaintTestBase.cs` | Base class with shared helpers for navigation, tool selection, pointer event dispatch, canvas inspection, and file output |
| `DrawingRegressionTests.cs` | Complex scene drawing (sky, cityscape, neural network overlay) |
| `HouseDrawingRegressionTests.cs` | House scene with sky, garden, and fence (includes SVG export) |
| `PencilDrawingRegressionTests.cs` | House scene drawn with the Pencil preset using real pointer events |

### Running the Tests

The easiest way to run the full test suite:

```bash
npm run slow-test
```

This command:

1. Kills any existing process on port 5174.
2. Starts the standalone Vite dev server.
3. Runs `dotnet test` against the Playwright test project.
4. Shuts down the dev server when tests complete.

To run tests manually (useful for debugging):

```bash
# Terminal 1: Start the dev server
npm run dev

# Terminal 2: Run the tests
cd tests/playwright/MacPaintTool.Tests
dotnet test
```

### Updating Tests

When you add new drawing features or change existing tool behavior, you'll need to update or create regression tests. There are two approaches: AI-assisted with the playwright-automation skill, or manual test creation.

#### AI-Assisted Testing with the Playwright Automation Skill

The fastest way to build and validate regression tests is to use the `playwright-automation` skill to visually explore your feature first, then generate test code from what you've verified.

1. Open Copilot Chat in Agent mode.
2. Ask the agent to use the playwright-automation skill to test your new feature:

   ```text
   Use the playwright-automation skill to test the new [feature name] tool.
   Draw some test scenarios on the canvas and capture screenshots of the results.
   ```

3. The agent will start the dev server, open a headed browser, interact with the canvas using your feature, and capture screenshots to `tests/playwright/output/`.
4. Review the screenshots to confirm the feature works as expected.
5. Once you're satisfied with what the skill has tested, ask the RPI agent to codify it into regression tests:

   ```text
   /rpi Create or update the regression tests with what's been tested by the playwright-automation skill
   ```

6. RPI will research the existing test patterns, plan new test classes or methods, implement the C# test code, and validate the results.

#### Manual Test Creation

You can also write regression tests directly without AI assistance. All tests live in `tests/playwright/MacPaintTool.Tests/` and use Playwright for .NET (C# with xUnit).

1. Create a new test class that extends `MacPaintTestBase`:

   ```csharp
   namespace MacPaintTool.Tests;

   public class MyFeatureRegressionTests : MacPaintTestBase
   {
       [Fact]
       public async Task MyFeature_DrawsExpectedOutput()
       {
           await NavigateToAppAsync();

           // Select the tool
           await SelectToolAsync("brush");
           await SelectBrushPresetAsync("Pencil");

           // Set colors and properties
           await SetForegroundColorAsync("#FF0000");
           await SetSliderValueAsync("line-size", 3);

           // Draw on the canvas
           await DrawLineAsync(100, 100, 400, 400);
           await DrawPathAsync(new[] { (200, 200), (300, 150), (400, 250) });

           // Capture and assert
           await SaveCanvasToFileAsync("my-feature-output.png");
           AssertFileExistsAndNotEmpty("my-feature-output.png");
           await AssertCanvasNotBlankAsync();
       }
   }
   ```

2. Use the base class helpers for common operations:
   - `SelectToolAsync(toolName)`: Click a toolbar button by its `data-tool` attribute
   - `SelectBrushPresetAsync(presetName)`: Click a brush preset by display name
   - `DrawLineAsync(x1, y1, x2, y2)`: Dispatch pointer events for a straight line
   - `DrawPathAsync(points)`: Dispatch pointer events along a series of coordinates
   - `SetSliderValueAsync(sliderId, value)`: Set a slider input value
   - `SetForegroundColorAsync(hex)`: Set the foreground color
   - `SaveCanvasToFileAsync(filename)`: Export the canvas as PNG
   - `SaveCanvasAsSvgAsync(filename)`: Export the canvas as SVG
   - `AssertFileExistsAndNotEmpty(filename)`: Verify the output file was created
   - `AssertCanvasNotBlankAsync()`: Verify the canvas contains drawn content

3. Run your test:

   ```bash
   # Start the dev server in one terminal
   npm run dev

   # Run your specific test in another terminal
   cd tests/playwright/MacPaintTool.Tests
   dotnet test --filter "MyFeature_DrawsExpectedOutput"
   ```

> [!TIP]
> For deterministic results, use seeded random values instead of `Math.random()` and draw with explicit pixel coordinates. The test base dispatches real pointer events through PaintEngine, so the same tool processing logic runs as in production.

---

## The `.copilot-tracking/` Directory

The `.copilot-tracking/` directory is the working memory for HVE Core's RPI workflow. It stores structured artifacts that capture the context, decisions, and history behind every feature built in this codebase. These files evolve as the project progresses and serve as both state tracking and context refinement for AI agents.

### Directory Structure

| Folder | Purpose |
| ------ | ------- |
| `research/` | Research documents produced during Phase 1 (Research). Contains scope analysis, evaluated alternatives, evidence logs, and recommended approaches. Subagent findings go in `research/subagents/`. |
| `plans/` | Implementation plans from Phase 2 (Plan). Each plan includes phased steps with checkboxes, dependencies, parallelization markers, and success criteria. Planning logs live in `plans/logs/`. |
| `details/` | Implementation details that complement plans with per-step file operations, line ranges, and specific instructions. |
| `changes/` | Change logs from Phase 3 (Implement). Records what files were added, modified, or removed for each implementation phase, along with any deviations from the original plan. |
| `reviews/` | Review logs from Phase 4 (Review). Contains validation findings, severity assessments, and iteration decisions. RPI validation outputs live in `reviews/rpi/`. |
| `memory/` | Persistent context notes that carry forward across sessions. Used for codebase conventions, lessons learned, and working state. |

### How RPI Uses These Files

When you run an RPI workflow (`/rpi`, `/task-research`, `/task-plan`, `/task-implement`, `/task-review`), the agents:

- Read existing artifacts to understand prior decisions and codebase conventions.
- Create new artifacts as they progress through each phase.
- Update plans with completion checkboxes and change logs with file modifications.
- Reference research documents during planning and implementation to stay aligned with the investigated approach.

These files are not meant to be hand-edited (though you can). They're the structured trail that keeps AI agents grounded in real context rather than guessing.

---

## License

[MIT](LICENSE), Copyright (c) 2026 Allen Greaves
