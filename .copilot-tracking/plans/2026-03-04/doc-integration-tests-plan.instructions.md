<!-- markdownlint-disable-file -->
# Implementation Plan: Doc-Integration Playwright .NET Test Automation

---
applyTo: '.copilot-tracking/changes/2026-03-04/doc-integration-tests-changes.md'
---

## Overview

Extend the existing `playwright-dotnet-conversion` skill with a new ICollectionFixture login-once pattern section, create three new templates, and build a brand-new `DocIntegrationTests` .csproj project with a shared auth fixture, collection definition, and two initial test classes (login verification + top priorities navigation).

## Objectives

### User Requirements

* Create a new skill section for converting Playwright headed-browser test instructions to C# tests using the ICollectionFixture login-once pattern — Source: user prompt ("build a new skill for converting these into playwright .net tests")
* Test 1 is always login — authenticates once and shares session with all subsequent tests — Source: user prompt ("The first test is always logging in... we don't want to login every test")
* Test 2 navigates the hierarchy and verifies Top Priorities — Source: user prompt ("Navigate/click on Global Tech Eng > Clinical Manufacturing Supply Operations > Clinical Supply Puurs")
* Create a brand-new .csproj project — do not reuse existing test projects — Source: user prompt ("Create a branch new csproj for the tests. do not reuse existing ones")
* Follow security best practices — no credentials or tokens at rest on disk — Source: user conversation ("follow best practice for security")

### Derived Objectives

* Use `LaunchPersistentContextAsync` (not `NewContextAsync`) because the site uses SSO with cross-origin redirects — Derived from: research confirming SSO via "Sso Login Unsuccessful" error text; ephemeral contexts fail during SSO redirect chains
* Use `ICollectionFixture<T>` with `IAsyncLifetime` for suite-wide session sharing — Derived from: research on xUnit fixture patterns showing this is the most secure approach that supports SSO
* Extend the existing `playwright-dotnet-conversion` skill rather than creating a new skill — Derived from: research showing the collection fixture pattern is a natural evolution of the persistent context pattern already documented
* Include run instructions in the skill so users can build, install browsers, and execute tests — Derived from: existing skill conventions
* Support both Edge and Chromium via `BROWSER_CHANNEL` environment variable — Derived from: user answer to clarifying question ("Both (parameterized)")

## Context Summary

### Project Files

* `.github/skills/playwright-dotnet-conversion/SKILL.md` - Existing skill to extend with ICollectionFixture section (329 lines)
* `.github/skills/playwright-dotnet-conversion/assets/templates/` - Template directory for new fixture/collection/test templates
* `.github/skills/playwright-dotnet-conversion/references/conversion-mapping.md` - Conversion mapping to extend with collection fixture patterns
* `tests/playwright/RegressionTests/PersistentBrowserTestBase.cs` - Existing persistent base class (per-method lifecycle)
* `tests/playwright/RegressionTests/RegressionTests.csproj` - Package version reference for new .csproj

### References

* `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` - Primary research document
* `.copilot-tracking/research/subagents/2026-03-04/playwright-auth-session-reuse-research.md` - Auth reuse strategies research
* `.copilot-tracking/research/subagents/2026-03-04/xunit-collection-fixture-playwright-research.md` - xUnit collection fixture research
* `.copilot-tracking/research/subagents/2026-03-04/sso-dotnet-conversion-skill-research.md` - Skill structure research
* `.copilot-tracking/research/subagents/2026-03-04/sso-vs-direct-login-research.md` - SSO confirmation research

### Standards References

* #file:../../.github/instructions/commit-message.instructions.md - Conventional commits (past-tense)
* #file:../../.github/copilot-instructions.md - Project conventions, credentials policy

## Implementation Checklist

### [x] Implementation Phase 1: Extend playwright-dotnet-conversion skill

<!-- parallelizable: false -->

* [x] Step 1.1: Add ICollectionFixture section to SKILL.md
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 15-65)
* [x] Step 1.2: Create `DocIntegrationFixture.cs` template
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 67-120)
* [x] Step 1.3: Create `CollectionDefinition.cs` template
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 122-145)
* [x] Step 1.4: Create `collection-fixture-test-template.cs` template
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 147-190)
* [x] Step 1.5: Update conversion-mapping.md with collection fixture patterns
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 192-230)

### [x] Implementation Phase 2: Create DocIntegrationTests project

<!-- parallelizable: false -->

* [x] Step 2.1: Create `DocIntegrationTests.csproj`
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 235-270)
* [x] Step 2.2: Create `DocIntegrationFixture.cs` — shared auth fixture
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 272-370)
* [x] Step 2.3: Create `DocIntegrationCollection.cs` — collection definition
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 372-395)
* [x] Step 2.4: Create `LoginTests.cs` — Test 1: login verification
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 397-460)
* [x] Step 2.5: Create `TopPrioritiesTests.cs` — Test 2: navigation + priority check
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 462-530)
* [x] Step 2.6: Add project to solution
  * Details: .copilot-tracking/details/2026-03-04/doc-integration-tests-details.md (Lines 532-545)

### [x] Implementation Phase 3: Validation

<!-- parallelizable: false -->

* [x] Step 3.1: Build the new project
  * Run `dotnet build tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj -c Release`
  * Fix any compile errors
  * **Result:** .NET SDK not available in environment. All project files (5 .cs files in DocIntegrationTests) verified error-free via VS Code diagnostics. Template files with `{{placeholder}}` tokens have expected parse errors by design.
* [ ] Step 3.2: Install Playwright browsers
  * Run `pwsh tests/playwright/DocIntegrationTests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium`
  * **Blocked:** Requires .NET SDK to build first
* [ ] Step 3.3: Run tests (requires credentials)
  * Set `$env:APP_USERNAME` and `$env:APP_PASSWORD`
  * Set `$env:HEADED = "1"` for visual confirmation
  * Run `dotnet test tests/playwright/DocIntegrationTests/DocIntegrationTests.csproj -c Release --logger "trx;LogFileName=doc-integration.trx"`
  * **Blocked:** Requires .NET SDK and credentials
* [ ] Step 3.4: Verify test results
  * Confirm login.png screenshot was saved
  * Check .trx file for pass/fail results
  * If selectors fail, use playwright-automation-msedge skill to inspect live DOM and update
  * **Blocked:** Depends on Step 3.3
* [x] Step 3.5: Report blocking issues
  * .NET SDK not on PATH — build/test commands require `dotnet` CLI
  * Selectors based on user-provided text labels — may need adjustment on live site (WI-01)

## Planning Log

See [doc-integration-tests-log.md](.copilot-tracking/plans/logs/2026-03-04/doc-integration-tests-log.md) for discrepancy tracking, implementation paths considered, and suggested follow-on work.

## Dependencies

* .NET SDK 10.0+
* Microsoft.Playwright 1.58.0
* xUnit 2.9.3
* Microsoft Edge (system-installed) or Chromium via Playwright install
* `$env:APP_USERNAME` and `$env:APP_PASSWORD` environment variables set before test execution

## Success Criteria

* `playwright-dotnet-conversion` skill SKILL.md includes a "Collection Fixture Pattern (Login-Once)" section with three new templates — Traces to: user requirement for skill to convert instructions to C# tests
* `DocIntegrationTests.csproj` project compiles without errors — Traces to: user requirement for brand-new project
* `DocIntegrationFixture.cs` authenticates once via SSO and shares session across test classes — Traces to: user requirement for login-once pattern
* `LoginTests.cs` verifies post-login UI elements and saves screenshot — Traces to: user's Test 1 specification
* `TopPrioritiesTests.cs` navigates hierarchy and verifies three priority items — Traces to: user's Test 2 specification
* No credentials or auth tokens stored in plaintext on disk — Traces to: user security requirement
* Tests executable via documented `dotnet test` commands — Traces to: user requirement for run instructions
