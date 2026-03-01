---
name: playwright-dotnet-conversion
description: 'Converts Playwright automation steps into Playwright .NET tests and CI-ready workflows - Brought to you by agreaves-ms/mac-paint-tool'
user-invokable: true
compatibility: 'Requires .NET SDK 8+ or 10+, PowerShell 7+, and Playwright browser binaries'
---

# Playwright .NET Conversion Skill

## Overview

Converts browser automation steps into maintainable Playwright .NET tests using xUnit and `Microsoft.Playwright.Xunit` patterns.

Use this skill to:

* Translate manual Playwright action lists into C# tests
* Standardize resilient waiting and assertions in .NET tests
* Generate GitHub Actions steps that restore, build, install browsers, and run tests
* Keep tests deterministic and CI-friendly

Default output location for generated tests:

* `tests/playwright/MacPaintTool.Tests`

## Prerequisites

| Platform | Required tools |
| --- | --- |
| macOS or Linux | .NET SDK 8+ or 10+, PowerShell 7+, GitHub Actions runner shell |
| Windows | .NET SDK 8+ or 10+, PowerShell 7+, GitHub Actions Windows runner |

Test project requirements:

* `Microsoft.Playwright.Xunit`
* `xunit`
* `Microsoft.NET.Test.Sdk`

## Quick Start

1. Build the test project
2. Install Playwright browsers from the generated `playwright.ps1`
3. Run tests in headless mode

```bash
dotnet build tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release
pwsh tests/playwright/MacPaintTool.Tests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
dotnet test tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release --logger "trx;LogFileName=playwright-dotnet.trx"
```

## Conversion Workflow

1. Identify each browser action from the source automation steps
2. Group actions into one test scenario with a clear expected outcome
3. Convert selectors to stable locators (role, label, test id before CSS)
4. Replace sleeps with Playwright waits and assertion retries
5. Add deterministic assertions after each critical action
6. Keep one behavior per test when possible
7. Write generated test files under `tests/playwright/MacPaintTool.Tests`

## Mapping Reference

| Source step | Playwright .NET pattern |
| --- | --- |
| Navigate to URL | `await Page.GotoAsync(url);` |
| Click element | `await Page.GetByRole(...).ClickAsync();` |
| Fill input | `await Page.GetByLabel("...").FillAsync("...");` |
| Select option | `await Page.GetByLabel("...").SelectOptionAsync("...");` |
| Wait for UI state | `await Expect(locator).ToBeVisibleAsync();` |
| Assert text | `await Expect(locator).ToContainTextAsync("...");` |
| Upload file | `await locator.SetInputFilesAsync(path);` |
| Download file | `var download = await Page.RunAndWaitForDownloadAsync(...);` |

See detailed mappings in [Conversion mapping reference](./references/conversion-mapping.md).

## .NET Testing Best Practices

* Use `PageTest` from `Microsoft.Playwright.Xunit` for fixture setup
* Use role or label locators first, then test ids
* Prefer `Expect(...)` assertions over manual polling
* Avoid fixed waits such as `Task.Delay`
* Keep test names behavior-oriented, for example `SavesDrawing_WhenUserCompletesStroke`
* Keep setup local to each test or a focused helper, not hidden global state

## GitHub Actions Usage

Use your existing workflow and ensure it includes these steps:

1. Checks out code
2. Sets up .NET
3. Restores and builds tests
4. Installs Playwright browsers
5. Runs `dotnet test`
6. Upload `.trx` artifacts

## Execution Requirement

When this skill is used to generate tests, execute the generated test and report outcome in the same run.

Use these commands by default:

```bash
dotnet build tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release
pwsh tests/playwright/MacPaintTool.Tests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
dotnet test tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release --logger "trx;LogFileName=playwright-dotnet.trx"
```

## Conversion Example

Source steps:

1. Open app home page
2. Click New Document
3. Type document name `Smoke`
4. Click Create
5. Verify canvas is visible

Converted Playwright .NET test sample:

```csharp
using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;

namespace MacPaintTool.Tests;

public class DocumentCreationTests : PageTest
{
    [Fact]
    public async Task CreatesNewDocument_WhenUserSubmitsDialog()
    {
        await Page.GotoAsync("http://localhost:5174");

        await Page.GetByRole(AriaRole.Button, new() { Name = "New Document" }).ClickAsync();
        await Page.GetByLabel("Document Name").FillAsync("Smoke");
        await Page.GetByRole(AriaRole.Button, new() { Name = "Create" }).ClickAsync();

        await Expect(Page.Locator("#paint-canvas")).ToBeVisibleAsync();
    }
}
```

## Templates

Use these templates for fast generation:

* [Playwright .NET test template](./assets/templates/playwright-dotnet-test-template.cs)

## Troubleshooting

| Symptom | Cause | Resolution |
| --- | --- | --- |
| `playwright.ps1` not found | Build step not executed for target framework | Run `dotnet build` before install command |
| Timeout failures in CI | App URL not reachable or selectors unstable | Start app server explicitly and switch to role or label locators |
| Tests pass locally, fail in CI | Environment drift | Pin .NET version and browser install step in workflow |
| Flaky assertions | Fixed waits or race conditions | Replace with `Expect` assertions and explicit navigation or network waits |

> Brought to you by agreaves-ms/mac-paint-tool