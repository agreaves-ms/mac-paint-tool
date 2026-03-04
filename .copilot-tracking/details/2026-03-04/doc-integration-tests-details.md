<!-- markdownlint-disable-file -->
# Implementation Details: Doc-Integration Playwright .NET Test Automation

## Context Reference

Sources:
* `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` — primary research
* `.copilot-tracking/research/subagents/2026-03-04/sso-dotnet-conversion-skill-research.md` — skill structure research
* `.copilot-tracking/research/subagents/2026-03-04/xunit-collection-fixture-playwright-research.md` — xUnit patterns
* `.copilot-tracking/research/subagents/2026-03-04/sso-vs-direct-login-research.md` — SSO confirmation

## Implementation Phase 1: Extend playwright-dotnet-conversion skill

<!-- parallelizable: false -->

### Step 1.1: Add ICollectionFixture section to SKILL.md

Add a third pattern to the existing skill document. Insert content after the existing "Persistent Browser Context Pattern" section (approximately line 170 of SKILL.md) and before "GitHub Actions Usage".

**Changes to the overview table** (line ~12 of SKILL.md):

Add a third row:

| Pattern | Base class | Use case |
| --- | --- | --- |
| **Ephemeral context** | `PageTest` | Standard web apps — fresh context per test |
| **Persistent context** | `PersistentBrowserTestBase` | SSO/OAuth — fresh context per test class |
| **Collection fixture** | `ICollectionFixture<DocIntegrationFixture>` | SSO/OAuth — login once, share across all test classes |

**Changes to "When to Use" table** (~line 70):

Add row:

| Need login session shared across multiple test classes | Yes — use `ICollectionFixture` pattern |

**New section "Collection Fixture Pattern (Login-Once)":**

Content should include:
1. When to use collection fixture vs persistent vs ephemeral
2. Architecture diagram showing fixture lifecycle
3. How xUnit executes: sequential within collection, `InitializeAsync` before any test
4. Security properties: persistent context with GUID temp dir, no storage state file export
5. Code example showing fixture + collection definition + test class
6. Why persistent context is needed for SSO (ephemeral fails on cross-origin redirects)

**New example in "Conversion Examples" section:**

Example 3: SSO login-once with collection fixture (2 test classes sharing session)

**Template links update:**

Add to the Templates section:
* [Collection fixture class](./assets/templates/DocIntegrationFixture.cs) — SSO login-once shared fixture
* [Collection definition](./assets/templates/CollectionDefinition.cs) — Collection marker class
* [Collection fixture test](./assets/templates/collection-fixture-test-template.cs) — Test class with constructor injection

**New troubleshooting entries:**

| Session expired mid-suite | SSO token timed out | Run suite within session validity window or add re-auth in fixture |
| Test sees wrong page state | Previous test navigated elsewhere | Add `await _session.Page.GotoAsync(...)` at top of each test |
| Collection tests run sequentially (slow) | xUnit serializes collection classes | Expected behavior — create new pages from `Context.NewPageAsync()` for parallelism if needed |

Files:
* `.github/skills/playwright-dotnet-conversion/SKILL.md` - Extend with new section, update tables, add template links

Discrepancy references:
* DD-01: Uses persistent context instead of in-memory context (skill subagent suggested in-memory but SSO research requires persistent)

Success criteria:
* SKILL.md has three-row pattern table
* New "Collection Fixture Pattern (Login-Once)" section present
* Three new template links in Templates section
* New troubleshooting rows added

Context references:
* `.copilot-tracking/research/subagents/2026-03-04/sso-dotnet-conversion-skill-research.md` (Lines 100-165) — Gap analysis
* `.github/skills/playwright-dotnet-conversion/SKILL.md` (Lines 1-30) — Current overview structure

Dependencies:
* None — this is the first step

### Step 1.2: Create `DocIntegrationFixture.cs` template

Create a new template file for the collection fixture base class. This template uses `LaunchPersistentContextAsync` with a GUID temp profile directory (required for SSO cross-origin redirects).

File: `.github/skills/playwright-dotnet-conversion/assets/templates/DocIntegrationFixture.cs`

Template content with placeholder markers:

```csharp
using Microsoft.Playwright;

namespace {{Namespace}};

/// <summary>
/// Shared fixture that authenticates once and provides the session to all
/// test classes in the collection. Uses persistent context to survive
/// SSO cross-origin redirects. Profile directory is GUID-randomized
/// and cleaned up on disposal.
///
/// Configuration via environment variables:
///   APP_USERNAME     — login username (required)
///   APP_PASSWORD     — login password (required)
///   HEADED=1         — launch browser in headed mode (default: headless)
///   BROWSER_CHANNEL  — browser channel (default: msedge)
/// </summary>
public class {{FixtureClassName}} : IAsyncLifetime
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

        _profileDir = Path.Combine(Path.GetTempPath(), $"pw-{{ProfilePrefix}}-{Guid.NewGuid():N}");
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
        await Page.GotoAsync("{{LoginUrl}}");

        await Page.GetByRole(AriaRole.Textbox, new() { Name = "{{UsernameLabel}}" })
            .FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "{{PasswordLabel}}" })
            .FillAsync(password);

        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "{{LoginButtonName}}", Exact = true });
        await Assertions.Expect(loginButton).ToBeEnabledAsync(new() { Timeout = 10_000 });
        await loginButton.ClickAsync();

        // Wait for login to complete
        {{PostLoginWaitLogic}}

        // Verify no login error
        await Assertions.Expect(Page.GetByText("{{ErrorText}}"))
            .Not.ToBeVisibleAsync(new() { Timeout = 5_000 });
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
}
```

Files:
* `.github/skills/playwright-dotnet-conversion/assets/templates/DocIntegrationFixture.cs` - New template file

Discrepancy references:
* DD-01: Uses `LaunchPersistentContextAsync` instead of `NewContextAsync`

Success criteria:
* Template file exists with all placeholder markers
* Uses `LaunchPersistentContextAsync` for SSO compatibility
* Credentials read from env vars, never hardcoded
* GUID-randomized profile dir with cleanup in DisposeAsync

Context references:
* `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` (Lines 130-210) — fixture code example
* `tests/playwright/RegressionTests/PersistentBrowserTestBase.cs` (Lines 1-103) — existing persistent base class

Dependencies:
* None

### Step 1.3: Create `CollectionDefinition.cs` template

File: `.github/skills/playwright-dotnet-conversion/assets/templates/CollectionDefinition.cs`

```csharp
namespace {{Namespace}};

/// <summary>
/// Marker class that associates the "{{CollectionName}}" collection
/// with the {{FixtureClassName}} fixture. Test classes tagged with
/// [Collection("{{CollectionName}}")] share a single fixture instance.
/// </summary>
[CollectionDefinition("{{CollectionName}}")]
public class {{CollectionClassName}} : ICollectionFixture<{{FixtureClassName}}>
{
    // No code needed. This class links the collection name to the fixture type.
}
```

Files:
* `.github/skills/playwright-dotnet-conversion/assets/templates/CollectionDefinition.cs` - New template

Success criteria:
* File uses `[CollectionDefinition]` attribute
* Implements `ICollectionFixture<T>` with fixture type parameter
* Placeholder markers for namespace, collection name, fixture class name

Dependencies:
* None

### Step 1.4: Create `collection-fixture-test-template.cs` template

File: `.github/skills/playwright-dotnet-conversion/assets/templates/collection-fixture-test-template.cs`

```csharp
using Microsoft.Playwright;

// Place generated collection-fixture tests under: tests/playwright/{{ProjectName}}/

namespace {{Namespace}};

/// <summary>
/// {{TestDescription}}
/// Receives authenticated session from {{FixtureClassName}} via constructor injection.
/// </summary>
[Collection("{{CollectionName}}")]
public class {{TestClassName}}
{
    private readonly {{FixtureClassName}} _session;

    public {{TestClassName}}({{FixtureClassName}} session) => _session = session;

    [Fact]
    public async Task {{BehaviorDrivenTestName}}()
    {
        // Navigate to starting URL (defensive — in case a prior test navigated away)
        await _session.Page.GotoAsync("{{StartingUrl}}");

        {{StepCode}}

        {{AssertionCode}}
    }
}
```

Files:
* `.github/skills/playwright-dotnet-conversion/assets/templates/collection-fixture-test-template.cs` - New template

Success criteria:
* Uses `[Collection]` attribute (not base class inheritance)
* Constructor injection for fixture
* Defensive navigation at top of each test
* `Assertions.Expect()` for assertions (not inherited `Expect()`)

Context references:
* `.copilot-tracking/research/subagents/2026-03-04/xunit-collection-fixture-playwright-research.md` (Lines 120-145) — test class examples

Dependencies:
* None

### Step 1.5: Update conversion-mapping.md with collection fixture patterns

Add a new section "Collection Fixture Patterns (Login-Once)" to the existing conversion mapping reference.

File: `.github/skills/playwright-dotnet-conversion/references/conversion-mapping.md`

New section content:

```markdown
## Collection Fixture Patterns (Login-Once)

These patterns apply when using `ICollectionFixture<T>` for suite-wide session sharing:

| Automation intent | Playwright .NET code |
| --- | --- |
| Access shared page | `_session.Page` |
| Access shared context | `_session.Context` |
| Assert with collection fixture | `await Assertions.Expect(locator).ToBeVisibleAsync();` |
| Navigate defensively | `await _session.Page.GotoAsync("https://...");` at start of each test |
| Create isolated page from shared session | `var page = await _session.Context.NewPageAsync();` |
| Clean up isolated page | `await page.CloseAsync();` |
```

Update base class selection guide:

| Scenario | Base class / pattern |
| --- | --- |
| SSO login once, share across all test classes | `ICollectionFixture<FixtureClass>` via constructor injection |

Files:
* `.github/skills/playwright-dotnet-conversion/references/conversion-mapping.md` - Extend with new section

Success criteria:
* New "Collection Fixture Patterns" section added
* Base class selection guide updated with third option

Dependencies:
* None

## Implementation Phase 2: Create DocIntegrationTests project

<!-- parallelizable: false -->

### Step 2.1: Create `DocIntegrationTests.csproj`

Create a new xUnit test project at `tests/playwright/DocIntegrationTests/`. The .csproj mirrors `RegressionTests.csproj` — same packages, same versions, no `Microsoft.Playwright.Xunit`.

File: `tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="coverlet.collector" Version="6.0.4" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
    <PackageReference Include="Microsoft.Playwright" Version="1.58.0" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.4" />
  </ItemGroup>

  <ItemGroup>
    <Using Include="Xunit" />
  </ItemGroup>

</Project>
```

Files:
* `tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj` - New file

Success criteria:
* File compiles with `dotnet build`
* Package versions match existing `RegressionTests.csproj`
* No reference to `Microsoft.Playwright.Xunit` (not needed for collection fixture)

Context references:
* `tests/playwright/RegressionTests/RegressionTests.csproj` (Lines 1-22) — package version reference

Dependencies:
* .NET SDK 10.0+

### Step 2.2: Create `DocIntegrationFixture.cs` — shared auth fixture

This is the concrete implementation of the fixture template for `doc-integration.pfizer.com`. It authenticates once during `InitializeAsync()` and exposes the authenticated `Page` and `Context` for all test classes.

File: `tests/playwright/DocIntegrationTests/DocIntegrationFixture.cs`

```csharp
using Microsoft.Playwright;

namespace DocIntegrationTests;

/// <summary>
/// Shared fixture that authenticates once to doc-integration.pfizer.com
/// and provides the session to all test classes in the "DocIntegration" collection.
/// Uses persistent context to survive SSO cross-origin redirects.
/// Profile directory is GUID-randomized and cleaned up on disposal.
///
/// Configuration via environment variables:
///   APP_USERNAME     — login username (required)
///   APP_PASSWORD     — login password (required)
///   HEADED=1         — launch browser in headed mode (default: headless)
///   BROWSER_CHANNEL  — browser channel (default: msedge)
/// </summary>
public class DocIntegrationFixture : IAsyncLifetime
{
    private IPlaywright _playwright = null!;
    private string _profileDir = null!;

    /// <summary>
    /// The persistent browser context with authenticated session.
    /// </summary>
    public IBrowserContext Context { get; private set; } = null!;

    /// <summary>
    /// The page that completed login. Tests can navigate freely.
    /// </summary>
    public IPage Page { get; private set; } = null!;

    protected virtual int ViewportWidth => 1400;
    protected virtual int ViewportHeight => 900;

    public async Task InitializeAsync()
    {
        var username = Environment.GetEnvironmentVariable("APP_USERNAME")
            ?? throw new InvalidOperationException(
                "APP_USERNAME env var must be set. Run: $env:APP_USERNAME = '<your-username>'");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD")
            ?? throw new InvalidOperationException(
                "APP_PASSWORD env var must be set. Run: $env:APP_PASSWORD = '<your-password>'");

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

        // Navigate to doc-integration and authenticate
        await Page.GotoAsync("https://doc-integration.pfizer.com/");

        // Fill login form
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Username" })
            .FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Password" })
            .FillAsync(password);

        // Wait for Log In button to become enabled, then click
        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "Log In", Exact = true });
        await Assertions.Expect(loginButton).ToBeEnabledAsync(new() { Timeout = 10_000 });
        await loginButton.ClickAsync();

        // Wait for login to complete (up to 30s for SSO redirect chain)
        await Page.WaitForFunctionAsync(
            "() => !document.body.innerText.includes('Enter Username')",
            null,
            new() { Timeout = 30_000 });

        // Verify no SSO error
        await Assertions.Expect(Page.GetByText("Sso Login Unsuccessful"))
            .Not.ToBeVisibleAsync(new() { Timeout = 5_000 });
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
        catch { /* Best-effort cleanup — profile dir may be locked briefly */ }
    }
}
```

Key design decisions:
* Uses `LaunchPersistentContextAsync` — required for SSO cross-origin redirects
* GUID temp profile dir — prevents predictable paths, cleaned up on disposal
* `WaitForFunctionAsync` — waits for login form to disappear, works regardless of post-login URL
* Error verification — checks for "Sso Login Unsuccessful" which is the actual error text on the site
* `InvalidOperationException` for missing env vars — clear error message with setup instructions

Files:
* `tests/playwright/DocIntegrationTests/DocIntegrationFixture.cs` - New file

Discrepancy references:
* DD-01: Uses persistent context (disk profile) rather than in-memory for SSO compatibility

Success criteria:
* Fixture authenticates successfully in `InitializeAsync()`
* `Page` and `Context` properties are accessible after login
* Profile directory is deleted in `DisposeAsync()`
* Missing env vars produce clear error messages

Context references:
* `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` (Lines 130-210) — fixture design
* `tests/playwright/RegressionTests/PersistentBrowserTestBase.cs` (Lines 56-80) — persistent context launch pattern

Dependencies:
* Step 2.1 (csproj must exist)

### Step 2.3: Create `DocIntegrationCollection.cs` — collection definition

File: `tests/playwright/DocIntegrationTests/DocIntegrationCollection.cs`

```csharp
namespace DocIntegrationTests;

/// <summary>
/// Marker class that associates the "DocIntegration" collection with the
/// DocIntegrationFixture. Test classes tagged with [Collection("DocIntegration")]
/// share a single authenticated fixture instance and run sequentially.
/// </summary>
[CollectionDefinition("DocIntegration")]
public class DocIntegrationCollection : ICollectionFixture<DocIntegrationFixture>
{
    // No code needed. This class links the collection name to the fixture type.
}
```

Files:
* `tests/playwright/DocIntegrationTests/DocIntegrationCollection.cs` - New file

Success criteria:
* `[CollectionDefinition("DocIntegration")]` attribute applied
* Implements `ICollectionFixture<DocIntegrationFixture>`

Dependencies:
* Step 2.2 (fixture class must exist)

### Step 2.4: Create `LoginTests.cs` — Test 1: login verification

This test verifies that the fixture's login succeeded. It does NOT perform login itself — the fixture already did that. It simply asserts the post-login UI state and saves a screenshot.

File: `tests/playwright/DocIntegrationTests/LoginTests.cs`

```csharp
using Microsoft.Playwright;

namespace DocIntegrationTests;

/// <summary>
/// Verifies that login to doc-integration.pfizer.com succeeded.
/// The actual login is performed by DocIntegrationFixture.InitializeAsync().
/// This test validates the post-login state: expected buttons visible, no errors.
/// </summary>
[Collection("DocIntegration")]
public class LoginTests
{
    private readonly DocIntegrationFixture _session;

    public LoginTests(DocIntegrationFixture session) => _session = session;

    [Fact]
    public async Task Login_Succeeds_WithValidCredentials()
    {
        // Verify post-login navigation buttons are visible
        await Assertions.Expect(
            _session.Page.GetByRole(AriaRole.Button, new() { Name = "Home" }))
            .ToBeVisibleAsync(new() { Timeout = 10_000 });

        await Assertions.Expect(
            _session.Page.GetByRole(AriaRole.Button, new() { Name = "Actions" }))
            .ToBeVisibleAsync();

        await Assertions.Expect(
            _session.Page.GetByRole(AriaRole.Button, new() { Name = "VM Operations" }))
            .ToBeVisibleAsync();

        await Assertions.Expect(
            _session.Page.GetByRole(AriaRole.Button, new() { Name = "CI Loop" }))
            .ToBeVisibleAsync();

        // Verify no error text
        await Assertions.Expect(_session.Page.GetByText("Sso Login Unsuccessful"))
            .Not.ToBeVisibleAsync();
        await Assertions.Expect(_session.Page.GetByText("Invalid credentials"))
            .Not.ToBeVisibleAsync();

        // Save screenshot
        await _session.Page.ScreenshotAsync(new() { Path = "login.png" });
    }
}
```

Key design decisions:
* No login logic in the test — fixture handles authentication
* Checks for all four buttons mentioned by user: Home, Actions, VM Operations, CI Loop
* Negative assertions for error text
* Screenshot saved as `login.png` per user specification
* Uses `Assertions.Expect()` (static) — not inherited `Expect()` since no base class
* 10s timeout on first assertion to account for page render delay

Files:
* `tests/playwright/DocIntegrationTests/LoginTests.cs` - New file

Success criteria:
* Test passes when fixture login succeeds
* Four post-login buttons verified as visible
* Error text absence verified
* Screenshot saved as `login.png`

Context references:
* `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` (Lines 225-255) — Test 1 example

Dependencies:
* Steps 2.1-2.3

### Step 2.5: Create `TopPrioritiesTests.cs` — Test 2: navigation + priority check

File: `tests/playwright/DocIntegrationTests/TopPrioritiesTests.cs`

```csharp
using Microsoft.Playwright;

namespace DocIntegrationTests;

/// <summary>
/// Navigates through the organizational hierarchy to Clinical Supply Puurs,
/// applies the selection, and verifies the Top Priorities section displays
/// the expected items.
/// </summary>
[Collection("DocIntegration")]
public class TopPrioritiesTests
{
    private readonly DocIntegrationFixture _session;

    public TopPrioritiesTests(DocIntegrationFixture session) => _session = session;

    [Fact]
    public async Task TopPriorities_ShowsExpectedItems_AfterNavigatingToClinicialSupplyPuurs()
    {
        // Navigate through the hierarchy
        await _session.Page.GetByText("Global Tech Eng").ClickAsync();
        await _session.Page.GetByText("Clinical Manufacturing Supply Operations").ClickAsync();
        await _session.Page.GetByText("Clinical Supply Puurs").ClickAsync();

        // Apply the selection
        await _session.Page.GetByRole(AriaRole.Button, new() { Name = "Apply" }).ClickAsync();

        // Wait for content to load
        await _session.Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Check for Top Priorities section
        var topPrioritiesHeading = _session.Page.GetByText("Top Priorities");
        await Assertions.Expect(topPrioritiesHeading)
            .ToBeVisibleAsync(new() { Timeout = 15_000 });

        // Verify the top 3 expected priority items
        await Assertions.Expect(_session.Page.GetByText("M2 MF RFT project follow up"))
            .ToBeVisibleAsync(new() { Timeout = 5_000 });

        await Assertions.Expect(_session.Page.GetByText("Budget overview S2F2 + PO's"))
            .ToBeVisibleAsync(new() { Timeout = 5_000 });

        await Assertions.Expect(_session.Page.GetByText("mRNA never frozen syringe plan"))
            .ToBeVisibleAsync(new() { Timeout = 5_000 });
    }
}
```

Key design decisions:
* Navigates through three levels: Global Tech Eng → Clinical Manufacturing Supply Operations → Clinical Supply Puurs
* Clicks Apply button after hierarchy selection
* Waits for `NetworkIdle` to ensure content loads after Apply
* Verifies all three priority items mentioned by user
* 15s timeout on Top Priorities heading (network-dependent), 5s on individual items
* Selectors use `GetByText` — may need adjustment based on actual DOM structure (see planning log WI-01)

Files:
* `tests/playwright/DocIntegrationTests/TopPrioritiesTests.cs` - New file

Discrepancy references:
* DR-01: Selectors based on user-provided text labels — may need correction after live DOM inspection

Success criteria:
* Test navigates through three hierarchy levels
* Apply button click triggers content load
* Three expected priority items verified as visible
* Test passes when priority items exist on the page

Context references:
* `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` (Lines 257-290) — Test 2 example

Dependencies:
* Steps 2.1-2.3

### Step 2.6: Add project to solution

Run: `dotnet sln mac-paint-tool.sln add tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj`

This registers the new project in the solution for VS Test Explorer and `dotnet test` discovery.

Files:
* `mac-paint-tool.sln` - Modified (new project entry)

Success criteria:
* Solution builds without errors
* New project appears in solution structure

Dependencies:
* Step 2.1

## Implementation Phase 3: Validation

<!-- parallelizable: false -->

### Step 3.1: Run full project validation

Execute all validation commands:

```powershell
# Build the new project
dotnet build tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj -c Release

# Install Playwright browsers (msedge channel)
pwsh tests/playwright/DocIntegrationTests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
```

### Step 3.2: Fix minor validation issues

Iterate on build errors, missing package references, or namespace issues. Fix directly when corrections are straightforward.

### Step 3.3: Report blocking issues

When validation failures require changes beyond minor fixes:
* Document selector mismatches requiring live DOM inspection
* Provide the user with commands to run tests with `$env:HEADED = "1"` for visual debugging
* Recommend using `playwright-automation-msedge` skill to inspect live DOM selectors

## Dependencies

* .NET SDK 10.0+
* Microsoft.Playwright 1.58.0 NuGet package
* xUnit 2.9.3 NuGet package
* Microsoft Edge (system-installed) or Chromium
* `$env:APP_USERNAME` and `$env:APP_PASSWORD` environment variables

## Success Criteria

* `playwright-dotnet-conversion` skill SKILL.md extended with ICollectionFixture section and three new templates
* `DocIntegrationTests.csproj` project compiles without errors
* `DocIntegrationFixture.cs` performs SSO login once and shares session
* `LoginTests.cs` verifies post-login UI state and saves screenshot
* `TopPrioritiesTests.cs` navigates hierarchy and verifies three priority items
* All tests runnable via documented `dotnet test` command
