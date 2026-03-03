---
description: 'Detailed conversion mapping from Playwright action steps to Playwright .NET test code'
---

# Conversion Mapping Reference

## Locator Priority

Use this order unless project constraints require otherwise:

1. `GetByRole`
2. `GetByLabel`
3. `GetByTestId`
4. `Locator("...")` with stable CSS

## Step-to-Code Mapping

| Automation intent | Playwright .NET code |
| --- | --- |
| Open a page | `await Page.GotoAsync("http://localhost:5174");` |
| Click toolbar button | `await Page.GetByRole(AriaRole.Button, new() { Name = "Brush" }).ClickAsync();` |
| Fill text input | `await Page.GetByLabel("Document Name").FillAsync("Smoke");` |
| Verify element appears | `await Expect(Page.Locator("#paint-canvas")).ToBeVisibleAsync();` |
| Verify text content | `await Expect(Page.GetByTestId("status")).ToContainTextAsync("Saved");` |
| Handle modal dialog | `Page.Dialog += (_, d) => d.AcceptAsync();` |
| Wait for network response | `await Page.RunAndWaitForResponseAsync(async () => await action(), r => r.Url.Contains("/api/save") && r.Ok);` |
| Save screenshot | `await Page.ScreenshotAsync(new() { Path = "artifacts/canvas.png", FullPage = true });` |

## Assertion Patterns

Prefer these patterns for deterministic checks:

```csharp
await Expect(Page.GetByRole(AriaRole.Button, new() { Name = "Save" })).ToBeEnabledAsync();
await Expect(Page.GetByTestId("toast")).ToContainTextAsync("Saved");
await Expect(Page.Locator("#paint-canvas")).ToBeVisibleAsync();
```

Avoid fixed delays:

```csharp
// Avoid
await Task.Delay(2000);
```

## Persistent Context Patterns (SSO/Auth Sites)

These patterns apply when inheriting from `PersistentBrowserTestBase` instead of `PageTest`:

| Automation intent | Playwright .NET code |
| --- | --- |
| Read credential from env var | `var username = Environment.GetEnvironmentVariable("APP_USERNAME");` |
| Guard missing credentials | `Assert.False(string.IsNullOrEmpty(username), "APP_USERNAME env var must be set");` |
| Wait for SSO redirect | `await Page.WaitForURLAsync("**/login", new() { Timeout = 15000 });` |
| Wait for post-login redirect | `await Page.WaitForURLAsync(url => !url.Contains("/login"), new() { Timeout = 30000 });` |
| Assert button enabled before click | `await Expect(loginButton).ToBeEnabledAsync();` |
| Assert no error text visible | `await Expect(Page.GetByText("Login Unsuccessful")).Not.ToBeVisibleAsync();` |
| Save screenshot to specific file | `await Page.ScreenshotAsync(new() { Path = "login.png" });` |

Base class selection guide:

| Scenario | Base class |
| --- | --- |
| Localhost SPA, no auth | `PageTest` |
| SSO/OAuth redirect during auth | `PersistentBrowserTestBase` |
| Site that needs cookies across redirects | `PersistentBrowserTestBase` |
| Tests needing headed mode for visual check | Either — set `HEADED=1` env var |

## Test Design Guidance

* Keep each test scoped to one behavior outcome
* Minimize shared mutable state between tests
* Use explicit test names with behavior and condition
* Prefer helper methods over inheritance-heavy utility layers
* For persistent context tests, never hardcode credentials — read from environment variables
* Clean up is handled by `PersistentBrowserTestBase.DisposeAsync()` — do not manually delete profile dirs
