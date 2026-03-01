---
description: "Runs a user workflow in Playwright automation, converts it to a Playwright .NET test, executes tests, and verifies results"
argument-hint: "workflow=... [baseUrl=http://localhost:5174] [testName=WorkflowRegression]"
---

# Playwright Workflow to .NET Test

## Inputs

* `${input:workflow}`: (Required) Ordered workflow steps provided by the user.
* `${input:baseUrl:http://localhost:5174}`: (Optional) Base URL for automation and generated test.
* `${input:testName:WorkflowRegression}`: (Optional) Test class and method prefix.

## Required Steps

### Step 1: Parse and validate workflow

1. Parse `${input:workflow}` into explicit action steps.
2. If steps are ambiguous, ask concise clarifying questions before execution.
3. Keep assumptions minimal and state them in the final summary.

### Step 2: Run Playwright automation first

1. Use the Playwright automation skill flow to execute the workflow in a browser.
2. Capture selectors and interaction strategy used for each step.
3. Verify expected visual or DOM outcomes and record pass or fail evidence.
4. Save temporary automation artifacts only under `.copilot-tracking/`.

### Step 3: Generate Playwright .NET test

1. Create one Playwright .NET xUnit test that reproduces the same workflow.
2. Write the test file under `tests/playwright/MacPaintTool.Tests`.
3. Use `Microsoft.Playwright.Xunit` and deterministic assertions.
4. Prefer role and label locators, then test id, then stable CSS.
5. Do not use `Task.Delay`; use `Expect(...)` and explicit waits.

### Step 4: Execute and verify .NET test

1. Build and run the generated test with `dotnet test`.
2. Install Playwright browsers if required by the test environment.
3. Report execution status, failures, and actionable fixes when failures occur.
4. Confirm whether the generated test behavior matches the workflow intent.
5. Use these commands unless the project path changes:

```bash
dotnet build tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release
pwsh tests/playwright/MacPaintTool.Tests/bin/Release/net10.0/playwright.ps1 install --with-deps chromium
dotnet test tests/playwright/MacPaintTool.Tests/MacPaintTool.Tests.csproj -c Release --logger "trx;LogFileName=playwright-dotnet.trx"
```

### Step 5: Return structured output

1. Return a concise Phase 1 automation summary:
   * Workflow executed
   * Selector strategy
   * Verification evidence and outcome
2. Return a concise Phase 2 .NET summary:
   * File path created under `tests/playwright/MacPaintTool.Tests`
   * Test name
   * Commands run
   * Pass or fail result with a one-line test output summary
3. If anything fails, include the smallest fix needed and rerun once.

## Required Protocol

1. Always perform automation execution before writing the .NET test.
2. Keep all temporary files in `.copilot-tracking/`.
3. Keep generated tests in `tests/playwright/MacPaintTool.Tests`.
4. Prefer precise, minimal changes and avoid unrelated edits.

---

Proceed with the user's request following the Required Steps.
