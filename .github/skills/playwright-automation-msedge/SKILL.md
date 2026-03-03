---
name: playwright-automation-msedge
description: 'Playwright browser automation using Microsoft Edge — no Chromium download required. USE FOR: browser testing, UI interaction automation, screenshots, page snapshots, form filling, network interception, test execution, dev server management, accessibility testing. Uses the system-installed Edge browser via the msedge channel. All scripts are PowerShell 5.1+ compatible (no pwsh requirement). Provides PowerShell scripts for installation, browser session management, screenshot capture, test execution, and dev server startup. Includes reference documentation for all 18 Playwright feature categories, CLI command reference, API mapping tables, and ready-to-use code templates. WHEN TO USE: automating browser interactions with Edge, writing Playwright tests without downloading Chromium, capturing screenshots, testing web applications, running end-to-end tests, starting dev servers for Playwright testing.'
user-invocable: true
compatibility: 'Requires Node.js and npm on PATH. PowerShell 5.1+ (ships with Windows). Uses system-installed Microsoft Edge — no browser download needed.'
---

# Playwright Browser Automation Skill (Edge)

## Overview

Provides complete Playwright browser automation capabilities using **Microsoft Edge** — no Chromium download required. This is a variant of the `playwright-automation` skill optimized for Windows environments with PowerShell 5.1 and Edge pre-installed.

### Key Differences from `playwright-automation`

| Feature | `playwright-automation` | `playwright-automation-msedge` |
| --- | --- | --- |
| **Default browser** | `chrome` | `msedge` |
| **Browser download** | Downloads Chromium by default | Skipped — uses system Edge |
| **PowerShell version** | Requires PowerShell 7+ (`pwsh`) | Works with PowerShell 5.1+ |
| **CLI invocation** | Expects global `playwright-cli` | Falls back to `npx playwright-cli` |
| **Execution policy** | Assumes `Bypass` | Handles restricted policies |

### Approaches

1. **Playwright CLI** (`@playwright/cli`) — Shell commands via terminal, optimized for agents
2. **Direct Playwright API** — TypeScript/JavaScript programmatic usage via `playwright` npm package with `channel: 'msedge'`

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
| PowerShell | 5.1+ (ships with Windows 10/11) |
| Microsoft Edge | Pre-installed (ships with Windows 10/11) |

Install Playwright using the provided script:

    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1

## Quick Start

Install Playwright, start a dev server, open Edge, take a screenshot:

    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1
    powershell -ExecutionPolicy Bypass -File scripts/Start-DevServer.ps1 -Command "npm run dev -- --port 5174" -Port 5174
    powershell -ExecutionPolicy Bypass -File scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Headed
    powershell -ExecutionPolicy Bypass -File scripts/Take-Screenshot.ps1 -Filename "page.png"
    powershell -ExecutionPolicy Bypass -File scripts/Stop-Browser.ps1

> **Note:** Use `powershell -ExecutionPolicy Bypass -File` to run scripts on systems with restricted execution policies. Alternatively, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` once per terminal session.

## Agent Execution Rules (Required)

When using this skill from an agent runtime:

* **Always bypass execution policy** when invoking scripts:
    * Use `powershell -ExecutionPolicy Bypass -File scripts/<script>.ps1` or
    * Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first in the terminal
* If `playwright-cli` fails with execution policy errors, the scripts automatically fall back to `npx playwright-cli`
* Run long-lived commands in the background (non-blocking):
    * Dev server startup (`Start-DevServer.ps1`)
    * Browser startup (`Start-Browser.ps1`)
* For user-visible browser interaction, always launch with `-Headed`.
* After launching, verify headed state with `npx playwright-cli list` and confirm `headed: true`.
* If a task mentions export terms such as `export`, `save as`, `download`, `SVG`, or `PNG`, treat it as a browser automation requirement first.
* In standalone mode (`http://localhost:5174`), satisfy export requests with browser-available APIs (for example, `canvas.toDataURL()`, Blob download links, in-page serialization) instead of Electron IPC/menu handlers.
* For single-expression JavaScript, use `Invoke-BrowserAction.ps1 -Action eval`. For multi-statement scripts (complex drawing, multi-step DOM manipulation), use `npx playwright-cli run-code "async (page) => { ... }"` directly — `eval` wraps code as `() => (code)` and cannot handle statements or declarations.
* Prefer direct Canvas 2D API calls via `run-code` over simulating pointer events for complex drawing — direct context drawing produces deterministic, pixel-accurate results without tool state dependencies.

### Credentials Policy (Mandatory)

* **NEVER hardcode usernames, passwords, tokens, or secrets in any file** — not in scripts, templates, SKILL files, tracking files, or commit messages.
* **Always read credentials from environment variables** at runtime. Use `$env:APP_USERNAME` and `$env:APP_PASSWORD` (not `$env:username` — that's a Windows built-in). In Playwright code, use `process.env.APP_USERNAME` and `process.env.APP_PASSWORD`.
* **If environment variables are not set, prompt the user** — ask the user to provide credentials or set them before proceeding. Never assume or guess credential values.
* **Do not log or echo credentials** in terminal output. When filling password fields, pass values directly without printing them.
* Example workflow for login automation:
    ```
    # User sets env vars (agent should ask user to do this if not set)
    $env:APP_USERNAME = "<ask user>"
    $env:APP_PASSWORD = "<ask user>"

    # Agent reads from env vars when filling fields
    npx playwright-cli fill <username-ref> $env:APP_USERNAME
    npx playwright-cli fill <password-ref> $env:APP_PASSWORD
    ```

### CLI Command Pitfalls (Critical)

* **The CLI subcommand to launch a browser is `open`, NOT `browser`**. Running `npx playwright-cli browser` will hang indefinitely — it is not a valid command. Correct: `npx playwright-cli open [url] --browser msedge --headed`.
* **`--viewport` is NOT a valid flag on `open`**. The `open` command does not accept viewport options. To set viewport size, open the browser first, then run `npx playwright-cli resize <width> <height>` as a separate command.
* **SSO/OAuth sites cause browser context to close** — When navigating to URLs that perform SSO redirects (e.g., corporate login pages), the default in-memory browser context gets destroyed during cross-origin navigation, producing `Error: page._snapshotForAI: Target page, context or browser has been closed`. **Fix:** Always use `--persistent --profile ".playwright-cli/edge-profile"` when opening browsers that will visit SSO/auth-redirect sites. This creates a persistent browser context that survives cross-origin redirects.
* **Open the browser first, then navigate** — For SSO sites, open the browser to `about:blank` with `--persistent --profile`, then use `npx playwright-cli goto <url>` as a separate step. Combining `open <url>` with SSO URLs may still fail even with persistent profiles.
* **`$env:username` is a Windows built-in environment variable** — On Windows, `$env:username` always resolves to the current Windows login user (e.g., `GOVINK18`), not a custom-set variable. If you set `$env:username = "custom"` in one terminal session, it will NOT carry over to other sessions, and in many shells the OS value overrides it. **Use a different variable name** (e.g., `$env:APP_USERNAME`) for credentials, or pass the value directly as a literal string.
* **`screenshot` command produces timestamped filenames** — The `npx playwright-cli screenshot` command saves files with auto-generated timestamped names like `page-2026-03-03T16-59-55-712Z.png`, not a predictable name. To save to a specific filename, read the output to get the actual filename, then copy/rename it. Example:
    ```
    npx playwright-cli screenshot
    # Output: [Screenshot of viewport](.playwright-cli\page-2026-03-03T16-59-55-712Z.png)
    Copy-Item ".playwright-cli\page-2026-03-03T16-59-55-712Z.png" "desired-name.png"
    ```

### Export Semantics in Standalone Mode

`window.electronAPI` is unavailable in standalone mode, so menu-triggered Electron exports do not apply.

For SVG requests in Playwright automation:

1. Generate SVG content in the page context (`evaluate`/`run-code`).
2. Trigger a browser download (anchor + Blob URL).
3. Verify the downloaded artifact exists before finishing.

Run Playwright tests:

    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1
    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1 -TestFile "tests/my.spec.ts" -Headed

## Parameters Reference

### Install-Playwright

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| Install CLI | `-InstallCli` | `$true` | Install @playwright/cli globally |
| Install API | `-InstallApi` | `$false` | Install playwright and @playwright/test as devDeps |
| Install Browsers | `-InstallBrowsers` | `$false` | Run `npx playwright install` for browser binaries (disabled by default — Edge is used) |

### Start-DevServer

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| Command | `-Command` | (none, required) | Shell command to start the server |
| Port | `-Port` | `5174` | Port for readiness checking |
| Wait | `-Wait` | `$true` | Wait until server is ready before returning |
| Timeout | `-TimeoutSeconds` | `30` | Seconds to wait for server readiness |
| ReadinessUrl | `-ReadinessUrl` | `http://localhost:<Port>` | Custom URL to poll for readiness |

### Stop-DevServer

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| Port | `-Port` | `5174` | Port of the dev server to stop |

### Start-Browser

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| URL | `-Url` | (none) | URL to navigate to after opening |
| Headed | `-Headed` | `$false` | Open browser in headed (visible) mode |
| Session | `-Session` | (none) | Named session for isolation |
| Persistent | `-Persistent` | `$false` | Use persistent browser profile |
| Profile | `-ProfilePath` | (none) | Path to browser profile directory |
| Browser | `-BrowserType` | `msedge` | Browser/channel: msedge, chrome, chromium, firefox, webkit |
| Viewport | `-ViewportSize` | `1280x720` | Viewport dimensions (WIDTHxHEIGHT) |

### Stop-Browser

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| Session | `-Session` | (none) | Close a specific named session |
| All | `-All` | `$false` | Close all browser sessions |
| Force | `-Force` | `$false` | Force kill all sessions (kill-all) |

### Invoke-BrowserAction

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| Action | `-Action` | (none) | Action: click, fill, type, select, hover, drag, etc. |
| Ref | `-Ref` | (none) | Element reference from snapshot (e.g., e3) |
| Value | `-Value` | (none) | Value for fill, type, or select actions |
| Target | `-Target` | (none) | Target ref for drag action |
| Session | `-Session` | (none) | Named session to target |

### Take-Screenshot

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| Filename | `-Filename` | (auto-generated) | Output filename for the screenshot |
| Ref | `-Ref` | (none) | Element ref to screenshot (instead of page) |
| Format | `-Format` | `png` | Output format: png or pdf |
| Session | `-Session` | (none) | Named session to target |

### Run-Tests

| Parameter | Flag | Default | Description |
| --- | --- | --- | --- |
| TestFile | `-TestFile` | (none) | Specific test file to run |
| Headed | `-Headed` | `$false` | Run tests with visible browser |
| Debug | `-Debug` | `$false` | Run in debug mode |
| ShowReport | `-ShowReport` | `$false` | Open HTML report after tests |
| Grep | `-Grep` | (none) | Filter tests by title pattern |
| Project | `-Project` | (none) | Run specific project (chromium, firefox, webkit) |
| Workers | `-Workers` | (none) | Number of parallel workers |

## Script Reference

### Installation

    # Install CLI globally + initialize Edge workspace (no browser download)
    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1

    # Install API packages as dev dependencies
    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1 -InstallApi -InstallCli:$false

    # Install everything (including optional browser download)
    powershell -ExecutionPolicy Bypass -File scripts/Install-Playwright.ps1 -InstallApi -InstallBrowsers:$true

### Dev Server Management

    # Start dev server with an npm script
    powershell -ExecutionPolicy Bypass -File scripts/Start-DevServer.ps1 -Command "npm run dev -- --port 5174"

    # Start with a custom command and port
    powershell -ExecutionPolicy Bypass -File scripts/Start-DevServer.ps1 -Command "npx vite --config vite.renderer.config.ts --port 3000" -Port 3000

    # Start without waiting for readiness
    powershell -ExecutionPolicy Bypass -File scripts/Start-DevServer.ps1 -Command "node server.js" -Port 8080 -Wait:$false

    # Stop the dev server
    powershell -ExecutionPolicy Bypass -File scripts/Stop-DevServer.ps1

    # Stop a dev server on a custom port
    powershell -ExecutionPolicy Bypass -File scripts/Stop-DevServer.ps1 -Port 3000

### Browser Session Management

    # Open headed Edge browser and navigate
    powershell -ExecutionPolicy Bypass -File scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Headed

    # Open named session for isolation
    powershell -ExecutionPolicy Bypass -File scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Session "testing" -Headed

    # Open with specific viewport
    powershell -ExecutionPolicy Bypass -File scripts/Start-Browser.ps1 -Url "http://localhost:5174" -ViewportSize "1400x1100" -Headed

    # Open with persistent profile for SSO/auth-redirect sites
    # Step 1: Open browser to blank page with persistent profile
    npx playwright-cli open --browser msedge --headed --persistent --profile ".playwright-cli/edge-profile"
    # Step 2: Resize viewport
    npx playwright-cli resize 1400 900
    # Step 3: Navigate to the SSO site
    npx playwright-cli goto "https://example.com/login"

    # Close specific session
    powershell -ExecutionPolicy Bypass -File scripts/Stop-Browser.ps1 -Session "testing"

    # Close all sessions
    powershell -ExecutionPolicy Bypass -File scripts/Stop-Browser.ps1 -All

    # Force kill all
    powershell -ExecutionPolicy Bypass -File scripts/Stop-Browser.ps1 -Force

### Browser Interaction

    # Take page snapshot to get element refs
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action snapshot

    # Click an element
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action click -Ref e3

    # Fill a form field
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action fill -Ref e5 -Value "user@example.com"

    # Type text into focused element
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action type -Value "search query"

    # Select dropdown option
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action select -Ref e9 -Value "option-value"

    # Hover over element
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action hover -Ref e4

    # Drag element to target
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action drag -Ref e2 -Target e8

    # Press keyboard key
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action press -Value "Enter"

    # Evaluate a single JavaScript expression
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action eval -Value "document.title"

    # For multi-statement scripts, use run-code directly via CLI
    # npx playwright-cli run-code "async (page) => { await page.evaluate(() => { /* complex logic */ }); }"

    # Navigate to URL
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action goto -Value "http://localhost:5174"

    # Accept dialog
    powershell -ExecutionPolicy Bypass -File scripts/Invoke-BrowserAction.ps1 -Action dialog-accept

### Screenshots and PDF

    # Full page screenshot
    powershell -ExecutionPolicy Bypass -File scripts/Take-Screenshot.ps1 -Filename "page.png"

    # Element screenshot
    powershell -ExecutionPolicy Bypass -File scripts/Take-Screenshot.ps1 -Ref e5 -Filename "element.png"

    # Save as PDF
    powershell -ExecutionPolicy Bypass -File scripts/Take-Screenshot.ps1 -Format pdf -Filename "page.pdf"

    # Screenshot in named session
    powershell -ExecutionPolicy Bypass -File scripts/Take-Screenshot.ps1 -Session "testing" -Filename "result.png"

### Test Execution

    # Run all tests
    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1

    # Run specific test file with visible browser
    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1 -TestFile "tests/my.spec.ts" -Headed

    # Run in debug mode
    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1 -Debug

    # Filter tests by name
    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1 -Grep "navigation"

    # Run specific browser project
    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1 -Project chromium

    # Show HTML report
    powershell -ExecutionPolicy Bypass -File scripts/Run-Tests.ps1 -ShowReport

## Workflow Pattern for Agents

Agents using this skill follow this interaction pattern:

1. **Set execution policy**: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
2. **Install**: Run `Install-Playwright.ps1` if Playwright is not installed
3. **Start server**: Run `Start-DevServer.ps1 -Command "<your start command>"` to serve the web app
4. **Open browser**: Run `Start-Browser.ps1 -Url "http://localhost:5174" -Headed`
5. **Verify headed mode**: Run `npx playwright-cli list` and confirm the session reports `headed: true`
6. **Snapshot**: Run `Invoke-BrowserAction.ps1 -Action snapshot` to get element refs
7. **Interact**: Use `Invoke-BrowserAction.ps1` with refs from snapshot
8. **Export if requested**: Use browser APIs in `eval`/`run-code` to create/download files (including SVG)
9. **Screenshot**: Run `Take-Screenshot.ps1 -Filename "result.png"` to capture state
10. **Close**: Run `Stop-Browser.ps1` to clean up
11. **Stop server**: Run `Stop-DevServer.ps1` to stop the dev server

Key rules:

* **Bypass execution policy** before running any scripts — PowerShell 5.1 defaults to Restricted
* Always take a **snapshot** before interacting — element refs (e1, e2, ...) change after navigation or DOM mutations
* Use **named sessions** (`-Session`) when managing multiple browsers
* **Close browsers** when done to prevent zombie processes
* For this project, use port **5174** to avoid conflicts with Electron Forge's port 5173
* In agent tool execution, keep server/browser startup non-blocking and continue with follow-up commands
* For visual/manual verification tasks, require headed mode and verify it explicitly
* For export tasks in standalone mode, use browser-only export flows rather than Electron IPC
* Use `eval` for reading single values (e.g., `document.title`); use `run-code` for multi-statement scripts — `eval` cannot handle variable declarations, IIFEs, or multi-line logic
* For complex canvas drawing, use `run-code` with `page.evaluate` calls rather than simulating pointer events — direct context drawing is more reliable and deterministic
* Use `npx playwright-cli` instead of bare `playwright-cli` when execution policy blocks `.ps1` wrappers

## Templates

The following templates are available for agent code generation:

* [Playwright Test configuration](assets/templates/playwright.config.ts) — Complete test runner config using Edge
* [CLI configuration](assets/templates/cli.config.json) — Browser and viewport defaults for Edge
* [Test specification](assets/templates/test-spec.ts) — Test file skeleton
* [Page interaction script](assets/templates/page-interaction.ts) — Standalone automation script using Edge

## Extended Reference

For detailed feature documentation covering all 18 Playwright categories:

* [Full feature reference](references/reference.md) — CLI commands and API examples for every feature
* [CLI command quick reference](references/cli-commands.md) — Concise CLI command listing
* [MCP → CLI → API mapping](references/api-mapping.md) — Translation table between approaches
* [Pitfalls and best practices](references/pitfalls.md) — Common mistakes, Edge-specific and PowerShell 5.1 guidance

## Related Skills

If you need to convert automation steps into Playwright .NET xUnit tests, continue with:

* [Playwright .NET conversion skill](../playwright-dotnet-conversion/SKILL.md)

## Troubleshooting

| Symptom | Cause | Resolution |
| --- | --- | --- |
| `npm: command not found` | Node.js not installed | Install Node.js 18+ from nodejs.org |
| `playwright-cli cannot be loaded because running scripts is disabled` | PowerShell execution policy is Restricted | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` or use `powershell -ExecutionPolicy Bypass -File` |
| `#Requires statement for PowerShell 7.0` | Using the old `playwright-automation` skill scripts | Switch to `playwright-automation-msedge` scripts (PS 5.1+ compatible) |
| `playwright-cli: command not found` | CLI not installed or blocked by execution policy | Run `npx playwright-cli` instead, or install via `Install-Playwright.ps1` |
| Browser fails to launch | Edge not found or CLI workspace not initialized | Run `npx playwright-cli install` to discover Edge |
| Dev server hangs on startup | Port already in use | Kill process on port: `Get-NetTCPConnection -LocalPort 5174` |
| Snapshot returns empty | Page not loaded | Wait for navigation to complete before taking snapshot |
| Element refs not found | Refs changed after DOM update | Re-run snapshot to get fresh refs |
| `page.goto` times out | Using a framework-specific dev port | Use a standalone dev server on a dedicated test port instead |
| `electronAPI` is undefined | Running outside Electron shell | Expected in standalone mode — test canvas/UI only |
| User cannot see browser window | Browser session launched headless | Start with `-Headed` and verify with `npx playwright-cli list` (`headed: true`) |
| SVG export did not occur | Tried Electron export path in standalone mode | Build/download SVG inside browser context (`eval`/`run-code`) |
| Tests fail with viewport clipping | Default viewport too small | Use `-ViewportSize "1400x1100"` for full canvas visibility |
| `page._snapshotForAI: Target page, context or browser has been closed` | SSO redirect or cross-origin navigation closed the in-memory browser context | Use `--persistent --profile ".playwright-cli/edge-profile"` when opening the browser. Open to `about:blank` first, then `goto` the SSO URL separately |
| `npx playwright-cli browser` hangs indefinitely | `browser` is not a valid subcommand | Use `npx playwright-cli open` instead — `open` is the correct command to launch a browser |
| `error: unknown '--viewport' option` | `--viewport` is not supported on `open` | Use `npx playwright-cli resize <w> <h>` after opening the browser |
| `$env:username` resolves to wrong value | `USERNAME` is a built-in Windows environment variable | Use a different variable name like `$env:APP_USERNAME` for custom credentials |
| Screenshot saved with timestamped name, not expected filename | `screenshot` command auto-generates filenames | Read the output path and copy/rename the file to your desired name |
