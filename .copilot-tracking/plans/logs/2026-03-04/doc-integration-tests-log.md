<!-- markdownlint-disable-file -->
# Planning Log: Doc-Integration Playwright .NET Test Automation

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan.

### Unaddressed Research Items

* DR-01: Selectors based on user-provided text labels — live DOM may differ
  * Source: `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` (Lines 395-405)
  * Reason: Selectors cannot be validated without live site access. User will need to run tests with `HEADED=1` and adjust selectors if they fail
  * Impact: medium

* DR-02: Session timeout duration unknown
  * Source: `.copilot-tracking/research/2026-03-04/doc-integration-playwright-tests-research.md` (Lines 407-410)
  * Reason: Corporate SSO session timeouts vary (15 min to 8 hours). If timeout is short and test suite grows, re-authentication logic may be needed in the fixture
  * Impact: low (current 2-test suite completes quickly)

* DR-03: Parallel test execution via new pages from shared context
  * Source: `.copilot-tracking/research/subagents/2026-03-04/xunit-collection-fixture-playwright-research.md` (Lines 420-440)
  * Reason: Out of scope for initial implementation. Sequential execution is acceptable for 2 tests. Can be added later if suite grows
  * Impact: low

* DR-04: TopPrioritiesTests method name typo — "Clinicial" should be "Clinical"
  * Source: `.copilot-tracking/details/2026-03-04/doc-integration-tests-details.md` (Step 2.5)
  * Reason: Typo in `TopPriorities_ShowsExpectedItems_AfterNavigatingToClinicialSupplyPuurs` — implementation agent should correct to `ClinicalSupplyPuurs`
  * Impact: low (cosmetic, affects readability only)

### Plan Deviations from Research

* DD-01: Persistent context used instead of in-memory context
  * Research recommends: `Browser.NewContextAsync()` (in-memory) for maximum security (no auth tokens on disk)
  * Plan implements: `LaunchPersistentContextAsync` with GUID temp profile directory
  * Rationale: The site uses SSO with cross-origin redirects (confirmed by "Sso Login Unsuccessful" error text). In-memory ephemeral contexts fail during SSO redirect chains — the context gets destroyed during cross-origin navigation. Persistent context is the only approach that survives SSO flows. Security impact is mitigated by GUID-randomized temp dir path and cleanup in `DisposeAsync()`

* DD-02: Extends existing skill rather than creating a new one
  * Research recommends: Option C — extend `playwright-dotnet-conversion` skill with new section and templates
  * Plan implements: Option C as recommended
  * Rationale: The ICollectionFixture pattern is a natural evolution of the existing persistent context pattern. All conversion mappings, locator priorities, and credential policies apply. Single source of truth is preferred

### Review Finding Fixes

* RF-01: Defensive navigation added to TopPrioritiesTests and LoginTests
  * Review found: Test methods lacked `GotoAsync()` at start, contradicting template and documented pattern
  * Fix applied: Added `await _session.Page.GotoAsync("https://doc-integration.pfizer.com/")` as first action in both test methods
  * Impact: Prevents test failures when xUnit executes classes in different order

* RF-02: Documentation precision corrected in plan Step 3.1
  * Review found: Plan claimed "all files verified error-free" but template files with `{{placeholder}}` tokens inherently produce parse errors
  * Fix applied: Scoped claim to "all project files" and noted template parse errors are expected by design
  * Impact: Cosmetic — accurate documentation

## Implementation Paths Considered

### Selected: Extend existing skill + new DocIntegrationTests project

* Approach: Add ICollectionFixture section and templates to `playwright-dotnet-conversion` skill; create a brand-new `DocIntegrationTests` xUnit project with shared fixture, collection definition, and two test classes
* Rationale: Keeps skill knowledge consolidated; new project keeps tests isolated; collection fixture shares authenticated session across test classes
* Evidence: `.copilot-tracking/research/subagents/2026-03-04/sso-dotnet-conversion-skill-research.md` (Lines 165-200)

### IP-01: Create a brand-new standalone skill

* Approach: New skill `.github/skills/sso-test-conversion/SKILL.md` dedicated to SSO collection fixture conversion
* Trade-offs: Clean separation but duplicates conversion mappings, locator priorities, assertion patterns, and credential policy documentation. Two skills to maintain for closely related patterns
* Rejection rationale: ICollectionFixture is an evolution of persistent context — belongs in the same skill

### IP-02: Reuse existing RegressionTests project

* Approach: Add tests to `tests/playwright/RegressionTests/` alongside `PersistentBrowserTestBase.cs`
* Trade-offs: No new project setup needed, but mixes per-method lifecycle (PersistentBrowserTestBase) with per-collection lifecycle (ICollectionFixture). Could confuse which pattern applies to which tests
* Rejection rationale: User explicitly requested "Create a brand new csproj for the tests. do not reuse existing ones"

### IP-03: Per-test login with PersistentBrowserTestBase inheritance

* Approach: Each test class inherits `PersistentBrowserTestBase` and performs its own login
* Trade-offs: Simple, already working pattern. But logs in for every test class — slower and against user requirement
* Rejection rationale: User explicitly stated "we don't want to login every test"

## Suggested Follow-On Work

Items identified during planning that fall outside current scope.

* WI-01: Validate selectors on live site — Use `playwright-automation-msedge` skill to inspect actual DOM and correct selectors if they don't match user-provided text labels (medium priority)
  * Source: DR-01
  * Dependency: DocIntegrationTests project created and building

* WI-02: Add session timeout re-authentication — If SSO sessions expire during long test runs, add a health-check method to the fixture that verifies session validity and re-authenticates if needed (low priority)
  * Source: DR-02
  * Dependency: Session timeout duration discovered empirically

* WI-03: Update existing skill EXECUTION section — Add DocIntegrationTests build/test commands alongside existing MacPaintTool.Tests and RegressionTests commands (low priority)
  * Source: Planning phase Step 1.1
  * Dependency: Phase 1 completion

* WI-04: GitHub Actions workflow for DocIntegrationTests — Add CI step that builds, installs browsers, sets credentials from secrets, and runs tests with TRX output (medium priority)
  * Source: `.github/skills/playwright-dotnet-conversion/SKILL.md` GitHub Actions section
  * Dependency: Phase 2 completion
