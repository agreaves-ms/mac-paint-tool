<!-- markdownlint-disable-file -->
# Release Changes: Doc-Integration Playwright .NET Test Automation

**Related Plan**: doc-integration-tests-plan.instructions.md
**Implementation Date**: 2026-03-04

## Summary

Extended the `playwright-dotnet-conversion` skill with an ICollectionFixture login-once pattern section and three new templates. Created a brand-new `DocIntegrationTests` project with a shared SSO auth fixture, collection definition, and two test classes (login verification + top priorities navigation).

## Changes

### Added

* `tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj` — xUnit test project targeting net10.0 with Playwright 1.58.0, xUnit 2.9.3, and test SDK references
* `tests/playwright/DocIntegrationTests/DocIntegrationFixture.cs` — Shared IAsyncLifetime fixture that authenticates once via SSO persistent context and shares session across all collection test classes
* `tests/playwright/DocIntegrationTests/DocIntegrationCollection.cs` — xUnit collection definition linking "DocIntegration" collection name to DocIntegrationFixture
* `tests/playwright/DocIntegrationTests/LoginTests.cs` — Test 1: Verifies post-login UI (Home, Actions, VM Operations, CI Loop buttons visible) and saves login.png screenshot
* `tests/playwright/DocIntegrationTests/TopPrioritiesTests.cs` — Test 2: Navigates Global Tech Eng > Clinical Manufacturing Supply Operations > Clinical Supply Puurs, clicks Apply, verifies 3 priority items
* `.github/skills/playwright-dotnet-conversion/assets/templates/DocIntegrationFixture.cs` — Template with placeholder tokens for SSO login-once fixture
* `.github/skills/playwright-dotnet-conversion/assets/templates/CollectionDefinition.cs` — Template for xUnit collection definition marker class
* `.github/skills/playwright-dotnet-conversion/assets/templates/collection-fixture-test-template.cs` — Template for collection fixture test class with constructor injection

### Modified

* `.github/skills/playwright-dotnet-conversion/SKILL.md` — Added Collection Fixture Pattern (Login-Once) section, 3 template links, overview table row, Quick Start block, output location, when-to-use row, Example 3, execution block, 3 troubleshooting rows
* `.github/skills/playwright-dotnet-conversion/references/conversion-mapping.md` — Added Collection Fixture Patterns section and ICollectionFixture row to base class selection guide
* `mac-paint-tool.sln` — Added DocIntegrationTests project entry with build configurations and folder nesting

### Removed

## Review Findings Fixes

* `tests/playwright/DocIntegrationTests/TopPrioritiesTests.cs` — Added defensive `GotoAsync("https://doc-integration.pfizer.com/")` at start of test method to ensure correct page state regardless of test execution order (Major finding #1)
* `tests/playwright/DocIntegrationTests/LoginTests.cs` — Added defensive `GotoAsync("https://doc-integration.pfizer.com/")` at start of test method for consistency (Minor finding #2)
* `.copilot-tracking/plans/2026-03-04/doc-integration-tests-plan.instructions.md` — Fixed Step 3.1 annotation to scope "error-free" claim to project files only, noting template files have expected parse errors (Major finding #3)

## Additional or Deviating Changes

* DD-01: Uses `LaunchPersistentContextAsync` (persistent context with disk profile) instead of in-memory `NewContextAsync`
  * SSO cross-origin redirects destroy in-memory contexts — persistent context is required
* Solution file was manually edited instead of using `dotnet sln add` (CLI not available in environment)
  * Functionally equivalent — project reference, build configs, and folder nesting all present
* DR-04: Fixed "Clinicial" typo to "Clinical" in TopPrioritiesTests method name

## Release Summary

Total files affected: 11 (8 added, 3 modified, 0 removed)

**Files created:**
* `tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj` — Project file
* `tests/playwright/DocIntegrationTests/DocIntegrationFixture.cs` — SSO auth fixture
* `tests/playwright/DocIntegrationTests/DocIntegrationCollection.cs` — Collection definition
* `tests/playwright/DocIntegrationTests/LoginTests.cs` — Login verification test
* `tests/playwright/DocIntegrationTests/TopPrioritiesTests.cs` — Top priorities navigation test
* `.github/skills/playwright-dotnet-conversion/assets/templates/DocIntegrationFixture.cs` — Fixture template
* `.github/skills/playwright-dotnet-conversion/assets/templates/CollectionDefinition.cs` — Collection template
* `.github/skills/playwright-dotnet-conversion/assets/templates/collection-fixture-test-template.cs` — Test template

**Files modified:**
* `.github/skills/playwright-dotnet-conversion/SKILL.md` — Extended with ICollectionFixture documentation
* `.github/skills/playwright-dotnet-conversion/references/conversion-mapping.md` — Extended with collection fixture patterns
* `mac-paint-tool.sln` — Added new project entry

**Deployment notes:**
* Requires .NET SDK 10.0+ to build and run
* Requires `$env:APP_USERNAME` and `$env:APP_PASSWORD` to execute tests
* Run `dotnet build` then `playwright.ps1 install --with-deps chromium` before first test run
* Selectors based on user-provided text labels — validate against live site DOM (WI-01)
