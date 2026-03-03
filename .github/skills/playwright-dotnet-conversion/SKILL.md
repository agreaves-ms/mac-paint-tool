---
name: playwright-dotnet-conversion
description: 'Converts Playwright automation steps into Playwright .NET tests and CI-ready workflows — supports both ephemeral and persistent browser contexts for SSO/auth-redirect sites'
user-invokable: true
compatibility: 'Requires .NET SDK 8+ or 10+, PowerShell 7+, and Playwright browser binaries'
---

# Playwright .NET Conversion Skill

## Overview

Converts browser automation steps into maintainable Playwright .NET tests using xUnit. Supports two base class patterns:

| Pattern | Base class | Use case |
| --- | --- | --- |
| **Ephemeral context** | `PageTest` (from `Microsoft.Playwright.Xunit`) | Standard web apps — fresh context per test |
| **Persistent context** | `PersistentBrowserTestBase` (custom) | SSO/OAuth/auth-redirect sites that destroy in-memory contexts |

Use this skill to:

* Translate manual Playwright action lists into C# tests
* Standardize resilient waiting and assertions in .NET tests
* Generate tests that survive SSO cross-origin redirects via persistent browser profiles
* Read credentials from environment variables — never hardcode secrets
* Generate GitHub Actions steps that restore, build, install browsers, and run tests
* Keep tests deterministic and CI-friendly

Default output locations for generated tests:

* **Canvas/UI tests:** `tests/playwright/MacPaintTool.Tests` (uses `PageTest` / `MacPaintTestBase`)
* **Regression/login/SSO tests:** `tests/playwright/RegressionTests` (uses `PersistentBrowserTestBase`)

## Prerequisites

| Platform | Required tools |
| --- | --- |
| macOS or Linux | .NET SDK 8+ or 10+, PowerShell 7+, GitHub Actions runner shell |
| Windows | .NET SDK 8+ or 10+, PowerShell 7+, GitHub Actions Windows runner |

Test project requirements:

* `Microsoft.Playwright` (core API for persistent contexts)
* `Microsoft.Playwright.Xunit` (optional — only if using `PageTest`)
* `xunit`
* `Microsoft.NET.Test.Sdk`

## Quick Start

### Ephemeral context tests (MacPaintTool.Tests)

```bash
dotnet build tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release
pwsh tests/playwright/MacPaintTool.Tests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
dotnet test tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release --logger "trx;LogFileName=playwright-dotnet.trx"
```

### Persistent context tests (RegressionTests)

```bash
dotnet build tests/playwright/RegressionTests/RegressionTests.csproj -c Release
pwsh tests/playwright/RegressionTests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
dotnet test tests/playwright/RegressionTests/bin/Release/net10.0/RegressionTests.dll --logger "trx;LogFileName=regression.trx"
```

Set credentials before running login tests:

```powershell
$env:APP_USERNAME = "<your-username>"
$env:APP_PASSWORD = "<your-password>"
```

## When to Use Persistent vs Ephemeral Context

| Signal | Use persistent (`PersistentBrowserTestBase`) |
| --- | --- |
| Site performs SSO/OAuth redirects | Yes |
| Cross-origin navigation during auth | Yes |
| Need cookies/state to survive redirects | Yes |
| Need login session to persist across test methods | Yes |
| Simple SPA or localhost app testing | No — use `PageTest` |

**Why persistent?** Standard `PageTest` creates a fresh in-memory `BrowserContext` per test. When a site does cross-origin SSO redirects, the in-memory context gets destroyed, causing `Target page, context or browser has been closed` errors. `LaunchPersistentContextAsync` uses a real user-data directory that survives these redirects.

## Conversion Workflow

1. Identify each browser action from the source automation steps
2. Determine if the target site requires SSO/auth — choose base class accordingly
3. Group actions into one test scenario with a clear expected outcome
4. Convert selectors to stable locators (role, label, test id before CSS)
5. Replace sleeps with Playwright waits and assertion retries
6. Add deterministic assertions after each critical action
7. Read any credentials from environment variables — never hardcode
8. Keep one behavior per test when possible
9. Write generated test files under the appropriate test project folder

## Mapping Reference

| Source step | Playwright .NET pattern |
| --- | --- |
| Navigate to URL | `await Page.GotoAsync(url);` |
| Click element | `await Page.GetByRole(...).ClickAsync();` |
| Fill input | `await Page.GetByLabel("...").FillAsync("...");` |
| Fill from env var | `await Page.GetByLabel("...").FillAsync(Environment.GetEnvironmentVariable("APP_USERNAME")!);` |
| Select option | `await Page.GetByLabel("...").SelectOptionAsync("...");` |
| Wait for URL change | `await Page.WaitForURLAsync("**/dashboard", new() { Timeout = 30000 });` |
| Wait for UI state | `await Expect(locator).ToBeVisibleAsync();` |
| Assert text | `await Expect(locator).ToContainTextAsync("...");` |
| Assert no error text | `await Expect(Page.GetByText("error")).Not.ToBeVisibleAsync();` |
| Assert button enabled | `await Expect(locator).ToBeEnabledAsync();` |
| Upload file | `await locator.SetInputFilesAsync(path);` |
| Download file | `var download = await Page.RunAndWaitForDownloadAsync(...);` |
| Save screenshot | `await Page.ScreenshotAsync(new() { Path = "login.png" });` |

See detailed mappings in [Conversion mapping reference](./references/conversion-mapping.md).

## .NET Testing Best Practices

* Use `PageTest` for standard web app tests, `PersistentBrowserTestBase` for SSO/auth sites
* Use role or label locators first, then test ids
* Prefer `Expect(...)` assertions over manual polling
* Avoid fixed waits such as `Task.Delay`
* Keep test names behavior-oriented, for example `Login_Succeeds_WithValidCredentials`
* Read all credentials from `Environment.GetEnvironmentVariable()` — never hardcode
* Keep setup local to each test or a focused helper, not hidden global state
* Clean up persistent browser profiles in `DisposeAsync` to avoid state leakage between runs

## Credentials Policy (Mandatory)

* **NEVER hardcode usernames, passwords, tokens, or secrets** in test files, templates, or commit messages
* **Always read credentials from environment variables** using `Environment.GetEnvironmentVariable("APP_USERNAME")` and `Environment.GetEnvironmentVariable("APP_PASSWORD")`
* **If environment variables are not set, skip or fail the test gracefully** with a clear message
* **Do not log credentials** in test output — use `ITestOutputHelper` for non-sensitive diagnostics only

## Persistent Browser Context Pattern

For SSO/auth-redirect sites, tests inherit from `PersistentBrowserTestBase` instead of `PageTest`:

```csharp
using Microsoft.Playwright;

namespace RegressionTests;

public class LoginTests : PersistentBrowserTestBase
{
    [Fact]
    public async Task Login_Succeeds_WithValidCredentials()
    {
        var username = Environment.GetEnvironmentVariable("APP_USERNAME");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD");
        Assert.False(string.IsNullOrEmpty(username), "APP_USERNAME env var must be set");
        Assert.False(string.IsNullOrEmpty(password), "APP_PASSWORD env var must be set");

        await Page.GotoAsync("https://example.com/login");

        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Username" }).FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Password" }).FillAsync(password);

        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "Log In", Exact = true });
        await Expect(loginButton).ToBeEnabledAsync();
        await loginButton.ClickAsync();

        // Wait for redirect to complete
        await Page.WaitForURLAsync(url => !url.Contains("/login"), new() { Timeout = 30000 });

        // Verify no error text
        await Expect(Page.GetByText("Login Unsuccessful")).Not.ToBeVisibleAsync();

        await Page.ScreenshotAsync(new() { Path = "login.png" });
    }
}
```

### `PersistentBrowserTestBase` internals

The base class manages browser lifecycle manually instead of relying on `PageTest`:

* Creates `IPlaywright` instance in constructor
* Launches Edge via `LaunchPersistentContextAsync` with a temp profile directory
* Exposes `Page`, `Context`, and `Browser` properties
* Provides `Expect()` helper matching `PageTest` API
* Cleans up profile directory in `DisposeAsync`
* Supports headed mode via `HEADED` environment variable
* Defaults to `msedge` channel — configurable via `BROWSER_CHANNEL` env var

See [PersistentBrowserTestBase template](./assets/templates/PersistentBrowserTestBase.cs).

## GitHub Actions Usage

Use your existing workflow and ensure it includes these steps:

1. Checks out code
2. Sets up .NET
3. Restores and builds tests
4. Installs Playwright browsers
5. Sets credential env vars from GitHub Secrets
6. Runs `dotnet test`
7. Upload `.trx` artifacts

```yaml
- name: Run regression tests
  env:
    APP_USERNAME: ${{ secrets.APP_USERNAME }}
    APP_PASSWORD: ${{ secrets.APP_PASSWORD }}
  run: dotnet test tests/playwright/RegressionTests/RegressionTests.csproj -c Release --logger "trx"
```

## Execution Requirement

When this skill is used to generate tests, execute the generated test and report outcome in the same run.

Use these commands by default:

### For MacPaintTool.Tests (ephemeral context)

```bash
dotnet build tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release
pwsh tests/playwright/MacPaintTool.Tests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
dotnet test tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release --logger "trx;LogFileName=playwright-dotnet.trx"
```

### For RegressionTests (persistent context)

```bash
dotnet build tests/playwright/RegressionTests/RegressionTests.csproj -c Release
pwsh tests/playwright/RegressionTests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
dotnet test tests/playwright/RegressionTests/RegressionTests.csproj -c Release --logger "trx;LogFileName=regression.trx"
```

## Conversion Examples

### Example 1: Standard web app test (ephemeral)

Source steps:

1. Open app home page
2. Click New Document
3. Type document name `Smoke`
4. Click Create
5. Verify canvas is visible

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

### Example 2: SSO login test (persistent)

Source steps:

1. Read username/password from env vars
2. Navigate to `https://example.com/` (redirects to `/login`)
3. Fill username and password fields
4. Click "Log In" button
5. Wait up to 30s for redirect
6. Verify dashboard content, no error text
7. Screenshot as `login.png`

```csharp
using Microsoft.Playwright;

namespace RegressionTests;

public class LoginTests : PersistentBrowserTestBase
{
    [Fact]
    public async Task Login_Succeeds_WithValidCredentials()
    {
        var username = Environment.GetEnvironmentVariable("APP_USERNAME");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD");
        Assert.False(string.IsNullOrEmpty(username), "APP_USERNAME env var must be set");
        Assert.False(string.IsNullOrEmpty(password), "APP_PASSWORD env var must be set");

        await Page.GotoAsync("https://example.com/");
        await Page.WaitForURLAsync("**/login", new() { Timeout = 15000 });

        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Username" }).FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Password" }).FillAsync(password);

        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "Log In", Exact = true });
        await Expect(loginButton).ToBeEnabledAsync();
        await loginButton.ClickAsync();

        await Page.WaitForURLAsync(url => !url.Contains("/login"), new() { Timeout = 30000 });
        await Expect(Page.GetByText("Login Unsuccessful")).Not.ToBeVisibleAsync();

        await Page.ScreenshotAsync(new() { Path = "login.png" });
    }
}
```

## Templates

Use these templates for fast generation:

* [Ephemeral test template (PageTest)](./assets/templates/playwright-dotnet-test-template.cs) — standard web apps
* [Persistent base class](./assets/templates/PersistentBrowserTestBase.cs) — SSO/auth-redirect sites
* [Persistent test template](./assets/templates/persistent-test-template.cs) — login/regression tests

## Troubleshooting

| Symptom | Cause | Resolution |
| --- | --- | --- |
| `playwright.ps1` not found | Build step not executed for target framework | Run `dotnet build` before install command |
| Timeout failures in CI | App URL not reachable or selectors unstable | Start app server explicitly and switch to role or label locators |
| Tests pass locally, fail in CI | Environment drift | Pin .NET version and browser install step in workflow |
| Flaky assertions | Fixed waits or race conditions | Replace with `Expect` assertions and explicit navigation or network waits |
| `Target page, context or browser has been closed` | SSO redirect destroyed in-memory context | Use `PersistentBrowserTestBase` instead of `PageTest` |
| `APP_USERNAME` is empty or wrong | Using `$env:username` (Windows built-in) | Use `$env:APP_USERNAME` / `Environment.GetEnvironmentVariable("APP_USERNAME")` |
| Persistent profile causes state leakage | Previous test's cookies/session carried over | Base class cleans up profile dir in `DisposeAsync`; ensure tests are independent |
| Edge not found | `msedge` channel not available | Install Edge or set `BROWSER_CHANNEL=chromium` env var |

> Brought to you by agreaves-ms/mac-paint-tool