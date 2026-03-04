# Playwright .NET Authentication and Session Reuse — Security Research

> **Date:** 2026-03-04
> **Scope:** Playwright .NET (xUnit), auth reuse strategies, security best practices
> **Workspace context:** `mac-paint-tool` — Electron app with two Playwright test projects

---

## Table of Contents

1. [Playwright's Built-in Auth Reuse Mechanisms](#topic-1-playwrights-built-in-auth-reuse-mechanisms)
2. [Security Analysis of Each Approach](#topic-2-security-analysis-of-each-approach)
3. [Best Practices for Secure Auth in Playwright .NET Tests](#topic-3-best-practices-for-secure-auth-in-playwright-net-tests)
4. [xUnit Fixture Patterns for Session Sharing](#topic-4-xunit-fixture-patterns-for-session-sharing)
5. [Existing Codebase Patterns](#existing-codebase-patterns)
6. [Security Risk Assessment Matrix](#security-risk-assessment-matrix)
7. [Recommendations](#recommendations)

---

## Topic 1: Playwright's Built-in Auth Reuse Mechanisms

### 1.1 Storage State (`storageState`)

#### How It Works

Playwright captures and restores browser authentication state through `StorageStateAsync()` and the `StorageStatePath` option on context creation.

**Saving state:**

```csharp
// After login completes, serialize the entire auth state to a JSON file
var stateJson = await context.StorageStateAsync(new()
{
    Path = "auth-state.json"
});
```

**Loading state:**

```csharp
// Create a new context pre-loaded with saved auth state
var context = await browser.NewContextAsync(new()
{
    StorageStatePath = "auth-state.json"
});
```

#### What Data Is Stored

The storage state JSON file contains:

| Data type | Included | Notes |
| --- | --- | --- |
| **Cookies** | Yes | All cookies for all domains — including `HttpOnly`, `Secure`, session cookies, auth tokens |
| **localStorage** | Yes | Per-origin key-value pairs — may contain JWTs, CSRF tokens, user preferences |
| **sessionStorage** | **No** | Not included — `sessionStorage` is ephemeral and not serializable by Playwright |
| **IndexedDB** | **No** | Not included |
| **Cache API** | **No** | Not included |

**Example storage state JSON structure:**

```json
{
  "cookies": [
    {
      "name": ".AspNetCore.Identity.Application",
      "value": "CfDJ8N...long-base64-auth-cookie...",
      "domain": "example.com",
      "path": "/",
      "expires": 1741305600,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://example.com",
      "localStorage": [
        {
          "name": "access_token",
          "value": "eyJhbGciOiJSUzI1NiIs..."
        }
      ]
    }
  ]
}
```

#### Security Implications of the State File

- The file contains **plaintext auth tokens and session cookies** — anyone with access to the file can impersonate the authenticated user
- Cookie values include `HttpOnly` cookies that are normally inaccessible to JavaScript — Playwright bypasses this browser protection
- JWT access tokens in localStorage are fully readable
- The file persists on disk after the test run unless explicitly deleted
- If committed to source control, credentials are leaked permanently in git history

#### Setup Project Pattern — xUnit/.NET Availability

**Important finding:** Playwright's "setup project" pattern (where a dedicated project runs login and saves state for other projects to load) is **primarily designed for the Node.js test runner** (`@playwright/test`). The `projects` and `dependencies` configuration in `playwright.config.ts` are Node.js-only concepts.

In .NET, there is **no direct equivalent** of the setup project pattern in the Playwright test runner. The `Microsoft.Playwright.NUnit` package provides `SetUp`/`OneTimeSetUp` attributes for NUnit, and `Microsoft.Playwright.MSTest` provides `[ClassInitialize]` for MSTest — but these are framework-specific, not Playwright-orchestrated.

**For xUnit (.NET), the setup project pattern must be manually implemented** using:

- `IClassFixture<T>` — shared setup within a single test class
- `ICollectionFixture<T>` — shared setup across multiple test classes
- `IAsyncLifetime` — async initialization and teardown

There is no Playwright-provided mechanism in the xUnit adapter (`Microsoft.Playwright.Xunit`) that orchestrates cross-project dependencies. The `PageTest` base class creates a fresh context per test method — it does not support pre-loading storage state from a setup phase.

### 1.2 Persistent Browser Context

#### How `LaunchPersistentContextAsync` Works

Instead of creating an ephemeral in-memory browser context, `LaunchPersistentContextAsync` launches a browser with a real user-data directory on disk:

```csharp
var profileDir = Path.Combine(Path.GetTempPath(), $"pw-profile-{Guid.NewGuid():N}");
Directory.CreateDirectory(profileDir);

var context = await browserType.LaunchPersistentContextAsync(profileDir, new()
{
    Channel = "msedge",
    Headless = true,
    ViewportSize = new ViewportSize { Width = 1400, Height = 900 }
});
```

#### How Session Persistence Works

The browser writes its full profile to the user-data directory, including:

| Data | Location within profile dir | Persists after context close? |
| --- | --- | --- |
| Cookies (including session cookies) | `Default/Cookies` (SQLite) | Yes (except session-only cookies) |
| localStorage | `Default/Local Storage/leveldb/` | Yes |
| sessionStorage | In-memory only | No |
| IndexedDB | `Default/IndexedDB/` | Yes |
| Cache | `Default/Cache/` | Yes |
| Service Workers | `Default/Service Worker/` | Yes |
| Saved passwords | `Default/Login Data` (SQLite) | Yes |

This is identical to how Chrome/Edge stores data in a real user profile. The directory is a full Chromium profile directory.

#### Sharing Persistent Context Across Test Methods in One Class

With `IAsyncLifetime`, the persistent context is created once per class instance. Since xUnit creates a new class instance per `[Fact]` method by default, a persistent context using `IAsyncLifetime` alone **creates a new browser per test method**:

```csharp
// This creates a NEW browser + profile for EACH [Fact] method
public class MyTests : IAsyncLifetime
{
    public async Task InitializeAsync() { /* launch browser */ }
    public async Task DisposeAsync() { /* close browser */ }

    [Fact] public async Task Test1() { /* gets its own browser */ }
    [Fact] public async Task Test2() { /* gets its own browser */ }
}
```

To share a persistent context across all `[Fact]` methods in a class, use `IClassFixture<T>`:

```csharp
public class BrowserFixture : IAsyncLifetime
{
    public IBrowserContext Context { get; private set; } = null!;
    public IPage Page { get; private set; } = null!;
    private IPlaywright _playwright = null!;
    private string _profileDir = null!;

    public async Task InitializeAsync()
    {
        _profileDir = Path.Combine(Path.GetTempPath(), $"pw-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_profileDir);
        _playwright = await Playwright.CreateAsync();
        Context = await _playwright.Chromium.LaunchPersistentContextAsync(_profileDir, new()
        {
            Channel = "msedge",
            Headless = true
        });
        Page = Context.Pages.Count > 0 ? Context.Pages[0] : await Context.NewPageAsync();
    }

    public async Task DisposeAsync()
    {
        await Context.CloseAsync();
        _playwright.Dispose();
        try { Directory.Delete(_profileDir, true); } catch { }
    }
}

public class MyTests : IClassFixture<BrowserFixture>
{
    private readonly BrowserFixture _browser;
    public MyTests(BrowserFixture browser) => _browser = browser;

    [Fact]
    public async Task Test1() => await _browser.Page.GotoAsync("https://example.com");

    [Fact]
    public async Task Test2() => await _browser.Page.GotoAsync("https://example.com/dashboard");
}
```

#### Can Multiple Test Classes Share the Same Persistent Context?

Yes, using `ICollectionFixture<T>`:

```csharp
[CollectionDefinition("AuthBrowser")]
public class AuthBrowserCollection : ICollectionFixture<BrowserFixture> { }

[Collection("AuthBrowser")]
public class DashboardTests
{
    private readonly BrowserFixture _browser;
    public DashboardTests(BrowserFixture browser) => _browser = browser;

    [Fact]
    public async Task Dashboard_ShowsUserName() { /* ... */ }
}

[Collection("AuthBrowser")]
public class SettingsTests
{
    private readonly BrowserFixture _browser;
    public SettingsTests(BrowserFixture browser) => _browser = browser;

    [Fact]
    public async Task Settings_ShowsProfile() { /* ... */ }
}
```

**Critical constraint:** All test classes in the same `[Collection]` run **sequentially** (not in parallel). This is by xUnit design — collection fixtures are not thread-safe by default, and sharing a browser context across parallel tests would cause race conditions.

### 1.3 Per-Test-Class Session (`IAsyncLifetime` / `IClassFixture`)

#### `IAsyncLifetime` — Per-Instance Lifecycle

`IAsyncLifetime` provides `InitializeAsync()` and `DisposeAsync()` on the test class itself. Since xUnit creates a new instance per test method, this means:

- Each `[Fact]` gets its own `InitializeAsync()` → run test → `DisposeAsync()` cycle
- The browser is launched and closed for every test method
- Session state does NOT persist between test methods

This is the pattern used by the existing `PersistentBrowserTestBase` in this workspace.

#### `IClassFixture<T>` — Per-Class Sharing

The fixture `T` is created once and shared across all `[Fact]` methods in the class:

- `T.InitializeAsync()` runs once before all tests in the class
- The fixture instance is injected via constructor
- `T.DisposeAsync()` runs once after all tests in the class complete
- Tests within the class run **sequentially** against the shared fixture

**Login-once pattern:**

```csharp
public class AuthFixture : IAsyncLifetime
{
    public IPage Page { get; private set; } = null!;
    // ... browser setup ...

    public async Task InitializeAsync()
    {
        // Launch browser, navigate to login page, authenticate
        // Page is now authenticated for all tests
    }

    public async Task DisposeAsync()
    {
        // Close browser, clean up profile
    }
}

public class ProtectedPageTests : IClassFixture<AuthFixture>
{
    private readonly AuthFixture _auth;
    public ProtectedPageTests(AuthFixture auth) => _auth = auth;

    [Fact]
    public async Task CanAccessDashboard()
    {
        await _auth.Page.GotoAsync("https://app.example.com/dashboard");
        // Session cookie from login is still active
    }
}
```

#### `ICollectionFixture<T>` — Suite-Wide Sharing

For sharing a single authenticated browser session across **multiple test classes**:

```csharp
// 1. Define the collection with the fixture
[CollectionDefinition("Authenticated")]
public class AuthenticatedCollection : ICollectionFixture<AuthFixture> { }

// 2. Tag test classes with the collection
[Collection("Authenticated")]
public class DashboardTests { /* injected AuthFixture via ctor */ }

[Collection("Authenticated")]
public class ReportsTests { /* same AuthFixture instance */ }

[Collection("Authenticated")]
public class AdminTests { /* same AuthFixture instance */ }
```

**Lifecycle:**

1. `AuthFixture.InitializeAsync()` runs once before any test in the collection
2. All `[Collection("Authenticated")]` test classes share the same `AuthFixture` instance
3. Tests across classes in the collection run sequentially (xUnit serializes collection members)
4. `AuthFixture.DisposeAsync()` runs once after all tests in the collection finish

---

## Topic 2: Security Analysis of Each Approach

### Approach A: In-Memory Only (`IClassFixture` / `ICollectionFixture`)

**How it works:** A browser is launched (either ephemeral context via `NewContextAsync` or persistent context via `LaunchPersistentContextAsync`), login is performed interactively in the browser, and the context reference is shared across tests via fixture injection. No explicit export of auth state to disk.

#### Security Assessment

| Factor | Assessment |
| --- | --- |
| **Where are credentials used?** | Typed into browser fields during login — credentials exist in memory only during the login interaction |
| **Where is session state stored?** | **Ephemeral context:** In-memory only — no disk writes. **Persistent context:** Written to the profile directory on disk (SQLite cookies DB, localStorage LevelDB) |
| **What sensitive data is at rest?** | **Ephemeral:** None — all state is in browser process memory. **Persistent:** Cookies, localStorage, IndexedDB, cache in the profile directory |
| **Cleanup guarantees** | **Ephemeral:** Automatic — data is in process memory, gone when process exits. **Persistent:** Must explicitly `Directory.Delete(profileDir, true)` in `DisposeAsync`. On crash, profile dir persists in temp directory |
| **CI/CD safety** | **Ephemeral on ephemeral runner:** Safe — VM is destroyed after job. **Persistent on self-hosted runner:** Risk — temp profile dirs may accumulate if cleanup fails |
| **Risk of state leakage between runs** | **Ephemeral:** None. **Persistent:** Low if GUID-based profile dirs are used and cleanup runs. Medium if cleanup fails |

**Key insight:** The term "in-memory only" is only accurate for ephemeral contexts created via `Browser.NewContextAsync()`. If using `LaunchPersistentContextAsync`, cookies and localStorage **are written to disk** even though no explicit `StorageStateAsync()` call is made.

#### Truly In-Memory Approach

```csharp
public class InMemoryAuthFixture : IAsyncLifetime
{
    private IPlaywright _playwright = null!;
    private IBrowser _browser = null!;
    public IBrowserContext Context { get; private set; } = null!;
    public IPage Page { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        _playwright = await Playwright.CreateAsync();
        _browser = await _playwright.Chromium.LaunchAsync(new()
        {
            Channel = "msedge",
            Headless = true
        });

        // Ephemeral context — state stays in memory only
        Context = await _browser.NewContextAsync(new()
        {
            ViewportSize = new ViewportSize { Width = 1400, Height = 900 }
        });
        Page = await Context.NewPageAsync();

        // Login interactively — session cookies stay in memory
        await PerformLoginAsync();
    }

    private async Task PerformLoginAsync()
    {
        var username = Environment.GetEnvironmentVariable("APP_USERNAME")
            ?? throw new InvalidOperationException("APP_USERNAME env var must be set");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD")
            ?? throw new InvalidOperationException("APP_PASSWORD env var must be set");

        await Page.GotoAsync("https://example.com/login");
        await Page.GetByLabel("Username").FillAsync(username);
        await Page.GetByLabel("Password").FillAsync(password);
        await Page.GetByRole(AriaRole.Button, new() { Name = "Log In" }).ClickAsync();
        await Page.WaitForURLAsync(url => !url.Contains("/login"), new() { Timeout = 30_000 });
    }

    public async Task DisposeAsync()
    {
        await Context.CloseAsync();
        await _browser.CloseAsync();
        _playwright.Dispose();
        // No disk cleanup needed — nothing was written to disk
    }
}
```

**Limitation:** This approach **fails for SSO/OAuth sites** that perform cross-origin redirects. The ephemeral context may lose cookies when navigating across domains during the OAuth flow, causing `Target page, context or browser has been closed` errors. This is the exact reason the `PersistentBrowserTestBase` pattern exists in this workspace.

### Approach B: Storage State File

**How it works:** After login, `StorageStateAsync()` serializes cookies and localStorage to a JSON file. Subsequent tests load this file via `StorageStatePath` to skip login.

#### Security Assessment

| Factor | Assessment |
| --- | --- |
| **Where are credentials used?** | In the setup test that performs login — memory only during login |
| **Where is session state stored?** | **On disk** in a JSON file at a known path |
| **What sensitive data is at rest?** | All cookies (including `HttpOnly` auth cookies), all localStorage entries (including JWTs, CSRF tokens) — all in **plaintext JSON** |
| **Cleanup guarantees** | **None by default.** The JSON file persists until explicitly deleted. No automatic cleanup mechanism |
| **CI/CD safety** | **High risk on self-hosted runners** — the auth state file persists between runs. Safe on ephemeral runners if the file is within the workspace |
| **Risk of state leakage between runs** | **High** — if the file is written to a fixed path and not cleaned up, subsequent runs may reuse stale or another user's auth tokens |

**Example of what leaks:**

```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123-sensitive-session-token",
      "domain": ".example.com",
      "httpOnly": true,
      "secure": true
    }
  ],
  "origins": [
    {
      "origin": "https://example.com",
      "localStorage": [
        { "name": "id_token", "value": "eyJhbGciOiJSUzI1NiIs..." },
        { "name": "refresh_token", "value": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..." }
      ]
    }
  ]
}
```

**Mitigations:**

```csharp
// Write to temp with restrictive cleanup
var stateFile = Path.Combine(Path.GetTempPath(), $"pw-state-{Guid.NewGuid():N}.json");
try
{
    await context.StorageStateAsync(new() { Path = stateFile });
    // ... use stateFile for subsequent contexts ...
}
finally
{
    if (File.Exists(stateFile)) File.Delete(stateFile);
}
```

### Approach C: Persistent Browser Context

**How it works:** `LaunchPersistentContextAsync` creates a browser with a real user-data directory. All browser data (cookies, localStorage, cache, etc.) is written to this directory just like a regular Chrome/Edge profile.

#### Security Assessment

| Factor | Assessment |
| --- | --- |
| **Where are credentials used?** | Typed into browser during login — memory only during interaction |
| **Where is session state stored?** | On disk in the user-data directory — multiple files (SQLite DBs, LevelDB, cache files) |
| **What sensitive data is at rest?** | Cookies (SQLite), localStorage (LevelDB), cached responses, service worker data, potentially saved passwords — **all on disk** |
| **Cleanup guarantees** | Must explicitly delete the profile directory in `DisposeAsync`. The existing `PersistentBrowserTestBase` does this with best-effort error handling |
| **CI/CD safety** | Moderate risk — profile dirs in temp may persist on crash. GUID-based naming prevents cross-run conflicts |
| **Risk of state leakage between runs** | Low if GUID-based dirs are used. Each test run gets a fresh `Guid.NewGuid()` directory |

**Current codebase pattern** (from `PersistentBrowserTestBase.cs`):

```csharp
// Setup — unique profile per test instance
_profileDir = Path.Combine(Path.GetTempPath(), $"pw-profile-{Guid.NewGuid():N}");

// Teardown — best-effort cleanup
public async Task DisposeAsync()
{
    await _context.CloseAsync();
    _playwright.Dispose();
    try
    {
        if (Directory.Exists(_profileDir))
            Directory.Delete(_profileDir, recursive: true);
    }
    catch { /* Best-effort — profile dir may be locked briefly */ }
}
```

**Key difference from storage state:** The data format is binary (SQLite, LevelDB) rather than plaintext JSON, making casual inspection harder — but this is **security by obscurity**, not a real protection. The data is equally sensitive.

### Approach D: Setup Project Pattern

**How it works:** In Node.js Playwright, a "setup" project runs a test that performs login and saves storage state. Other projects declare a dependency on the setup project and load the saved state. This is Playwright's official recommendation for Node.js.

#### .NET Availability

| Framework | Setup project equivalent | Mechanism |
| --- | --- | --- |
| **Node.js (`@playwright/test`)** | Native `projects` + `dependencies` in `playwright.config.ts` | Built-in to test runner |
| **NUnit (.NET)** | `[OneTimeSetUp]` attribute in a base class | NUnit lifecycle, not Playwright-orchestrated |
| **MSTest (.NET)** | `[ClassInitialize]` / `[AssemblyInitialize]` | MSTest lifecycle |
| **xUnit (.NET)** | `IClassFixture<T>` / `ICollectionFixture<T>` | xUnit fixture model |

**There is no Playwright-native setup project pattern for .NET.** The xUnit adapter (`Microsoft.Playwright.Xunit`) provides `PageTest` as a convenience base class but does not provide any mechanism for cross-project setup dependencies.

To simulate the setup project pattern in xUnit:

```csharp
// Option 1: Collection fixture that performs login and saves state
public class AuthSetupFixture : IAsyncLifetime
{
    public string StorageStatePath { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        StorageStatePath = Path.Combine(Path.GetTempPath(), $"pw-state-{Guid.NewGuid():N}.json");

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new() { Channel = "msedge" });
        var context = await browser.NewContextAsync();
        var page = await context.NewPageAsync();

        // Perform login
        await page.GotoAsync("https://example.com/login");
        await page.GetByLabel("Username").FillAsync(
            Environment.GetEnvironmentVariable("APP_USERNAME")!);
        await page.GetByLabel("Password").FillAsync(
            Environment.GetEnvironmentVariable("APP_PASSWORD")!);
        await page.GetByRole(AriaRole.Button, new() { Name = "Log In" }).ClickAsync();
        await page.WaitForURLAsync(url => !url.Contains("/login"));

        // Save state to file
        await context.StorageStateAsync(new() { Path = StorageStatePath });
    }

    public async Task DisposeAsync()
    {
        if (File.Exists(StorageStatePath)) File.Delete(StorageStatePath);
        await Task.CompletedTask;
    }
}

// Option 2: Tests load the state
[CollectionDefinition("AuthSetup")]
public class AuthSetupCollection : ICollectionFixture<AuthSetupFixture> { }

[Collection("AuthSetup")]
public class ProtectedApiTests : PageTest
{
    private readonly AuthSetupFixture _auth;
    public ProtectedApiTests(AuthSetupFixture auth) => _auth = auth;

    // NOTE: This has a problem — PageTest creates its own context
    // and doesn't support injecting StorageStatePath into it.
    // You'd need a custom base class instead of PageTest.
}
```

**Problem:** `PageTest` creates its own browser context internally. There is no way to inject `StorageStatePath` into `PageTest`'s context creation. To use storage state loading, you must manage the browser lifecycle manually (not use `PageTest`).

---

## Topic 3: Best Practices for Secure Auth in Playwright .NET Tests

### 3.1 Never Hardcode Credentials

```csharp
// WRONG — credentials in source code
await page.GetByLabel("Username").FillAsync("admin@company.com");
await page.GetByLabel("Password").FillAsync("P@ssw0rd123!");

// RIGHT — credentials from environment variables
var username = Environment.GetEnvironmentVariable("APP_USERNAME")
    ?? throw new InvalidOperationException("APP_USERNAME env var required");
var password = Environment.GetEnvironmentVariable("APP_PASSWORD")
    ?? throw new InvalidOperationException("APP_PASSWORD env var required");
await page.GetByLabel("Username").FillAsync(username);
await page.GetByLabel("Password").FillAsync(password);
```

### 3.2 Never Log Credentials

```csharp
// WRONG — credentials appear in test output
_output.WriteLine($"Logging in as {username} with password {password}");

// RIGHT — non-sensitive info only
_output.WriteLine($"Logging in as {username}");
```

### 3.3 Gitignore Auth State Files

Add to `.gitignore`:

```gitignore
# Playwright auth state files
**/auth-state.json
**/storage-state*.json
**/pw-state-*.json

# Persistent browser profiles (if not in temp)
**/pw-profile-*/
```

### 3.4 Clean Up Auth State Files

```csharp
public async Task DisposeAsync()
{
    // Close browser resources
    await _context.CloseAsync();
    _playwright.Dispose();

    // Delete storage state file
    if (File.Exists(_storageStatePath))
    {
        File.Delete(_storageStatePath);
    }

    // Delete persistent profile dir
    if (Directory.Exists(_profileDir))
    {
        try { Directory.Delete(_profileDir, recursive: true); }
        catch { /* Best-effort: dir may be locked */ }
    }
}
```

### 3.5 CI/CD Pipeline Considerations

| Runner type | Risk level | Mitigations |
| --- | --- | --- |
| **GitHub Actions (ephemeral)** | Low | VM is destroyed after each job — no persistent state leaks |
| **Azure DevOps hosted agents** | Low | Ephemeral VMs, cleaned between jobs |
| **Self-hosted runners** | **High** | Temp dirs persist. Must add explicit cleanup steps in pipeline |
| **Docker-based CI** | Low | Container is destroyed after each run |

**For self-hosted runners:**

```yaml
# GitHub Actions — cleanup step for self-hosted runners
- name: Clean up Playwright state
  if: always()
  run: |
    Remove-Item -Path "$env:TEMP\pw-profile-*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$env:TEMP\pw-state-*" -Force -ErrorAction SilentlyContinue
```

### 3.6 Environment Variable Best Practices

```yaml
# GitHub Actions — use secrets, not plaintext
- name: Run tests
  env:
    APP_USERNAME: ${{ secrets.APP_USERNAME }}
    APP_PASSWORD: ${{ secrets.APP_PASSWORD }}
  run: dotnet test ...
```

```powershell
# Local development — set in terminal, not in scripts
$env:APP_USERNAME = "test@example.com"
$env:APP_PASSWORD = "password"
dotnet test ...
```

Never put credentials in:

- `launchSettings.json` (committed to source)
- `.env` files (may be committed)
- Test code
- CI/CD workflow files (use secrets references)

### 3.7 Feasibility of In-Memory-Only Approaches

**In-memory ephemeral contexts are the most secure option** but have limitations:

| Scenario | In-memory feasible? | Why / why not |
| --- | --- | --- |
| Simple login form (same-origin) | Yes | No cross-origin redirects |
| OAuth/SSO (cross-origin redirects) | **No** | Ephemeral context may lose cookies during cross-origin navigation |
| Token-based API auth | Yes | Inject auth header via `context.SetExtraHTTPHeadersAsync()` |
| Certificate auth | Yes | Use `ClientCertificates` option on context |
| Multi-domain cookie auth | **Maybe** | Depends on third-party cookie blocking behavior |

**When in-memory is not feasible**, persistent context with GUID-based profile dirs and explicit cleanup is the next-best option.

---

## Topic 4: xUnit Fixture Patterns for Session Sharing

### 4.1 `IClassFixture<T>` — Per-Class Sharing

**Lifecycle:**

1. xUnit creates one instance of `T` per test class
2. If `T : IAsyncLifetime`, `InitializeAsync()` runs before any test in the class
3. `T` is injected into each test class instance via constructor
4. After all tests in the class complete, `DisposeAsync()` runs

**Key behavior:** xUnit creates a **new test class instance per `[Fact]` method**, but the fixture `T` is shared. The fixture is injected into each new class instance.

```csharp
public class BrowserFixture : IAsyncLifetime
{
    public IBrowserContext Context { get; private set; } = null!;
    public IPage Page { get; private set; } = null!;
    private IPlaywright _pw = null!;
    private IBrowser _browser = null!;

    public async Task InitializeAsync()
    {
        _pw = await Playwright.CreateAsync();
        _browser = await _pw.Chromium.LaunchAsync(new() { Headless = true });
        Context = await _browser.NewContextAsync();
        Page = await Context.NewPageAsync();
        // Login once here — session is reused for all tests
    }

    public async Task DisposeAsync()
    {
        await Context.CloseAsync();
        await _browser.CloseAsync();
        _pw.Dispose();
    }
}

public class AdminPageTests : IClassFixture<BrowserFixture>
{
    private readonly IPage _page;

    public AdminPageTests(BrowserFixture fixture)
    {
        _page = fixture.Page;
    }

    [Fact]
    public async Task ShowsAdminPanel() { /* _page is authenticated */ }

    [Fact]
    public async Task CanEditSettings() { /* same browser, same session */ }
}
```

### 4.2 `ICollectionFixture<T>` — Cross-Class Sharing (Suite-Wide)

**Lifecycle:**

1. Define a collection via `[CollectionDefinition("name")]` on a class implementing `ICollectionFixture<T>`
2. Tag test classes with `[Collection("name")]`
3. `T.InitializeAsync()` runs **once** before any test in any class in the collection
4. All classes share the same fixture instance
5. `T.DisposeAsync()` runs **once** after all tests in all classes complete

**Critical: Sequential execution.** All test classes in the same collection run **sequentially**, not in parallel. This is xUnit's way of preventing thread-safety issues with shared state.

```csharp
// 1. Define fixture
public class SuiteAuthFixture : IAsyncLifetime
{
    public IPage AuthenticatedPage { get; private set; } = null!;
    // ... launch browser, login ...
    public async Task InitializeAsync() { /* login once */ }
    public async Task DisposeAsync() { /* cleanup */ }
}

// 2. Define collection
[CollectionDefinition("AuthSuite")]
public class AuthSuiteCollection : ICollectionFixture<SuiteAuthFixture> { }

// 3. Use in test classes
[Collection("AuthSuite")]
public class UserProfileTests
{
    private readonly SuiteAuthFixture _auth;
    public UserProfileTests(SuiteAuthFixture auth) => _auth = auth;

    [Fact] public async Task ShowsUserName() { /* ... */ }
}

[Collection("AuthSuite")]
public class NotificationTests
{
    private readonly SuiteAuthFixture _auth;
    public NotificationTests(SuiteAuthFixture auth) => _auth = auth;

    [Fact] public async Task ShowsBadge() { /* ... */ }
}
```

### 4.3 `IAsyncLifetime` — Async Setup/Teardown

`IAsyncLifetime` can be applied to:

| Applied to | Effect |
| --- | --- |
| **Test class** | `InitializeAsync`/`DisposeAsync` run per test method (new class instance per method) |
| **Fixture class** | `InitializeAsync`/`DisposeAsync` run once per fixture lifetime (class or collection scope) |

**When applied to the test class directly** (like `PersistentBrowserTestBase`), it provides per-method setup/teardown — each test method gets a fresh browser.

**When applied to a fixture class** used with `IClassFixture<T>` or `ICollectionFixture<T>`, it runs once for the fixture's lifetime — enabling login-once-reuse-many.

### 4.4 Playwright Browser/Context Lifecycle Interactions

| xUnit mechanism | Playwright lifecycle | Parallelism |
| --- | --- | --- |
| `IAsyncLifetime` on test class | New browser per `[Fact]` | Tests run in parallel (default) |
| `IClassFixture<T>` | One browser per test class | Tests within class run sequentially |
| `ICollectionFixture<T>` | One browser per collection | All collection tests run sequentially |
| `PageTest` (Playwright.Xunit) | New context per `[Fact]`, shares browser across test class | Tests run in parallel |

### 4.5 Thread Safety Concerns

**Single browser context is NOT thread-safe.** Playwright's `IBrowserContext` and `IPage` are not designed for concurrent access. If multiple tests try to navigate the same page simultaneously, results are unpredictable.

**Safe patterns:**

```csharp
// SAFE: Each test gets its own page from the shared context
public class SharedContextFixture : IAsyncLifetime
{
    public IBrowserContext Context { get; private set; } = null!;
    // ...
}

public class MyTests : IClassFixture<SharedContextFixture>
{
    private readonly SharedContextFixture _fixture;
    public MyTests(SharedContextFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Test1()
    {
        // Create a new page for this test (inherits cookies from context)
        var page = await _fixture.Context.NewPageAsync();
        try
        {
            await page.GotoAsync("https://example.com/test1");
        }
        finally
        {
            await page.CloseAsync();
        }
    }
}
```

**Unsafe patterns:**

```csharp
// UNSAFE: Multiple tests sharing the same Page object in parallel
[Fact]
public async Task Test1() => await _fixture.Page.GotoAsync("/page1"); // Race!
[Fact]
public async Task Test2() => await _fixture.Page.GotoAsync("/page2"); // Race!
```

**Recommendation:** When sharing a context via `IClassFixture`/`ICollectionFixture`, either:

1. Share the `IBrowserContext` and create new `IPage` per test (pages inherit cookies)
2. Share a single `IPage` but ensure sequential execution (xUnit collections enforce this)

---

## Existing Codebase Patterns

### Current Project: `PersistentBrowserTestBase`

**File:** `tests/playwright/RegressionTests/PersistentBrowserTestBase.cs`

| Aspect | Implementation |
| --- | --- |
| **Pattern** | `IAsyncLifetime` on test class (per-method lifecycle) |
| **Context type** | Persistent (`LaunchPersistentContextAsync`) |
| **Profile dir** | `Path.GetTempPath() + "pw-profile-" + Guid.NewGuid()` |
| **Cleanup** | Best-effort `Directory.Delete` in `DisposeAsync` |
| **Session sharing** | None — each `[Fact]` gets a fresh browser + profile |
| **Browser channel** | Configurable via `BROWSER_CHANNEL` env var (default: `msedge`) |
| **Security** | Credentials from env vars; profile dir cleaned up in finally block |

**Security assessment:** Moderate — unique GUID profile dirs prevent cross-run leakage, cleanup is best-effort (may leave dirs on crash), sensitive data exists on disk during test execution.

### Current Project: `MacPaintTestBase`

**File:** `tests/playwright/MacPaintTool.Tests/MacPaintTestBase.cs`

| Aspect | Implementation |
| --- | --- |
| **Pattern** | `PageTest` (Playwright.Xunit managed lifecycle) |
| **Context type** | Ephemeral (managed by `PageTest`) |
| **Profile dir** | None — in-memory context |
| **Session sharing** | None — each `[Fact]` gets fresh context |
| **Auth needed** | No — tests target localhost standalone Vite server |
| **Security** | No auth concerns — testing a local canvas app |

### RegressionTests Project

**File:** `tests/playwright/RegressionTests/RegressionTests.csproj`

- Uses `Microsoft.Playwright` (core, no xUnit adapter) — manages browser lifecycle manually
- Does **not** reference `Microsoft.Playwright.Xunit` — cannot use `PageTest`
- Must implement all lifecycle via `IAsyncLifetime` or fixture patterns

### MacPaintTool.Tests Project

**File:** `tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj`

- References `Microsoft.Playwright.Xunit` — uses `PageTest` base class
- Ephemeral context per test — no session sharing needed
- No auth requirements (localhost testing)

### Skill Documentation

**File:** `.github/skills/playwright-dotnet-conversion/SKILL.md`

- Documents both ephemeral (`PageTest`) and persistent (`PersistentBrowserTestBase`) patterns
- Credentials policy: **never hardcode, always use environment variables**
- Documents cleanup of persistent profiles in `DisposeAsync`
- Does not document `IClassFixture`/`ICollectionFixture` patterns for session sharing

---

## Security Risk Assessment Matrix

| Approach | Credentials on disk? | Session state on disk? | Auto-cleanup? | Crash-safe cleanup? | CI ephemeral safety | CI self-hosted safety | SSO compatible? | Overall risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **A. In-memory ephemeral** (`NewContextAsync` + `IClassFixture`) | No | No | Yes (process exit) | Yes | Safe | Safe | **No** | **Lowest** |
| **B. Storage state file** (`StorageStateAsync` to JSON) | No | **Yes** (plaintext JSON) | No (manual) | **No** | Safe (ephemeral VM) | **High risk** | Yes | **Highest** |
| **C. Persistent context** (`LaunchPersistentContextAsync`) | No | **Yes** (binary profile) | Manual (`Directory.Delete`) | **No** (dir persists) | Safe (ephemeral VM) | **Moderate risk** | **Yes** | **Moderate** |
| **D. Setup project** (save state → load in tests) | No | **Yes** (plaintext JSON) | Manual | **No** | Safe (ephemeral VM) | **High risk** | Yes | **Highest** |
| **E. Auth header injection** (`SetExtraHTTPHeadersAsync`) | No | No | Yes (process exit) | Yes | Safe | Safe | **No** (API only) | **Lowest** |

### Risk Definitions

- **Lowest:** No sensitive data at rest. Memory-only. Safe on all CI types
- **Moderate:** Sensitive data at rest during test execution in binary format. GUID naming prevents predictable paths. Best-effort cleanup
- **Highest:** Sensitive data at rest in plaintext readable format. No automatic cleanup. Fixed file paths possible

---

## Recommendations

### For Sites That Do NOT Require SSO/OAuth

**Use Approach A: In-memory ephemeral context with `IClassFixture`/`ICollectionFixture`.**

This is the most secure approach:

- No sensitive data written to disk
- No cleanup concerns
- Safe on all CI runner types
- Login once, share the context across all tests in the class/collection

```csharp
public class AuthFixture : IAsyncLifetime
{
    private IPlaywright _pw = null!;
    private IBrowser _browser = null!;
    public IBrowserContext Context { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        _pw = await Playwright.CreateAsync();
        _browser = await _pw.Chromium.LaunchAsync(new()
        {
            Channel = "msedge",
            Headless = true
        });
        Context = await _browser.NewContextAsync();
        var page = await Context.NewPageAsync();

        // Login once — cookies stored in-memory context
        var user = Environment.GetEnvironmentVariable("APP_USERNAME")!;
        var pass = Environment.GetEnvironmentVariable("APP_PASSWORD")!;
        await page.GotoAsync("https://example.com/login");
        await page.GetByLabel("Username").FillAsync(user);
        await page.GetByLabel("Password").FillAsync(pass);
        await page.GetByRole(AriaRole.Button, new() { Name = "Log In" }).ClickAsync();
        await page.WaitForURLAsync(url => !url.Contains("/login"));
    }

    public async Task DisposeAsync()
    {
        await Context.CloseAsync();
        await _browser.CloseAsync();
        _pw.Dispose();
    }
}

[CollectionDefinition("Auth")]
public class AuthCollection : ICollectionFixture<AuthFixture> { }

[Collection("Auth")]
public class SomeTests
{
    private readonly AuthFixture _auth;
    public SomeTests(AuthFixture auth) => _auth = auth;

    [Fact]
    public async Task ProtectedPage_IsAccessible()
    {
        var page = await _auth.Context.NewPageAsync();
        await page.GotoAsync("https://example.com/protected");
        // ... assertions ...
        await page.CloseAsync();
    }
}
```

### For Sites That Require SSO/OAuth (Cross-Origin Redirects)

**Use Approach C: Persistent context with `ICollectionFixture` for suite-wide sharing.**

Enhancements over the current `PersistentBrowserTestBase`:

1. Move to `ICollectionFixture` to login once per suite rather than per test method
2. Use GUID-based profile dirs (already done)
3. Add aggressive cleanup in `DisposeAsync`
4. Add a CI cleanup step for self-hosted runners

```csharp
public class PersistentAuthFixture : IAsyncLifetime
{
    private IPlaywright _pw = null!;
    private string _profileDir = null!;
    public IBrowserContext Context { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        _profileDir = Path.Combine(Path.GetTempPath(), $"pw-profile-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_profileDir);

        _pw = await Playwright.CreateAsync();
        Context = await _pw.Chromium.LaunchPersistentContextAsync(_profileDir, new()
        {
            Channel = "msedge",
            Headless = true,
            AcceptDownloads = true
        });

        var page = Context.Pages.FirstOrDefault() ?? await Context.NewPageAsync();

        // SSO login
        var user = Environment.GetEnvironmentVariable("APP_USERNAME")!;
        var pass = Environment.GetEnvironmentVariable("APP_PASSWORD")!;
        await page.GotoAsync("https://example.com/");
        await page.WaitForURLAsync("**/login", new() { Timeout = 15_000 });
        await page.GetByLabel("Username").FillAsync(user);
        await page.GetByLabel("Password").FillAsync(pass);
        await page.GetByRole(AriaRole.Button, new() { Name = "Log In" }).ClickAsync();
        await page.WaitForURLAsync(url => !url.Contains("/login"), new() { Timeout = 30_000 });
    }

    public async Task DisposeAsync()
    {
        try { await Context.CloseAsync(); } catch { }
        _pw.Dispose();
        try
        {
            if (Directory.Exists(_profileDir))
                Directory.Delete(_profileDir, recursive: true);
        }
        catch { /* Best-effort */ }
    }
}

[CollectionDefinition("SSOAuth")]
public class SSOAuthCollection : ICollectionFixture<PersistentAuthFixture> { }
```

### Avoid Approach B/D (Storage State Files) Unless Necessary

Storage state files provide convenience but have the worst security profile:

- Plaintext JSON with all auth tokens
- No automatic cleanup
- Risk of accidental commit to source control
- Risk of persistence on self-hosted CI runners

If you must use storage state files:

1. Always write to temp directories with GUID names
2. Always delete in a `finally` block
3. Add the file patterns to `.gitignore`
4. Add CI cleanup steps
5. Consider encrypting the file at rest (adds complexity)

### Summary Decision Tree

```text
Does the site require SSO/OAuth with cross-origin redirects?
├── No
│   └── Use in-memory ephemeral context + ICollectionFixture
│       (Approach A — most secure)
└── Yes
    ├── Need session across test classes?
    │   ├── Yes → Persistent context + ICollectionFixture (Approach C)
    │   └── No  → Persistent context + IAsyncLifetime per class (current pattern)
    └── Is self-hosted CI used?
        ├── Yes → Add explicit cleanup CI step
        └── No  → Ephemeral VM handles cleanup
```

---

## References

- [Playwright .NET Authentication docs](https://playwright.dev/dotnet/docs/auth)
- [Playwright storage state API](https://playwright.dev/dotnet/docs/api/class-browsercontext#browser-context-storage-state)
- [xUnit shared context docs](https://xunit.net/docs/shared-context)
- [Playwright persistent context API](https://playwright.dev/dotnet/docs/api/class-browsertype#browser-type-launch-persistent-context)
- Workspace: `tests/playwright/RegressionTests/PersistentBrowserTestBase.cs`
- Workspace: `tests/playwright/MacPaintTool.Tests/MacPaintTestBase.cs`
- Workspace: `.github/skills/playwright-dotnet-conversion/SKILL.md`
