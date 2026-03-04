---
title: xUnit Collection Fixture Pattern for Sharing Playwright Browser Sessions
description: Research on using ICollectionFixture<T> to share a single authenticated Playwright browser session across multiple xUnit test classes in .NET, with security analysis comparing in-memory session sharing against storage state file approaches
author: GitHub Copilot
ms.date: 2026-03-04
ms.topic: reference
keywords:
  - xunit
  - collection fixture
  - playwright
  - dotnet
  - browser session
  - authentication
  - SSO
estimated_reading_time: 12
---

## Overview

This document examines how xUnit's `ICollectionFixture<T>` pattern can share a single authenticated Playwright browser session across multiple test classes. The goal: log into a corporate SSO site once, then run all test classes against that live session without writing credentials or auth state to disk.

## xUnit Collection Fixture Pattern

### How `ICollectionFixture<T>` Works

xUnit provides three levels of fixture scoping:

| Scope              | Attribute                 | Lifetime                          | Sharing                         |
|--------------------|---------------------------|-----------------------------------|---------------------------------|
| Per-test           | `IClassFixture<T>`        | Created/disposed per test class   | Shared within one class         |
| Per-collection     | `ICollectionFixture<T>`   | Created/disposed per collection   | Shared across classes           |
| Per-assembly       | Not built-in (workaround) | Manual singleton                  | Shared across all tests         |

`ICollectionFixture<T>` sits at the collection level. A "collection" in xUnit is a named group of test classes that share a single fixture instance and execute sequentially.

### Lifecycle

1. xUnit discovers all test classes decorated with `[Collection("SameName")]`.
2. Before executing the first test in the collection, xUnit instantiates `T` (the fixture class).
3. If `T` implements `IAsyncLifetime`, xUnit awaits `InitializeAsync()` before any test runs.
4. All test classes in the collection receive the same `T` instance via constructor injection.
5. After the last test in the collection completes, xUnit calls `DisposeAsync()` (or `Dispose()`).

### Defining a Collection

Two pieces are required:

```csharp
// 1. Collection definition (marker class, can be empty)
[CollectionDefinition("AuthenticatedBrowser")]
public class AuthenticatedBrowserCollection : ICollectionFixture<BrowserSessionFixture>
{
    // No code needed. This class links the collection name to the fixture type.
}

// 2. Test classes opt in by name
[Collection("AuthenticatedBrowser")]
public class DashboardTests
{
    private readonly BrowserSessionFixture _session;

    public DashboardTests(BrowserSessionFixture session)
    {
        _session = session;
    }
}
```

The `[CollectionDefinition]` class exists solely to associate the string name with the fixture type. It never needs a body.

### Sequential Execution Guarantee

xUnit runs test classes within the same collection **sequentially**, not in parallel. This is by design: the shared fixture resource (in this case, a browser session) is not expected to handle concurrent access. Test classes in *different* collections (or no collection) run in parallel with each other.

This behavior is confirmed in xUnit's documentation:

> "Test collections also influence the way xUnit.net parallelizes tests when running them. By default, each test collection runs its test classes in sequence, but multiple test collections can run in parallel."

For a shared browser session, sequential execution is not a limitation but a requirement, since a single `IPage` cannot process multiple navigations simultaneously.

### Async Initialization via `IAsyncLifetime`

The fixture class can implement `IAsyncLifetime` to perform async setup and teardown:

```csharp
public class BrowserSessionFixture : IAsyncLifetime
{
    public async Task InitializeAsync()
    {
        // Async operations: create Playwright, launch browser, authenticate
    }

    public async Task DisposeAsync()
    {
        // Async cleanup: close context, dispose Playwright
    }
}
```

xUnit awaits `InitializeAsync()` before injecting the fixture into any test class constructor. This is essential for Playwright, where browser launch and authentication are inherently async operations.

## Applying Collection Fixture to Playwright

### Architecture

```text
┌─────────────────────────────────────────────────────┐
│  BrowserSessionFixture (IAsyncLifetime)             │
│                                                     │
│  InitializeAsync():                                 │
│    1. Create Playwright instance                    │
│    2. Launch browser (msedge channel)               │
│    3. Create browser context                        │
│    4. Open new page                                 │
│    5. Navigate to login URL                         │
│    6. Fill credentials from env vars                │
│    7. Click login, wait for redirect/success        │
│    8. Store IBrowserContext + IPage as properties    │
│                                                     │
│  DisposeAsync():                                    │
│    1. Close browser context                         │
│    2. Dispose Playwright instance                   │
│    3. No disk cleanup needed                        │
│                                                     │
│  Properties:                                        │
│    IBrowserContext Context { get; }                  │
│    IPage Page { get; }                              │
└────────┬────────────────────────────┬───────────────┘
         │ constructor injection      │
    ┌────▼────┐                 ┌─────▼─────┐
    │ TestA   │  sequential     │  TestB    │
    │ Class   │ ──────────────► │  Class    │
    └─────────┘                 └───────────┘
```

### Complete Code Example

#### Fixture Class

```csharp
using Microsoft.Playwright;

namespace MyTests;

/// <summary>
/// Creates a Playwright browser session, authenticates via SSO login form,
/// and shares the authenticated page/context across all test classes in the
/// "AuthenticatedBrowser" collection.
///
/// All auth state lives in browser process memory. Nothing is written to disk.
/// </summary>
public class BrowserSessionFixture : IAsyncLifetime
{
    private IPlaywright _playwright = null!;
    private IBrowser _browser = null!;

    /// <summary>
    /// The authenticated browser context. Shared across all test classes.
    /// </summary>
    public IBrowserContext Context { get; private set; } = null!;

    /// <summary>
    /// The page that completed login. Tests can navigate this page freely.
    /// </summary>
    public IPage Page { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        // 1. Read credentials from environment variables (never hardcoded)
        var loginUrl = Environment.GetEnvironmentVariable("TEST_LOGIN_URL")
            ?? throw new InvalidOperationException("TEST_LOGIN_URL env var is required");
        var username = Environment.GetEnvironmentVariable("TEST_USERNAME")
            ?? throw new InvalidOperationException("TEST_USERNAME env var is required");
        var password = Environment.GetEnvironmentVariable("TEST_PASSWORD")
            ?? throw new InvalidOperationException("TEST_PASSWORD env var is required");

        // 2. Create Playwright and launch browser
        _playwright = await Playwright.CreateAsync();

        var channel = Environment.GetEnvironmentVariable("BROWSER_CHANNEL") ?? "msedge";
        var headed = Environment.GetEnvironmentVariable("HEADED") == "1";

        _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Channel = channel,
            Headless = !headed,
        });

        // 3. Create a fresh browser context (in-memory, no persistent profile dir)
        Context = await _browser.NewContextAsync(new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = 1400, Height = 900 },
            AcceptDownloads = true,
        });

        // 4. Open page and authenticate
        Page = await Context.NewPageAsync();
        await Page.GotoAsync(loginUrl, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.NetworkIdle
        });

        // 5. Fill login form (adjust selectors to match your SSO page)
        await Page.FillAsync("#username", username);
        await Page.FillAsync("#password", password);
        await Page.ClickAsync("#login-button");

        // 6. Wait for successful authentication (URL changes, element appears, etc.)
        await Page.WaitForURLAsync("**/dashboard**", new PageWaitForURLOptions
        {
            Timeout = 30_000
        });
    }

    public async Task DisposeAsync()
    {
        try { await Context.CloseAsync(); } catch { /* may already be closed */ }
        try { await _browser.CloseAsync(); } catch { /* may already be closed */ }
        _playwright.Dispose();

        // No disk cleanup needed. All auth state was in browser process memory.
    }
}
```

#### Collection Definition

```csharp
namespace MyTests;

[CollectionDefinition("AuthenticatedBrowser")]
public class AuthenticatedBrowserCollection : ICollectionFixture<BrowserSessionFixture>
{
    // Marker class. Associates the "AuthenticatedBrowser" name with BrowserSessionFixture.
}
```

#### Test Class A

```csharp
namespace MyTests;

[Collection("AuthenticatedBrowser")]
public class DashboardTests
{
    private readonly BrowserSessionFixture _session;

    public DashboardTests(BrowserSessionFixture session)
    {
        _session = session;
    }

    [Fact]
    public async Task Dashboard_ShowsWelcomeMessage()
    {
        // Navigate to starting point (defensive, in case a prior test navigated away)
        await _session.Page.GotoAsync("https://app.example.com/dashboard");

        var heading = _session.Page.Locator("h1");
        await Assertions.Expect(heading).ToContainTextAsync("Welcome");
    }

    [Fact]
    public async Task Dashboard_DisplaysUserName()
    {
        await _session.Page.GotoAsync("https://app.example.com/dashboard");

        var profileName = _session.Page.Locator("[data-testid='user-name']");
        await Assertions.Expect(profileName).ToBeVisibleAsync();
    }
}
```

#### Test Class B (Same Shared Session)

```csharp
namespace MyTests;

[Collection("AuthenticatedBrowser")]
public class SettingsPageTests
{
    private readonly BrowserSessionFixture _session;

    public SettingsPageTests(BrowserSessionFixture session)
    {
        _session = session;
    }

    [Fact]
    public async Task Settings_ShowsAccountSection()
    {
        await _session.Page.GotoAsync("https://app.example.com/settings");

        var accountSection = _session.Page.Locator("#account-settings");
        await Assertions.Expect(accountSection).ToBeVisibleAsync();
    }

    [Fact]
    public async Task Settings_CanUpdateDisplayName()
    {
        await _session.Page.GotoAsync("https://app.example.com/settings");

        await _session.Page.FillAsync("#display-name", "Test User Updated");
        await _session.Page.ClickAsync("#save-settings");

        var toast = _session.Page.Locator(".toast-success");
        await Assertions.Expect(toast).ToBeVisibleAsync();
    }
}
```

### Execution Flow

1. xUnit discovers `DashboardTests` and `SettingsPageTests`, both in the `"AuthenticatedBrowser"` collection.
2. xUnit creates `BrowserSessionFixture`, awaits `InitializeAsync()` (browser launches, login completes).
3. `DashboardTests` runs all its `[Fact]` methods sequentially using `_session.Page`.
4. `SettingsPageTests` runs all its `[Fact]` methods sequentially using the same `_session.Page`.
5. xUnit awaits `DisposeAsync()` on the fixture (browser closes, memory freed).

Both classes share the same authenticated browser session. The login happens once.

## Security Analysis

### In-Memory Fixture Approach (Recommended)

| Aspect                  | Risk Level | Details                                                                                    |
|-------------------------|------------|--------------------------------------------------------------------------------------------|
| Auth tokens on disk     | None       | Cookies and localStorage live in browser process memory only                               |
| Credential exposure     | Minimal    | Read from env vars, passed to `FillAsync()` as ephemeral strings, never serialized to disk |
| Crash recovery artifact | None       | Browser process dies on crash, OS reclaims memory, no auth artifacts persist               |
| CI runner contamination | None       | No files to leak between pipeline runs on shared/persistent runners                        |
| `.gitignore` dependency | None       | No auth files exist that could accidentally be committed                                   |

Credentials follow this path:

```text
Environment Variable → C# string → Page.FillAsync() → DOM input value → Browser POST
                                    (ephemeral)         (in-memory)       (over TLS)
```

At no point does a credential or session token touch the filesystem.

### What About the Browser's Internal Temp Files?

Chromium-based browsers may write internal data to temp directories (cache, GPU shader cache, crash dumps). These are browser engine internals and do **not** contain exported auth state in a usable format. They are not equivalent to Playwright's `StorageStateAsync()` output. No session tokens, cookies, or localStorage values are exported as readable files.

When using `_browser.NewContextAsync()` (non-persistent context), Chromium uses an in-memory profile. There is no user-data directory to clean up.

## Comparison with Storage State File Approach

### Storage State File Method

Playwright offers `Context.StorageStateAsync()` to serialize all cookies and localStorage into a JSON file:

```csharp
// Writes ALL cookies, localStorage, sessionStorage to a plaintext JSON file
await Context.StorageStateAsync(new BrowserContextStorageStateOptions
{
    Path = "auth-state.json"
});
```

The resulting `auth-state.json` contains:

```json
{
  "cookies": [
    {
      "name": ".AspNet.Cookies",
      "value": "CfDJ8N...long_session_token...",
      "domain": "app.example.com",
      "path": "/",
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax",
      "expires": 1741305600
    }
  ],
  "origins": [
    {
      "origin": "https://app.example.com",
      "localStorage": [
        { "name": "access_token", "value": "eyJhbGciOi..." },
        { "name": "csrf_token", "value": "abc123..." }
      ]
    }
  ]
}
```

### Risk Comparison

| Risk Factor                        | Storage State File             | In-Memory Fixture (Collection Fixture) |
|------------------------------------|--------------------------------|----------------------------------------|
| Session tokens written to disk     | Yes, plaintext JSON            | No                                     |
| Requires `.gitignore` entry        | Yes, critical                  | No                                     |
| Persists after CI failure/crash    | Yes, file remains on disk      | No, process memory is freed            |
| Shared runner cross-contamination  | Possible if cleanup fails      | Impossible                             |
| Accidental commit risk             | Non-zero (human error)         | Zero                                   |
| Usable by other processes on host  | Yes, any process can read JSON | No, memory is process-isolated         |
| Cleanup logic required             | Yes, try/finally + File.Delete | No                                     |

### When Storage State Files Are Appropriate

Storage state files serve a different purpose: reusing auth across separate test processes or pipeline stages. If you run `dotnet test` multiple times in sequence (separate processes) and need to share the login, storage state files are the mechanism Playwright provides. The security trade-off is acceptable when:

* The CI runner is ephemeral (destroyed after use)
* The file is written to a tmpfs/ramdisk
* The pipeline guarantees cleanup in a `finally` block

For a single `dotnet test` invocation where all test classes run in one process, the collection fixture approach is superior.

## Caveats and Mitigations

### Sequential Execution

Test classes in the same collection run sequentially by default. This is both a feature and a limitation.

**Impact:** Total test time equals the sum of all test durations. No parallelism within the collection.

**Mitigation:** For most SSO-authenticated test suites, the bottleneck is network latency to the target application, not CPU. Sequential execution also avoids the complexity of managing multiple pages/tabs. If parallelism is needed, open multiple pages from the same context:

```csharp
// Create additional pages within the shared context
var page2 = await _session.Context.NewPageAsync();
```

Additional pages inherit the context's cookies and storage, so they share the authenticated session without re-logging in.

### Navigation State Pollution

If one test navigates to a page and fails mid-way, subsequent tests inherit that navigation state.

**Mitigation:** Each test should navigate to its own starting URL before asserting:

```csharp
[Fact]
public async Task MyTest()
{
    // Always navigate to the expected starting point
    await _session.Page.GotoAsync("https://app.example.com/my-page");

    // Then assert
}
```

This is a standard practice in integration testing with shared browser sessions.

### Session Expiration

If the SSO session has a short timeout (for example, 15 minutes), tests running after that window will encounter auth failures.

**Mitigations:**

* Run the test suite within the session's validity window
* Implement a session refresh check in the fixture (navigate to a known authenticated endpoint, verify response, re-login if needed)
* Use a test-specific service account with extended session duration

### Browser Context State Leakage

Actions like changing cookies, localStorage, or browser settings in one test affect all subsequent tests.

**Mitigation:** Avoid modifying context-level state in tests. If a test must modify cookies or storage, restore the original state afterward. Alternatively, create a new page for destructive tests:

```csharp
var isolatedPage = await _session.Context.NewPageAsync();
// Run destructive test on isolatedPage
await isolatedPage.CloseAsync();
```

### Persistent Context Alternative

The existing `PersistentBrowserTestBase` in this codebase uses `LaunchPersistentContextAsync` with a temp profile directory. This writes a full Chromium user-data directory to disk, which contains cookies and session data in SQLite databases. The collection fixture approach with `NewContextAsync()` avoids this entirely by using an in-memory profile.

| Approach                              | Disk Artifact                        | Auth Data on Disk |
|---------------------------------------|--------------------------------------|-------------------|
| `LaunchPersistentContextAsync`        | Full Chromium user-data directory    | Yes (SQLite DBs)  |
| `NewContextAsync` (collection fixture)| None (in-memory profile)             | No                |
| `StorageStateAsync`                   | Plaintext JSON file                  | Yes               |

## Recommendation

The `ICollectionFixture<BrowserSessionFixture>` pattern with `IAsyncLifetime` is the most secure approach for sharing an authenticated Playwright session across multiple test classes when:

1. All tests run in a single `dotnet test` invocation (single process)
2. The target site uses form-based or SSO login that can be automated via Playwright
3. Sequential test execution is acceptable
4. No auth state should persist on disk under any circumstances

This approach eliminates the entire category of "auth file on disk" risks: no storage state JSON, no persistent profile directories, no cleanup-on-crash concerns. Credentials enter the process as environment variables and are used once to fill a login form. Session tokens exist only in browser process memory and vanish when the process exits.

For this codebase's scenario (corporate SSO site, authenticated regression tests), this is the recommended pattern. It provides the security guarantees of in-memory-only auth while leveraging xUnit's built-in fixture lifecycle for clean, predictable session management.
