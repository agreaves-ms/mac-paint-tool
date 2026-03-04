<!-- markdownlint-disable-file -->
# RPI Validation: Phase 1 — Extend playwright-dotnet-conversion skill

**Plan:** `.copilot-tracking/plans/2026-03-04/doc-integration-tests-plan.instructions.md`
**Phase:** 1 of 3
**Date:** 2026-03-04

## Validation Results

### Step 1.1: SKILL.md Updates — PASS

All 9 required additions verified:

1. 3-row overview table (Ephemeral, Persistent, Collection fixture) — line 18
2. Output location for DocIntegrationTests — line 33
3. Quick Start block for DocIntegrationTests — lines 74-82
4. When-to-use row for ICollectionFixture — line 94
5. "Collection Fixture Pattern (Login-Once)" section — lines 200-301
6. Example 3: SSO login-once with collection fixture — lines 410-460
7. 3 template links (DocIntegrationFixture.cs, CollectionDefinition.cs, collection-fixture-test-template.cs) — lines 466-471
8. 3 troubleshooting rows (session expired, wrong page state, sequential tests) — lines 483-485
9. Execution block for DocIntegrationTests — lines 369-381

### Step 1.2: DocIntegrationFixture.cs Template — PASS

File exists with all placeholder tokens: `{{FixtureClassName}}`, `{{LoginUrl}}`, `{{Namespace}}`, `{{UsernameLabel}}`, `{{PasswordLabel}}`, `{{LoginButtonName}}`, `{{PostLoginWaitLogic}}`, `{{ErrorText}}`, `{{ProfilePrefix}}`. Implements `IAsyncLifetime`, uses `LaunchPersistentContextAsync`, GUID temp dir, env var credentials, cleanup in `DisposeAsync`.

### Step 1.3: CollectionDefinition.cs Template — PASS

File exists with `[CollectionDefinition("{{CollectionName}}")]` attribute, implements `ICollectionFixture<{{FixtureClassName}}>`. Placeholder tokens: `{{Namespace}}`, `{{CollectionName}}`, `{{CollectionClassName}}`, `{{FixtureClassName}}`.

### Step 1.4: collection-fixture-test-template.cs Template — PASS

File exists with `[Collection("{{CollectionName}}")]` attribute, constructor injection `public {{TestClassName}}({{FixtureClassName}} session)`. Placeholder tokens: `{{Namespace}}`, `{{TestClassName}}`, `{{BehaviorDrivenTestName}}`, `{{StartingUrl}}`, `{{StepCode}}`, `{{AssertionCode}}`.

### Step 1.5: conversion-mapping.md Updates — PASS

New "Collection Fixture Patterns (Login-Once)" section exists with 6 mapping rows. ICollectionFixture row added to base class selection guide.

## Phase Summary

- **Overall:** PASS
- **Critical:** 0
- **Major:** 0
- **Minor:** 0
