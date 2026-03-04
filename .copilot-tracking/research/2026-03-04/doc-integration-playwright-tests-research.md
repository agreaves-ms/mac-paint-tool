<!-- markdownlint-disable-file -->
# Task Research: Doc-Integration Playwright .NET Test Automation

Build a new Playwright .NET test suite for `https://doc-integration.pfizer.com/` — an SSO-authenticated corporate application. Tests must log in once and share the authenticated session securely across multiple test classes. The first two tests to automate are a login verification test and a "Top Priorities" navigation/validation test.

## Task Implementation Requests

* Build a new Playwright .NET test project (`DocIntegrationTests`) for automating manual tests against `https://doc-integration.pfizer.com/`
* Implement secure login-once-reuse-everywhere session sharing across test classes
* Automate Test 1: Login success verification (credentials from env vars, check post-login UI, screenshot)
* Automate Test 2: Navigate to "Global Tech Eng > Clinical Manufacturing Supply Operations > Clinical Supply Puurs", click Apply, verify Top Priorities
* Follow security best practices: no credentials/tokens on disk, no storage state files, env-var-only credentials
* Support both Edge and Chromium via parameterized browser channel
* Design for extensibility — easy to add more tests that share the authenticated session

## Scope and Success Criteria

* Scope: Authentication strategy selection, test project structure, two initial test implementations, security posture
* Assumptions:
  * The site uses SSO (confirmed by "Sso Login Unsuccessful" error text in the UI)
  * Username/password form is on the page but submits to a corporate identity provider
  * Post-login navigation uses standard DOM elements (buttons, links, text)
  * Tests run in a single `dotnet test` invocation
* Success Criteria:
  * Selected auth approach keeps no sensitive data at rest on disk
  * Login happens once per test suite run, not per test
  * Tests are maintainable and extensible for future additions
  * Credentials sourced exclusively from `$env:APP_USERNAME` and `$env:APP_PASSWORD`

## Outline

1. Authentication strategy comparison (4 approaches)
2. Selected approach: Persistent context + ICollectionFixture (login-once, suite-wide)
3. Security analysis and risk matrix
4. Project structure and implementation plan
5. Complete code examples for both tests
6. Caveats and mitigations

## Research Executed

### File Analysis

* [PersistentBrowserTestBase.cs](../../../tests/playwright/RegressionTests/PersistentBrowserTestBase.cs)
  * Lines 1-103: Current base class uses `IAsyncLifetime` (per-method lifecycle), creates fresh browser per `[Fact]`
  * Uses `LaunchPersistentContextAsync` with GUID temp profile dirs
  * Best-effort cleanup in `DisposeAsync` — profile dir may persist on crash
  * Supports `HEADED` and `BROWSER_CHANNEL` env vars
  * **Gap:** Per-method lifecycle = login every test. Needs upgrade to `ICollectionFixture` for login-once

* [MacPaintTestBase.cs](../../../tests/playwright/MacPaintTool.Tests/MacPaintTestBase.cs)
  * Lines 1-100: Uses `PageTest` (ephemeral, Playwright.Xunit managed)
  * No auth needed (localhost canvas app)
  * Not applicable to SSO authentication scenarios

* [RegressionTests.csproj](../../../tests/playwright/RegressionTests/RegressionTests.csproj)
  * Uses `Microsoft.Playwright` 1.58.0 (core, no xUnit adapter)
  * xUnit 2.9.3, .NET 10.0
  * Does NOT reference `Microsoft.Playwright.Xunit` — lifecycle is fully manual

* [playwright-dotnet-conversion SKILL.md](../../../.github/skills/playwright-dotnet-conversion/SKILL.md)
  * Documents both ephemeral and persistent patterns
  * Credentials policy: never hardcode, use `Environment.GetEnvironmentVariable()`
  * Documents `PersistentBrowserTestBase` for SSO sites

* [playwright-automation-msedge SKILL.md](../../../.github/skills/playwright-automation-msedge/SKILL.md)
  * CLI-based Edge automation skill
  * Documents SSO pitfalls: persistent profile required for cross-origin redirects
  * Credentials policy: use `$env:APP_USERNAME` / `$env:APP_PASSWORD`

### Code Search Results

* Error text "Sso Login Unsuccessful" — provided by user as a failure indicator on the target site. This confirms SSO involvement even though a direct login form is visible.

### Project Conventions

* Standards referenced: Conventional commits (past-tense), tool interface pattern, IPC pattern
* Instructions followed: Credentials policy (never hardcode), persistent context for SSO sites, browser channel parameterization

## Key Discoveries

### Critical Finding: SSO Is Confirmed

The user described the login error text as "Sso Login Unsuccessful". This is decisive evidence that the site uses SSO authentication — the form on the page is a credential-collection proxy that submits to a corporate identity provider (likely PingFederate or Azure AD, consistent with Pfizer's corporate infrastructure). An ephemeral/in-memory browser context **will fail** during the SSO redirect chain.

### The Per-Test-Run Session Sharing Question

The user asked: "how does [suite-wide internally storing] work? We want to follow best practice for security."

**Answer:** xUnit's `ICollectionFixture<T>` pattern creates a single fixture instance shared across all test classes in a named collection. Combined with `IAsyncLifetime`, the fixture can:

1. Launch a browser and perform login in `InitializeAsync()` (runs once before any test)
2. Expose the authenticated `IBrowserContext` to all test classes via constructor injection
3. Close and clean up in `DisposeAsync()` (runs once after all tests complete)

**All session state lives in the browser process memory + a managed temp profile directory.** No explicit auth state export (no `StorageStateAsync()` JSON files). The profile directory is cleaned up on disposal, and its path is GUID-randomized.

### Implementation Patterns

**xUnit Collection Fixture Lifecycle:**

```text
┌─────────────────────────────────────────────────────┐
│  DocIntegrationFixture (IAsyncLifetime)              │
│                                                     │
│  InitializeAsync():                                 │
│    1. Create Playwright instance                    │
│    2. Launch browser (msedge or chromium channel)   │
│    3. Create persistent context (GUID temp dir)     │
│    4. Navigate to login URL                         │
│    5. Fill credentials from env vars                │
│    6. Click login, wait for success (30s timeout)   │
│    7. Store Context + Page as properties            │
│                                                     │
│  DisposeAsync():                                    │
│    1. Close browser context                         │
│    2. Dispose Playwright instance                   │
│    3. Delete temp profile directory                 │
│                                                     │
│  Properties:                                        │
│    IBrowserContext Context { get; }                  │
│    IPage Page { get; }                              │
└────────┬────────────────────────────┬───────────────┘
         │ constructor injection      │
    ┌────▼─────────┐           ┌──────▼──────┐
    │ LoginTests   │ sequential│ Navigation  │
    │ (Test 1)     │──────────►│ Tests       │
    └──────────────┘           │ (Test 2+)   │
                               └─────────────┘
```

### Complete Examples

#### Collection Fixture (Login-Once Pattern)

```csharp
using Microsoft.Playwright;

namespace DocIntegrationTests;

/// <summary>
/// Shared fixture that authenticates once to doc-integration.pfizer.com
/// and provides the session to all test classes in the collection.
/// Uses persistent context to survive SSO cross-origin redirects.
/// Profile directory is GUID-randomized and cleaned up on disposal.
/// </summary>
public class DocIntegrationFixture : IAsyncLifetime
{
    private IPlaywright _playwright = null!;
    private string _profileDir = null!;

    public IBrowserContext Context { get; private set; } = null!;
    public IPage Page { get; private set; } = null!;

    protected virtual int ViewportWidth => 1400;
    protected virtual int ViewportHeight => 900;

    public async Task InitializeAsync()
    {
        var username = Environment.GetEnvironmentVariable("APP_USERNAME")
            ?? throw new InvalidOperationException("APP_USERNAME env var must be set");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD")
            ?? throw new InvalidOperationException("APP_PASSWORD env var must be set");

        _profileDir = Path.Combine(Path.GetTempPath(), $"pw-docint-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_profileDir);

        _playwright = await Playwright.CreateAsync();

        var channel = Environment.GetEnvironmentVariable("BROWSER_CHANNEL") ?? "msedge";
        var headed = Environment.GetEnvironmentVariable("HEADED") == "1";

        Context = await _playwright.Chromium.LaunchPersistentContextAsync(_profileDir, new()
        {
            Channel = channel,
            Headless = !headed,
            ViewportSize = new ViewportSize { Width = ViewportWidth, Height = ViewportHeight },
            AcceptDownloads = true
        });

        Page = Context.Pages.Count > 0 ? Context.Pages[0] : await Context.NewPageAsync();

        // Navigate and authenticate
        await Page.GotoAsync("https://doc-integration.pfizer.com/");

        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Username" })
            .FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Password" })
            .FillAsync(password);

        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "Log In", Exact = true });
        await Expect(loginButton).ToBeEnabledAsync(new() { Timeout = 10_000 });
        await loginButton.ClickAsync();

        // Wait for login to complete (up to 30s for SSO redirect chain)
        await Page.WaitForFunctionAsync(
            "() => !document.body.innerText.includes('Enter Username')",
            null,
            new() { Timeout = 30_000 });

        // Verify no SSO error
        var errorLocator = Page.GetByText("Sso Login Unsuccessful");
        await Expect(errorLocator).Not.ToBeVisibleAsync(new() { Timeout = 5_000 });
    }

    public async Task DisposeAsync()
    {
        try { await Context.CloseAsync(); } catch { }
        _playwright.Dispose();
        try
        {
            if (Directory.Exists(_profileDir))
                Directory.Delete(_profileDir, recursive: true);
        }
        catch { /* Best-effort cleanup */ }
    }

    protected static ILocatorAssertions Expect(ILocator locator) =>
        Assertions.Expect(locator);

    protected static IPageAssertions Expect(IPage page) =>
        Assertions.Expect(page);
}
```

#### Collection Definition

```csharp
namespace DocIntegrationTests;

[CollectionDefinition("DocIntegration")]
public class DocIntegrationCollection : ICollectionFixture<DocIntegrationFixture>
{
    // Marker class. Associates "DocIntegration" name with the fixture.
}
```

#### Test 1: Login Success

```csharp
using Microsoft.Playwright;

namespace DocIntegrationTests;

[Collection("DocIntegration")]
public class LoginTests
{
    private readonly DocIntegrationFixture _session;

    public LoginTests(DocIntegrationFixture session) => _session = session;

    [Fact]
    public async Task Login_Succeeds_WithValidCredentials()
    {
        // Fixture already authenticated — verify post-login state
        var homeButton = _session.Page.GetByRole(AriaRole.Button, new() { Name = "Home" });
        await Assertions.Expect(homeButton).ToBeVisibleAsync();

        var actionsButton = _session.Page.GetByRole(AriaRole.Button, new() { Name = "Actions" });
        await Assertions.Expect(actionsButton).ToBeVisibleAsync();

        // Verify no error text
        await Assertions.Expect(_session.Page.GetByText("Sso Login Unsuccessful")).Not.ToBeVisibleAsync();
        await Assertions.Expect(_session.Page.GetByText("Invalid credentials")).Not.ToBeVisibleAsync();

        // Save screenshot
        await _session.Page.ScreenshotAsync(new() { Path = "login.png" });
    }
}
```

#### Test 2: Navigate and Check Top Priorities

```csharp
using Microsoft.Playwright;

namespace DocIntegrationTests;

[Collection("DocIntegration")]
public class TopPrioritiesTests
{
    private readonly DocIntegrationFixture _session;

    public TopPrioritiesTests(DocIntegrationFixture session) => _session = session;

    [Fact]
    public async Task TopPriorities_ShowsExpectedItems()
    {
        // Navigate through the hierarchy
        await _session.Page.GetByText("Global Tech Eng").ClickAsync();
        await _session.Page.GetByText("Clinical Manufacturing Supply Operations").ClickAsync();
        await _session.Page.GetByText("Clinical Supply Puurs").ClickAsync();

        await _session.Page.GetByRole(AriaRole.Button, new() { Name = "Apply" }).ClickAsync();

        // Wait for content to load
        await _session.Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Check for Top Priorities section
        var topPriorities = _session.Page.GetByText("Top Priorities");
        await Assertions.Expect(topPriorities).ToBeVisibleAsync(new() { Timeout = 10_000 });

        // Verify expected priority items
        await Assertions.Expect(_session.Page.GetByText("M2 MF RFT project follow up"))
            .ToBeVisibleAsync();
        await Assertions.Expect(_session.Page.GetByText("Budget overview S2F2 + PO's"))
            .ToBeVisibleAsync();
        await Assertions.Expect(_session.Page.GetByText("mRNA never frozen syringe plan"))
            .ToBeVisibleAsync();
    }
}
```

## Technical Scenarios

### Scenario 1: Suite-Wide Session via ICollectionFixture (Persistent Context)

**Selected Approach**

This approach uses xUnit's `ICollectionFixture<T>` to create a single `DocIntegrationFixture` instance that is shared across all test classes tagged with `[Collection("DocIntegration")]`.

**Requirements:**

* Login once per `dotnet test` invocation
* Share session across multiple test classes
* Handle SSO cross-origin redirects
* No explicit auth state export to disk (no `StorageStateAsync` JSON files)
* Clean up browser profile directory on completion

**File tree changes:**

```text
tests/playwright/DocIntegrationTests/
├── DocIntegrationTests.csproj
├── DocIntegrationFixture.cs        # IAsyncLifetime + login + cleanup
├── DocIntegrationCollection.cs     # [CollectionDefinition] marker
├── LoginTests.cs                   # Test 1: Login verification
└── TopPrioritiesTests.cs           # Test 2: Navigation + priority check
```

**How it works internally:**

1. xUnit discovers all classes decorated with `[Collection("DocIntegration")]`
2. Before the first test, xUnit instantiates `DocIntegrationFixture` and calls `InitializeAsync()`
3. `InitializeAsync()` launches a browser with a persistent context (GUID temp profile dir), navigates to the login URL, fills credentials from env vars, clicks Login, waits for success
4. All test classes receive the fixture via constructor injection — they share the same authenticated `Page` and `Context`
5. Test classes run **sequentially** within the collection (xUnit design — prevents race conditions on shared browser)
6. After all tests complete, xUnit calls `DisposeAsync()` which closes the browser and deletes the temp profile directory
7. On process crash: browser process dies, OS reclaims memory. The temp profile directory persists but contains only auto-generated Chromium profile data (cookies in SQLite, not plaintext JSON). The GUID-randomized path prevents predictable access.

**Security properties:**

| Property | Value |
| --- | --- |
| Credentials on disk? | Never — read from env vars, passed to `FillAsync()`, transmitted over TLS |
| Storage state JSON files? | Never created — no `StorageStateAsync()` calls |
| Auth tokens on disk? | In Chromium profile dir as SQLite cookies DB (binary, not plaintext) |
| Profile dir path predictable? | No — GUID-randomized in `%TEMP%` |
| Cleanup on normal exit? | Yes — `Directory.Delete(profileDir, recursive: true)` |
| Cleanup on crash? | No — temp dir persists (same behavior as browser crash dumps) |
| CI ephemeral runner safety? | Safe — VM destroyed after job |
| CI self-hosted runner safety? | Add cleanup step to remove orphaned `pw-docint-*` dirs from `%TEMP%` |

**Implementation Details:**

The persistent context is required because the site uses SSO (evidenced by "Sso Login Unsuccessful" error text). SSO involves cross-origin redirects that destroy ephemeral in-memory contexts. The persistent context survives these redirects because cookies are stored in the browser's user data directory, which is maintained across navigations.

The `ICollectionFixture` lifecycle ensures the fixture outlives all test classes in the collection. Unlike `IAsyncLifetime` on the test class itself (which creates a new instance per `[Fact]` method), the collection fixture persists for the entire collection run.

#### Considered Alternatives

**Alternative A: In-Memory Ephemeral Context + ICollectionFixture**

* Uses `Browser.NewContextAsync()` instead of `LaunchPersistentContextAsync`
* Most secure — no data on disk at all
* **Rejected:** Will fail for SSO sites. Cross-origin redirects during login destroy the in-memory context. The "Sso Login Unsuccessful" error text confirms SSO is involved.

**Alternative B: Storage State File**

* After login, export cookies/localStorage to a JSON file via `StorageStateAsync()`
* Subsequent tests load the file via `StorageStatePath`
* **Rejected:** Writes all auth tokens (cookies, JWTs, CSRF tokens) as plaintext JSON to disk. No automatic cleanup. Risk of accidental commit. Risk of persistence on self-hosted CI runners. Worst security profile of all options. The user explicitly expressed concern about storing state files.

**Alternative C: Per-Test Login (Current PersistentBrowserTestBase Pattern)**

* Login in each test's `IAsyncLifetime.InitializeAsync()`
* Each test gets its own browser instance
* **Rejected:** User explicitly requested not logging in every test. Also slower — each test incurs full browser launch + login delay.

**Alternative D: Auth Header Injection**

* Manually obtain a token and inject via `Context.SetExtraHTTPHeadersAsync()`
* **Rejected:** Requires knowledge of the site's auth token format and API. Not applicable to SSO-redirecting web applications where auth is cookie-based after the redirect flow.

## Security Risk Assessment Matrix

| Approach | Credentials disk? | Session state disk? | Plaintext? | Auto-cleanup? | Crash-safe? | SSO-compatible? | Risk Level |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A. Ephemeral + ICollectionFixture** | No | No | N/A | Yes | Yes | **No** | Lowest |
| **B. Storage State File** | No | **Yes** | **Yes (JSON)** | No | **No** | Yes | **Highest** |
| **C. Persistent + ICollectionFixture** ✅ | No | Yes (profile dir) | No (SQLite) | Yes | No (GUID dir persists) | **Yes** | **Low-Moderate** |
| **D. Per-test login (current)** | No | Yes (profile dir) | No (SQLite) | Yes | No | Yes | Moderate |

## Potential Next Research

* Verify exact selectors on the live site using the existing `playwright-automation-msedge` skill via headed browser
  * Reasoning: Selectors for navigation items (Global Tech Eng, etc.) need validation against actual DOM
  * Reference: User instructions describe button/text names but actual DOM may differ

* Investigate session timeout duration on doc-integration.pfizer.com
  * Reasoning: If session expires quickly, long test suites may need re-authentication logic
  * Reference: Corporate SSO sessions typically last 30-60 minutes

* Research parallel test execution with new pages from shared context
  * Reasoning: If test suite grows large, sequential execution may be too slow
  * Reference: `Context.NewPageAsync()` creates pages that inherit cookies — enables parallel within a collection if thread safety is managed

## Summary

The **Persistent Context + ICollectionFixture** approach is the recommended strategy. It satisfies all requirements:

1. **Login-once:** The fixture authenticates once in `InitializeAsync()`, shared across all test classes
2. **SSO-compatible:** Persistent context survives the cross-origin SSO redirect chain
3. **Secure:** No plaintext auth state files. Credentials never written to disk. Profile directory is GUID-randomized, binary-format, and cleaned up on disposal
4. **Extensible:** New test classes simply add `[Collection("DocIntegration")]` and inject the fixture
5. **Parameterized browser:** Supports Edge or Chromium via `BROWSER_CHANNEL` env var
