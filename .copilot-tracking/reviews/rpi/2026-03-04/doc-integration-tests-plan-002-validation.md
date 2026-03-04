<!-- markdownlint-disable-file -->
# RPI Validation: Phase 2 — Create DocIntegrationTests project

**Plan:** `.copilot-tracking/plans/2026-03-04/doc-integration-tests-plan.instructions.md`
**Phase:** 2 of 3
**Date:** 2026-03-04

## Validation Results

### Step 2.1: DocIntegrationTests.csproj — PASS

All specifications match: net10.0, ImplicitUsings, Nullable, IsPackable=false, Playwright 1.58.0, xunit 2.9.3, Microsoft.NET.Test.Sdk 17.14.1, xunit.runner.visualstudio 3.1.4, coverlet.collector 6.0.4, Using Include="Xunit". No Microsoft.Playwright.Xunit reference (correct).

### Step 2.2: DocIntegrationFixture.cs — PASS

Implements IAsyncLifetime. Uses LaunchPersistentContextAsync with GUID temp dir. Reads APP_USERNAME/APP_PASSWORD from env vars with InvalidOperationException on missing. BROWSER_CHANNEL defaults to msedge. HEADED env var support. Login form fill with GetByRole. WaitForFunctionAsync for SSO redirect (30s). Checks for "Sso Login Unsuccessful". DisposeAsync cleans up context and profile dir.

### Step 2.3: DocIntegrationCollection.cs — PASS

`[CollectionDefinition("DocIntegration")]` attribute applied. Implements `ICollectionFixture<DocIntegrationFixture>`. Namespace: DocIntegrationTests.

### Step 2.4: LoginTests.cs — PASS

`[Collection("DocIntegration")]`. Constructor injection. Verifies Home, Actions, VM Operations, CI Loop buttons. Checks for "Sso Login Unsuccessful" and "Invalid credentials" error text absence. Saves login.png screenshot. Uses `Assertions.Expect()` (static). 10s timeout on first assertion.

### Step 2.5: TopPrioritiesTests.cs — PASS

`[Collection("DocIntegration")]`. Constructor injection. Navigates Global Tech Eng > Clinical Manufacturing Supply Operations > Clinical Supply Puurs. Clicks Apply. WaitForLoadStateAsync(NetworkIdle). Verifies Top Priorities heading (15s), M2 MF RFT (5s), Budget overview S2F2 (5s), mRNA never frozen syringe plan (5s). **DR-04 fix confirmed:** method name uses "Clinical" (correct), not "Clinicial".

### Step 2.6: Solution file — PASS

DocIntegrationTests project entry present with correct project type GUID. Build configurations for Debug|Any CPU and Release|Any CPU. Nested under playwright solution folder.

## Phase Summary

- **Overall:** PASS
- **Critical:** 0
- **Major:** 0
- **Minor:** 0
