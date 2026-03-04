---
title: SSO .NET Conversion Skill Research — ICollectionFixture Pattern
description: Research on extending or creating a skill for converting Playwright headed-browser test steps to C# tests using ICollectionFixture login-once pattern for SSO-authenticated sites
author: GitHub Copilot
ms.date: 2026-03-04
ms.topic: reference
keywords:
  - playwright
  - dotnet
  - xunit
  - ICollectionFixture
  - SSO
  - skill
  - collection fixture
estimated_reading_time: 10
---

## Overview

This document analyzes the existing `playwright-dotnet-conversion` skill and determines what changes are needed to support the `ICollectionFixture<T>` login-once pattern for SSO-authenticated sites. It covers the existing skill structure, identified gaps, the recommended approach (extend vs. create new), required templates, and .csproj requirements.

## Task 1 — Existing Skill Structure Analysis

### Skill Layout

```text
.github/skills/playwright-dotnet-conversion/
├── SKILL.md                                          # Main skill document (329 lines)
├── assets/
│   └── templates/
│       ├── PersistentBrowserTestBase.cs               # Base class for persistent context
│       ├── persistent-test-template.cs                # Test template inheriting PersistentBrowserTestBase
│       └── playwright-dotnet-test-template.cs         # Ephemeral PageTest template
└── references/
    └── conversion-mapping.md                          # Step-to-code conversion tables
```

### Two Supported Patterns

| Pattern | Base class | Mechanism | Scope |
|---|---|---|---|
| Ephemeral | `PageTest` (from `Microsoft.Playwright.Xunit`) | Fresh in-memory context per test | Single test |
| Persistent | `PersistentBrowserTestBase` (custom, `IAsyncLifetime`) | `LaunchPersistentContextAsync` with temp profile dir | Single test class |

### Key Characteristics of `PersistentBrowserTestBase`

- Implements `IAsyncLifetime` — lifecycle is per-test-class (new browser, new profile per class)
- Uses `LaunchPersistentContextAsync` with a temp user-data directory on disk
- Writes a full Chromium user-data directory (SQLite DBs with cookies/session data)
- Exposes `Page`, `Context`, and `Expect()` matching the `PageTest` API
- Cleans up profile directory in `DisposeAsync()`
- Tests inherit from the base class directly
- Each test class gets its own browser instance — no session sharing between classes
- Login must be performed once per test class (not once per suite)

### Templates

- **`PersistentBrowserTestBase.cs`** — 95-line base class managing Playwright lifecycle, persistent context, and cleanup
- **`persistent-test-template.cs`** — Template with `{{TestClassName}}`, `{{BehaviorDrivenTestName}}`, `{{BaseUrl}}`, `{{UsernameLabel}}`, `{{PasswordLabel}}`, `{{LoginButtonName}}`, `{{ErrorText}}`, `{{AdditionalAssertions}}`, `{{ScreenshotFilename}}` placeholders
- **`playwright-dotnet-test-template.cs`** — Simple `PageTest` template with `{{TestClassName}}`, `{{BehaviorDrivenTestName}}`, `{{BaseUrl}}`, `{{StepCode}}`, `{{AssertionSelector}}`, `{{ExpectedText}}` placeholders

### Conversion Mapping Reference

The mapping reference covers:

- Locator priority (GetByRole > GetByLabel > GetByTestId > CSS)
- Step-to-code mapping table (navigate, click, fill, verify, dialog, screenshot)
- Assertion patterns
- Persistent context patterns (env var credentials, SSO redirect waits, error assertions)
- Base class selection guide

### Existing .csproj Files

**RegressionTests.csproj** (persistent context — no `Microsoft.Playwright.Xunit`):

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

**MacPaintTool.Tests.csproj** (ephemeral context — includes `Microsoft.Playwright.Xunit`):

```xml
<PackageReference Include="Microsoft.Playwright.Xunit" Version="1.58.0" />
```

## Task 2 — Gaps in Existing Skill

### What the existing skill handles

- Ephemeral context (`PageTest`) tests — fresh browser per test
- Per-test-class persistent context (`PersistentBrowserTestBase` with `IAsyncLifetime`) — each class gets its own browser, its own login
- Single test class templates
- Conversion mapping for both patterns
- GitHub Actions integration
- Credential policy (env vars, never hardcode)

### What the existing skill does NOT handle

| Gap | Description |
|---|---|
| `ICollectionFixture<T>` pattern | Login once, share authenticated session across multiple test classes |
| Collection fixture lifecycle | Documentation of how xUnit creates, shares, and disposes collection fixtures |
| `[CollectionDefinition]` marker class | Template and explanation for the required marker class |
| Constructor injection pattern | Tests receive fixture via constructor, not inheritance |
| Sequential execution semantics | Collection tests run sequentially — documented behavior and trade-offs |
| In-memory context vs. persistent profile | Collection fixture uses `NewContextAsync()` (in-memory), not `LaunchPersistentContextAsync` (disk) |
| SSO-specific login flow template | Fixture that performs login in `InitializeAsync()` and exposes authenticated `Page`/`Context` |
| Test ordering within a collection | How to order a login-verification test before functional tests |
| Navigation state management | Guidance on navigating to starting URL at top of each test |
| Session expiration handling | What happens if SSO session times out mid-suite |
| New .csproj for isolated SSO tests | Instructions for creating a dedicated project |

### Architectural Differences

| Aspect | Existing `PersistentBrowserTestBase` | New `ICollectionFixture` Pattern |
|---|---|---|
| Lifecycle scope | Per test class | Per collection (multiple classes) |
| Session sharing | No — each class gets its own session | Yes — all classes share one session |
| Login count | Once per test class | Once per entire collection |
| Test class relationship | Inheritance (`class Foo : PersistentBrowserTestBase`) | Constructor injection (`BrowserSessionFixture session`) |
| Browser launch method | `LaunchPersistentContextAsync` (disk profile) | `LaunchAsync` + `NewContextAsync` (in-memory) |
| Auth state storage | On disk (Chromium user-data dir) | In process memory only |
| Cleanup | Delete temp profile directory | Close context + dispose Playwright (no disk cleanup) |

## Task 3 — Extend Existing Skill or Create New Skill

### Option A — Add ICollectionFixture pattern to existing skill

**Pros:**

- Single source of truth for all Playwright .NET conversion patterns
- Existing skill already covers persistent context — collection fixture is a natural evolution
- Avoids duplicating conversion mapping, locator priority, assertion patterns, and credential policy
- Users find all patterns in one place

**Cons:**

- SKILL.md is already 329 lines — adding collection fixture content would push it past 500 lines
- The collection fixture pattern has fundamentally different architecture (constructor injection vs. inheritance)
- Risk of confusion between `PersistentBrowserTestBase` (per-class) and `BrowserSessionFixture` (per-collection)

### Option B — Create brand-new skill

**Pros:**

- Clean separation of concerns
- Focused skill for SSO collection fixture pattern
- No risk of bloating existing skill

**Cons:**

- Duplicates conversion mapping, locator priority, assertion patterns, and credential policy
- Two skills to maintain for closely related patterns
- Users must decide between two skills for SSO testing

### Option C — Extend existing skill with new templates and mappings (Recommended)

**Pros:**

- Keeps all Playwright .NET conversion knowledge in one skill
- Adds new section "Collection Fixture Pattern (Login-Once)" to SKILL.md
- Adds new templates without modifying existing ones
- Updates conversion mapping reference with collection fixture patterns
- Existing content remains untouched
- Table in the skill overview grows from 2 to 3 rows (PageTest / PersistentBrowserTestBase / ICollectionFixture)

**Cons:**

- SKILL.md grows to approximately 450–500 lines (acceptable)

### Recommendation: Option C

The `ICollectionFixture` pattern is an evolution of the persistent context pattern, not a fundamentally different skill domain. The existing skill's conversion mappings, locator priorities, assertion patterns, and credential policy all apply directly. Adding a third row to the pattern table and a new section with dedicated templates is the cleanest approach.

The skill's `description` frontmatter already says "supports both ephemeral and persistent browser contexts for SSO/auth-redirect sites" — extending it to cover collection fixtures is a natural fit.

## Task 4 — Required Templates, References, and Mappings

### New Templates Needed

#### 1. `BrowserSessionFixture.cs` — Collection fixture class

```text
Location: .github/skills/playwright-dotnet-conversion/assets/templates/BrowserSessionFixture.cs
```

Key elements:

- Class implementing `IAsyncLifetime`
- `InitializeAsync()`: creates Playwright, launches browser, creates in-memory context, opens page, performs SSO login
- `DisposeAsync()`: closes context, closes browser, disposes Playwright
- Exposes `IBrowserContext Context`, `IPage Page`, `IBrowser Browser`
- Reads `TEST_LOGIN_URL`, `TEST_USERNAME`, `TEST_PASSWORD` from env vars
- Throws `InvalidOperationException` if env vars missing (not `Assert`, since this runs outside test methods)
- Uses `LaunchAsync` + `NewContextAsync` (in-memory), NOT `LaunchPersistentContextAsync`
- Supports `HEADED` and `BROWSER_CHANNEL` env vars
- Placeholder slots: `{{Namespace}}`, `{{FixtureClassName}}`, `{{LoginUrl}}`, `{{UsernameSelector}}`, `{{PasswordSelector}}`, `{{LoginButtonSelector}}`, `{{PostLoginUrlPattern}}`, `{{LoginUrlEnvVar}}`, `{{UsernameEnvVar}}`, `{{PasswordEnvVar}}`

#### 2. `CollectionDefinition.cs` — Collection marker class

```text
Location: .github/skills/playwright-dotnet-conversion/assets/templates/CollectionDefinition.cs
```

Key elements:

- `[CollectionDefinition("{{CollectionName}}")]` attribute
- Class inheriting `ICollectionFixture<{{FixtureClassName}}>`
- Empty body with XML doc comment explaining purpose
- Placeholder slots: `{{Namespace}}`, `{{CollectionName}}`, `{{FixtureClassName}}`

#### 3. `collection-fixture-test-template.cs` — Test class receiving fixture via constructor

```text
Location: .github/skills/playwright-dotnet-conversion/assets/templates/collection-fixture-test-template.cs
```

Key elements:

- `[Collection("{{CollectionName}}")]` attribute on class
- No base class inheritance
- Constructor receives `{{FixtureClassName}}` and stores as `_session` field
- Test methods access `_session.Page` and `_session.Context`
- Uses `Assertions.Expect()` static method (not inherited `Expect()`)
- Each test method navigates to its starting URL (defensive navigation)
- Placeholder slots: `{{Namespace}}`, `{{CollectionName}}`, `{{FixtureClassName}}`, `{{TestClassName}}`, `{{BehaviorDrivenTestName}}`, `{{StartingUrl}}`, `{{StepCode}}`, `{{AssertionCode}}`

### Updates to Conversion Mapping Reference

New section: **Collection Fixture Patterns (Login-Once)**

| Automation intent | Playwright .NET code |
|---|---|
| Access shared page in test | `_session.Page` |
| Access shared context | `_session.Context` |
| Assert with collection fixture | `await Assertions.Expect(locator).To...Async();` |
| Navigate defensively | `await _session.Page.GotoAsync("...");` at start of each test |
| Create isolated page from shared session | `var page = await _session.Context.NewPageAsync();` |
| Restore after destructive test | `await page.CloseAsync();` |

New row in base class selection guide:

| Scenario | Base class / pattern |
|---|---|
| SSO login once, share across classes | `ICollectionFixture<BrowserSessionFixture>` |

### Updates to SKILL.md

1. **Overview table** — Add third row for Collection Fixture pattern
2. **New section** — "Collection Fixture Pattern (Login-Once)" after existing "Persistent Browser Context Pattern" section
3. **When to Use** table — Add row for "Need login session shared across multiple test classes"
4. **Execution Requirement** — Add build/test commands for the new project
5. **Conversion Examples** — Add Example 3 showing collection fixture usage
6. **Templates section** — Add links to three new template files
7. **Troubleshooting** — Add entries for collection fixture issues (session expiration, navigation state pollution)

### Test Ordering Within a Collection

xUnit does not guarantee test class execution order within a collection by default. To ensure a login-verification test runs first:

- **Option A (recommended):** Login happens in the fixture's `InitializeAsync()`, so ALL test classes receive an already-authenticated session. No ordering needed — the login test simply verifies the fixture worked.
- **Option B:** Use `[TestCaseOrderer]` with a custom orderer if explicit ordering is required.
- **Option C:** Name the login test class alphabetically first (fragile, not recommended).

The recommended approach: the fixture performs login in `InitializeAsync()`. A separate `LoginVerificationTests` class simply asserts the page is authenticated (URL check, element check). This test can run in any order since the fixture guarantees authentication before any test class receives it.

### Instructions for Creating a New .csproj

Document these steps:

1. Create directory: `tests/playwright/{{ProjectName}}/`
2. Create `{{ProjectName}}.csproj` with required packages
3. Create `BrowserSessionFixture.cs` from template
4. Create `CollectionDefinition.cs` from template
5. Create test class files from template
6. Add project to solution: `dotnet sln add tests/playwright/{{ProjectName}}/{{ProjectName}}.csproj`
7. Build: `dotnet build tests/playwright/{{ProjectName}}/{{ProjectName}}.csproj -c Release`
8. Install browsers: `pwsh tests/playwright/{{ProjectName}}/bin/Release/net10.0/playwright.ps1 install --with-deps chromium`
9. Set env vars and run: `dotnet test tests/playwright/{{ProjectName}}/{{ProjectName}}.csproj -c Release --logger "trx"`

### Instructions for Running Tests

```powershell
# Set credentials
$env:TEST_LOGIN_URL = "https://example.com/login"
$env:TEST_USERNAME = "<username>"
$env:TEST_PASSWORD = "<password>"
$env:HEADED = "1"  # Optional: see browser
$env:BROWSER_CHANNEL = "msedge"  # Optional: default is msedge

# Build
dotnet build tests/playwright/{{ProjectName}}/{{ProjectName}}.csproj -c Release

# Install browsers
pwsh tests/playwright/{{ProjectName}}/bin/Release/net10.0/playwright.ps1 install --with-deps chromium

# Run
dotnet test tests/playwright/{{ProjectName}}/{{ProjectName}}.csproj -c Release --logger "trx;LogFileName=sso-tests.trx"
```

## Task 5 — .csproj Requirements

### Target Framework

`net10.0` — matches both existing projects (`MacPaintTool.Tests.csproj` and `RegressionTests.csproj`).

### Package References

| Package | Version | Purpose | Required |
|---|---|---|---|
| `Microsoft.Playwright` | `1.58.0` | Core Playwright API (`IPlaywright`, `IBrowser`, `IBrowserContext`, `IPage`) | Yes |
| `xunit` | `2.9.3` | Test framework (`[Fact]`, `[Collection]`, `ICollectionFixture`, `IAsyncLifetime`) | Yes |
| `Microsoft.NET.Test.Sdk` | `17.14.1` | Test host and discovery | Yes |
| `xunit.runner.visualstudio` | `3.1.4` | Test discovery for `dotnet test` and VS Test Explorer | Yes |
| `coverlet.collector` | `6.0.4` | Code coverage collection | Yes (for consistency) |

### Is `Microsoft.Playwright.Xunit` Needed?

**No.** `Microsoft.Playwright.Xunit` provides the `PageTest` base class. The collection fixture pattern does not use `PageTest` — tests receive the fixture via constructor injection and use `Assertions.Expect()` directly. The `Microsoft.Playwright` package alone provides everything needed:

- `IPlaywright`, `IBrowser`, `IBrowserContext`, `IPage`
- `Assertions.Expect()` static methods
- `BrowserTypeLaunchOptions`, `BrowserNewContextOptions`

The `RegressionTests.csproj` already demonstrates this — it references `Microsoft.Playwright` without `Microsoft.Playwright.Xunit`.

### Project Properties

```xml
<PropertyGroup>
  <TargetFramework>net10.0</TargetFramework>
  <ImplicitUsings>enable</ImplicitUsings>
  <Nullable>enable</Nullable>
  <IsPackable>false</IsPackable>
</PropertyGroup>
```

### Global Using

```xml
<ItemGroup>
  <Using Include="Xunit" />
</ItemGroup>
```

This makes `[Fact]`, `[Theory]`, `[Collection]`, `Assert`, etc. available without explicit `using Xunit;` in every file.

### Complete .csproj Template

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

This matches the `RegressionTests.csproj` exactly, ensuring package version consistency across the solution.

## Summary of Findings

| Decision | Recommendation |
|---|---|
| Extend or new skill? | **Extend** existing `playwright-dotnet-conversion` skill (Option C) |
| New templates needed | 3: `BrowserSessionFixture.cs`, `CollectionDefinition.cs`, `collection-fixture-test-template.cs` |
| Mapping reference updates | New "Collection Fixture Patterns" section with 6 entries |
| SKILL.md updates | New section, updated overview table, new example, updated troubleshooting |
| .csproj approach | Clone `RegressionTests.csproj` — no `Microsoft.Playwright.Xunit` needed |
| Target framework | `net10.0` |
| Key architectural difference | Constructor injection + `Assertions.Expect()` instead of base class inheritance + inherited `Expect()` |
| Auth state storage | In-memory only (`NewContextAsync`), no disk artifacts |
| Test execution order | Sequential within collection (xUnit default), no explicit ordering needed |
| Login mechanism | Fixture `InitializeAsync()` performs login before any test class runs |
