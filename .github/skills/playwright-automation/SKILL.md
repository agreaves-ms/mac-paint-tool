---
name: playwright-automation
description: 'Unified Playwright browser automation skill without MCP server. Chrome-first with automatic fallback order (msedge, chromium, firefox, webkit). USE FOR: browser testing, UI automation, screenshots, page snapshots, form filling, network interception, test execution, dev server management, accessibility testing. Works with PowerShell 5.1+ and PowerShell 7+ and supports both global playwright-cli and npx playwright-cli fallback.'
user-invocable: true
compatibility: 'Requires Node.js and npm on PATH. PowerShell 5.1+ (Windows) or PowerShell 7+ (cross-platform). Browser strategy supports installed channels first (chrome, msedge), then Playwright-managed engines (chromium, firefox, webkit).'
---

# Playwright Browser Automation Skill

## Overview

Provides complete Playwright browser automation capabilities without the Playwright MCP server, using a **browser-priority strategy**:

1. `chrome` (preferred)
2. `msedge` (fallback)
3. `chromium` (fallback)
4. `firefox` (fallback)
5. `webkit` (fallback)

This workflow is portable across Windows-first environments and still works cross-platform.

### Approaches

1. **Playwright CLI** (`@playwright/cli`) â€” shell commands via terminal, optimized for agents
2. **Direct Playwright API** â€” TypeScript/JavaScript programmatic usage via `playwright` npm package

Use cases:

* Browser testing and UI interaction automation
* Screenshot and PDF capture
* Page snapshot and accessibility tree inspection
* Form filling, clicking, and element interaction
* Network interception and mocking
* End-to-end test execution
* Dev server management for Playwright-accessible testing

## Prerequisites

| Requirement | Detail |
| --- | --- |
| Node.js | 18+ with npm on PATH |
| PowerShell | 5.1+ (Windows built-in) or 7+ |
| Browsers | Preferred: installed Chrome; fallback: installed Edge; optional Playwright browser binaries |

Install Playwright with:

    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1

On PowerShell 7+ (cross-platform), use:

  pwsh -File scripts/Install-Playwright.ps1

If you need non-installed engines (`chromium`, `firefox`, `webkit`), install browsers explicitly:

    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1 -InstallBrowsers:$true

PowerShell 7+ equivalent:

  pwsh -File scripts/Install-Playwright.ps1 -InstallBrowsers:$true

## Quick Start

Install Playwright, start dev server, open browser with fallback, take screenshot:

    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1
    powershell -ExecutionPolicy Bypass -File scripts/Start-DevServer.ps1 -Command "npm run dev -- --port 5174" -Port 5174
    powershell -ExecutionPolicy Bypass -File scripts/Start-Browser.ps1 -Url "http://localhost:5174" -BrowserType chrome -Headed
    powershell -ExecutionPolicy Bypass -File scripts/Take-Screenshot.ps1 -Filename "page.png"
    powershell -ExecutionPolicy Bypass -File scripts/Stop-Browser.ps1

If Chrome launch fails, retry with `-BrowserType msedge`, then `chromium`, `firefox`, or `webkit`.

## Agent Execution Rules (Required)

When using this skill from an agent runtime:

* For maximum Windows compatibility, run scripts via:
  * `powershell -ExecutionPolicy Bypass -File scripts/<script>.ps1`
  * or set once per terminal: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
* On PowerShell 7+ (including non-Windows), use `pwsh -File scripts/<script>.ps1`.
* If `playwright-cli` command invocation fails (policy/path issues), fall back to `npx playwright-cli`.
* Run long-lived commands in the background (non-blocking):
  * Dev server startup (`Start-DevServer.ps1`)
  * Browser startup (`Start-Browser.ps1`)
* For user-visible browser interaction, always launch with `-Headed`.
* After launching, verify headed state with `npx playwright-cli list` (or `playwright-cli list`) and confirm `headed: true`.
* If a task mentions export terms such as `export`, `save as`, `download`, `SVG`, or `PNG`, treat it as a browser automation requirement first.
* In standalone mode (`http://localhost:5174`), satisfy export requests with browser-available APIs (`canvas.toDataURL()`, Blob download links, in-page serialization) instead of Electron IPC/menu handlers.
* For single-expression JavaScript, use `Invoke-BrowserAction.ps1 -Action eval`.
* For multi-statement scripts (complex drawing, multi-step DOM manipulation), use `npx playwright-cli run-code "async (page) => { ... }"`.
* Prefer direct Canvas 2D API calls via `run-code` over simulated pointer events for deterministic drawing.

### Browser Selection and Fallback Policy (Mandatory)

Use this order unless the user explicitly requests a specific browser:

1. Try `chrome`
2. If launch fails, try `msedge`
3. If launch fails, try `chromium`
4. If launch fails, try `firefox`
5. If launch fails, try `webkit`

Notes:

* `chrome` and `msedge` rely on system-installed channels.
* `chromium`, `firefox`, and `webkit` may require `npx playwright install` first.
* Keep the same session and test flow once a browser successfully launches; do not switch mid-test unless required.

### Credentials Policy (Mandatory)

* **NEVER hardcode usernames, passwords, tokens, or secrets in any file**.
* **Always read credentials from environment variables** at runtime.
  * PowerShell: `$env:APP_USERNAME`, `$env:APP_PASSWORD`
  * Node/Playwright: `process.env.APP_USERNAME`, `process.env.APP_PASSWORD`
* **If environment variables are not set, prompt the user**.
* **Do not log or echo credentials** in terminal output.

### CLI Command Pitfalls (Critical)

* Use `open`, not `browser`:
  * Correct: `npx playwright-cli open [url] --browser chrome --headed`
* `--viewport` is not valid on `open`; call resize separately:
  * `npx playwright-cli resize 1400 900`
* For SSO/OAuth redirect sites, use persistent profiles:
  * `npx playwright-cli open --browser <browser> --headed --persistent --profile ".playwright-cli/browser-profile"`
  * then navigate with `npx playwright-cli goto "https://example.com/login"`
* `$env:username` is a built-in Windows variable; do not use it for app credentials.
* `screenshot` command may generate timestamped files; parse output and rename/copy if deterministic filenames are required.

### Export Semantics in Standalone Mode

`window.electronAPI` is unavailable in standalone mode, so menu-triggered Electron exports do not apply.

For SVG or downloadable artifact requests in Playwright automation:

1. Generate content in page context (`evaluate`/`run-code`).
2. Trigger browser download (anchor + Blob URL).
3. Verify output exists before finishing.

## Parameters Reference

### Install-Playwright

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| Install CLI | `-InstallCli` | `$true` | Install `@playwright/cli` globally |
| Install API | `-InstallApi` | `$false` | Install `playwright` and `@playwright/test` as dev dependencies |
| Install Browsers | `-InstallBrowsers` | `$false` | Install Playwright browser binaries (enable when fallback reaches managed engines) |

### Start-Browser

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| URL | `-Url` | (none) | URL to navigate to after opening |
| Headed | `-Headed` | `$false` | Open browser in headed mode |
| Session | `-Session` | (none) | Named session for isolation |
| Persistent | `-Persistent` | `$false` | Use persistent browser profile |
| Profile | `-ProfilePath` | (none) | Path to browser profile directory |
| Browser | `-BrowserType` | `chrome` | Browser/channel to launch (`chrome`, `msedge`, `chromium`, `firefox`, `webkit`) |
| Viewport | `-ViewportSize` | `1280x720` | Viewport dimensions (`WIDTHxHEIGHT`) |

Other script parameters (`Start-DevServer`, `Stop-DevServer`, `Invoke-BrowserAction`, `Take-Screenshot`, `Run-Tests`) follow existing project scripts and remain unchanged.

## Workflow Pattern for Agents

1. **Execution policy setup (Windows recommended):** `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
2. **Install:** `Install-Playwright.ps1`
3. **Start server:** `Start-DevServer.ps1 -Command "<start command>"`
4. **Open browser (Chrome first):** `Start-Browser.ps1 -BrowserType chrome -Headed`
5. **Fallback if needed:** retry with `msedge`, then `chromium`, `firefox`, `webkit`
6. **Verify headed mode:** `playwright-cli list` or `npx playwright-cli list`
7. **Snapshot:** `Invoke-BrowserAction.ps1 -Action snapshot`
8. **Interact:** click/fill/type/select/drag/eval/run-code as needed
9. **Export if requested:** browser-only flow in standalone mode
10. **Screenshot:** `Take-Screenshot.ps1 -Filename "result.png"`
11. **Close browser:** `Stop-Browser.ps1`
12. **Stop server:** `Stop-DevServer.ps1`

## Templates and References

Use the same templates/references as existing Playwright skills:

* `assets/templates/playwright.config.ts`
* `assets/templates/cli.config.json`
* `assets/templates/test-spec.ts`
* `assets/templates/page-interaction.ts`
* `references/reference.md`
* `references/cli-commands.md`
* `references/api-mapping.md`
* `references/pitfalls.md`

## Related Skills

If you need to convert automation steps into Playwright .NET xUnit tests, continue with:

* `../playwright-dotnet-conversion/SKILL.md`

## Troubleshooting

| Symptom | Cause | Resolution |
| --- | --- | --- |
| `playwright-cli cannot be loaded because running scripts is disabled` | PowerShell execution policy restricted | Use `powershell -ExecutionPolicy Bypass -File ...` or `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| `playwright-cli: command not found` | CLI not installed or unavailable on PATH | Run `Install-Playwright.ps1`, or use `npx playwright-cli` |
| Browser launch fails on `chrome` | Chrome channel unavailable | Retry with `-BrowserType msedge`; then continue fallback order |
| Browser launch fails on `msedge` | Edge unavailable | Retry with `chromium`/`firefox`/`webkit` after `-InstallBrowsers:$true` |
| `error: unknown '--viewport' option` | Unsupported flag on `open` | Use `resize` command after opening browser |
| Snapshot refs stop working | DOM changed | Re-run snapshot and use new refs |
| SSO redirects close context | Non-persistent context | Open persistent profile first, then navigate |
| `electronAPI` undefined | Standalone renderer mode | Expected; use browser-only export methods |
