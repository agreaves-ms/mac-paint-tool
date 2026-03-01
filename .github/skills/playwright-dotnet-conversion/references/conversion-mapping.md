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

## Test Design Guidance

* Keep each test scoped to one behavior outcome
* Minimize shared mutable state between tests
* Use explicit test names with behavior and condition
* Prefer helper methods over inheritance-heavy utility layers
