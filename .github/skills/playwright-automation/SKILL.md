---
name: playwright-automation
description: 'Playwright browser automation without the MCP server — via CLI commands and direct API. USE FOR: browser testing, UI interaction automation, screenshots, page snapshots, form filling, network interception, test execution, dev server management, accessibility testing. Provides PowerShell scripts for installation, browser session management, screenshot capture, test execution, and dev server startup. Includes reference documentation for all 18 Playwright feature categories, CLI command reference, API mapping tables, and ready-to-use code templates. WHEN TO USE: automating browser interactions, writing Playwright tests, capturing screenshots, testing web applications, running end-to-end tests, starting dev servers for Playwright testing.'
user-invocable: true
compatibility: 'Requires Node.js and npm on PATH. PowerShell 7+ (pwsh) for scripts.'
---

# Playwright Browser Automation Skill

## Overview

Provides complete Playwright browser automation capabilities without the Playwright MCP server. Supports two approaches:

1. **Playwright CLI** (`@playwright/cli`) — Shell commands via terminal, optimized for agents
2. **Direct Playwright API** — TypeScript/JavaScript programmatic usage via `playwright` npm package

Use cases:

* Browser testing and UI interaction automation
* Screenshot and PDF capture
* Page snapshot and accessibility tree inspection
* Form filling, clicking, and element interaction
* Network interception and mocking
* End-to-end test execution
* Dev server management for Playwright-accessible testing

## Prerequisites

| Platform       | Runtime                         |
| -------------- | ------------------------------- |
| macOS / Linux  | Node.js 18+, npm, PowerShell 7+ |
| Windows        | Node.js 18+, npm, PowerShell 7+ |

Install Playwright using the provided script:

    ./scripts/Install-Playwright.ps1

## Quick Start

Install Playwright, start a dev server, open a browser, take a screenshot:

    ./scripts/Install-Playwright.ps1
    ./scripts/Start-DevServer.ps1 -Port 5174
    ./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Headed
    ./scripts/Take-Screenshot.ps1 -Filename "page.png"
    ./scripts/Stop-Browser.ps1

Run Playwright tests:

    ./scripts/Run-Tests.ps1
    ./scripts/Run-Tests.ps1 -TestFile "tests/my.spec.ts" -Headed

## Parameters Reference

### Install-Playwright

| Parameter     | Flag               | Default   | Description                                      |
| ------------- | ------------------ | --------- | ------------------------------------------------ |
| Install CLI   | `-InstallCli`      | `$true`   | Install @playwright/cli globally                 |
| Install API   | `-InstallApi`      | `$false`  | Install playwright and @playwright/test as devDeps |
| Install Browsers | `-InstallBrowsers` | `$true` | Run `npx playwright install` for browser binaries |

### Start-DevServer

| Parameter      | Flag              | Default                      | Description                                  |
| -------------- | ----------------- | ---------------------------- | -------------------------------------------- |
| Port           | `-Port`           | `5174`                       | Port for the Vite dev server                 |
| Config         | `-Config`         | `vite.renderer.config.ts`    | Vite config file path                        |
| Wait           | `-Wait`           | `$true`                      | Wait until server is ready before returning  |
| Timeout        | `-TimeoutSeconds` | `30`                         | Seconds to wait for server readiness         |

### Start-Browser

| Parameter      | Flag              | Default      | Description                                    |
| -------------- | ----------------- | ------------ | ---------------------------------------------- |
| URL            | `-Url`            | (none)       | URL to navigate to after opening               |
| Headed         | `-Headed`         | `$false`     | Open browser in headed (visible) mode          |
| Session        | `-Session`        | (none)       | Named session for isolation                    |
| Persistent     | `-Persistent`     | `$false`     | Use persistent browser profile                 |
| Profile        | `-Profile`        | (none)       | Path to browser profile directory              |
| Browser        | `-BrowserType`    | `chromium`   | Browser engine: chromium, firefox, webkit      |
| Viewport       | `-ViewportSize`   | `1280x720`   | Viewport dimensions (WIDTHxHEIGHT)            |

### Stop-Browser

| Parameter    | Flag           | Default  | Description                                   |
| ------------ | -------------- | -------- | --------------------------------------------- |
| Session      | `-Session`     | (none)   | Close a specific named session                |
| All          | `-All`         | `$false` | Close all browser sessions                    |
| Force        | `-Force`       | `$false` | Force kill all sessions (kill-all)            |

### Invoke-BrowserAction

| Parameter    | Flag           | Default  | Description                                          |
| ------------ | -------------- | -------- | ---------------------------------------------------- |
| Action       | `-Action`      | (none)   | Action: click, fill, type, select, hover, drag, etc. |
| Ref          | `-Ref`         | (none)   | Element reference from snapshot (e.g., e3)           |
| Value        | `-Value`       | (none)   | Value for fill, type, or select actions              |
| Target       | `-Target`      | (none)   | Target ref for drag action                           |
| Session      | `-Session`     | (none)   | Named session to target                              |

### Take-Screenshot

| Parameter    | Flag           | Default           | Description                                  |
| ------------ | -------------- | ----------------- | -------------------------------------------- |
| Filename     | `-Filename`    | (auto-generated)  | Output filename for the screenshot           |
| Ref          | `-Ref`         | (none)            | Element ref to screenshot (instead of page)  |
| Format       | `-Format`      | `png`             | Output format: png or pdf                    |
| Session      | `-Session`     | (none)            | Named session to target                      |

### Run-Tests

| Parameter    | Flag           | Default   | Description                                  |
| ------------ | -------------- | --------- | -------------------------------------------- |
| TestFile     | `-TestFile`    | (none)    | Specific test file to run                    |
| Headed       | `-Headed`      | `$false`  | Run tests with visible browser               |
| Debug        | `-Debug`       | `$false`  | Run in debug mode                            |
| ShowReport   | `-ShowReport`  | `$false`  | Open HTML report after tests                 |
| Grep         | `-Grep`        | (none)    | Filter tests by title pattern                |
| Project      | `-Project`     | (none)    | Run specific project (chromium, firefox, webkit) |
| Workers      | `-Workers`     | (none)    | Number of parallel workers                   |

## Script Reference

### Installation

    # Install CLI globally + download browsers
    ./scripts/Install-Playwright.ps1

    # Install API packages as dev dependencies + download browsers
    ./scripts/Install-Playwright.ps1 -InstallApi -InstallCli:$false

    # Install everything
    ./scripts/Install-Playwright.ps1 -InstallApi

### Dev Server Management

    # Start Vite dev server on default port 5174
    ./scripts/Start-DevServer.ps1

    # Start on custom port with custom config
    ./scripts/Start-DevServer.ps1 -Port 3000 -Config "vite.config.ts"

    # Start without waiting for readiness
    ./scripts/Start-DevServer.ps1 -Wait:$false

### Browser Session Management

    # Open headed browser and navigate
    ./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Headed

    # Open named session for isolation
    ./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Session "testing" -Headed

    # Open with specific browser and viewport
    ./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -BrowserType firefox -ViewportSize "1400x1100"

    # Close specific session
    ./scripts/Stop-Browser.ps1 -Session "testing"

    # Close all sessions
    ./scripts/Stop-Browser.ps1 -All

    # Force kill all
    ./scripts/Stop-Browser.ps1 -Force

### Browser Interaction

    # Take page snapshot to get element refs
    ./scripts/Invoke-BrowserAction.ps1 -Action snapshot

    # Click an element
    ./scripts/Invoke-BrowserAction.ps1 -Action click -Ref e3

    # Fill a form field
    ./scripts/Invoke-BrowserAction.ps1 -Action fill -Ref e5 -Value "user@example.com"

    # Type text into focused element
    ./scripts/Invoke-BrowserAction.ps1 -Action type -Value "search query"

    # Select dropdown option
    ./scripts/Invoke-BrowserAction.ps1 -Action select -Ref e9 -Value "option-value"

    # Hover over element
    ./scripts/Invoke-BrowserAction.ps1 -Action hover -Ref e4

    # Drag element to target
    ./scripts/Invoke-BrowserAction.ps1 -Action drag -Ref e2 -Target e8

    # Press keyboard key
    ./scripts/Invoke-BrowserAction.ps1 -Action press -Value "Enter"

    # Evaluate JavaScript
    ./scripts/Invoke-BrowserAction.ps1 -Action eval -Value "document.title"

    # Navigate to URL
    ./scripts/Invoke-BrowserAction.ps1 -Action goto -Value "http://localhost:5174"

    # Accept dialog
    ./scripts/Invoke-BrowserAction.ps1 -Action dialog-accept

### Screenshots and PDF

    # Full page screenshot
    ./scripts/Take-Screenshot.ps1 -Filename "page.png"

    # Element screenshot
    ./scripts/Take-Screenshot.ps1 -Ref e5 -Filename "element.png"

    # Save as PDF
    ./scripts/Take-Screenshot.ps1 -Format pdf -Filename "page.pdf"

    # Screenshot in named session
    ./scripts/Take-Screenshot.ps1 -Session "testing" -Filename "result.png"

### Test Execution

    # Run all tests
    ./scripts/Run-Tests.ps1

    # Run specific test file with visible browser
    ./scripts/Run-Tests.ps1 -TestFile "tests/my.spec.ts" -Headed

    # Run in debug mode
    ./scripts/Run-Tests.ps1 -Debug

    # Filter tests by name
    ./scripts/Run-Tests.ps1 -Grep "navigation"

    # Run specific browser project
    ./scripts/Run-Tests.ps1 -Project chromium

    # Show HTML report
    ./scripts/Run-Tests.ps1 -ShowReport

## Workflow Pattern for Agents

Agents using this skill follow this interaction pattern:

1. **Install**: Run `Install-Playwright.ps1` if Playwright is not installed
2. **Start server**: Run `Start-DevServer.ps1` to serve the web app
3. **Open browser**: Run `Start-Browser.ps1 -Url "http://localhost:5174" -Headed`
4. **Snapshot**: Run `Invoke-BrowserAction.ps1 -Action snapshot` to get element refs
5. **Interact**: Use `Invoke-BrowserAction.ps1` with refs from snapshot
6. **Screenshot**: Run `Take-Screenshot.ps1 -Filename "result.png"` to capture state
7. **Close**: Run `Stop-Browser.ps1` to clean up
8. **Stop server**: Terminate the dev server process

Key rules:

* Always take a **snapshot** before interacting — element refs (e1, e2, ...) change after navigation or DOM mutations
* Use **named sessions** (`-Session`) when managing multiple browsers
* **Close browsers** when done to prevent zombie processes
* For this project, use port **5174** to avoid conflicts with Electron Forge's port 5173

## Templates

The following templates are available for agent code generation:

* [Playwright Test configuration](assets/templates/playwright.config.ts) — Complete test runner config
* [CLI configuration](assets/templates/cli.config.json) — Browser and viewport defaults
* [Test specification](assets/templates/test-spec.ts) — Test file skeleton
* [Page interaction script](assets/templates/page-interaction.ts) — Standalone automation script

## Extended Reference

For detailed feature documentation covering all 18 Playwright categories:

* [Full feature reference](references/REFERENCE.md) — CLI commands and API examples for every feature
* [CLI command quick reference](references/CLI-COMMANDS.md) — Concise CLI command listing
* [MCP → CLI → API mapping](references/API-MAPPING.md) — Translation table between approaches
* [Pitfalls and best practices](references/PITFALLS.md) — Common mistakes and project-specific guidance

## Troubleshooting

| Symptom                              | Cause                                  | Resolution                                                    |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------- |
| `npm: command not found`             | Node.js not installed                  | Install Node.js 18+ from nodejs.org                           |
| `playwright-cli: command not found`  | CLI not installed                      | Run `./scripts/Install-Playwright.ps1`                        |
| Browser fails to launch              | Browser binaries not downloaded        | Run `./scripts/Install-Playwright.ps1 -InstallBrowsers`       |
| Dev server hangs on startup          | Port already in use                    | Kill process on port: `lsof -i :5174` and kill PID            |
| Snapshot returns empty               | Page not loaded                        | Wait for navigation to complete before taking snapshot         |
| Element refs not found               | Refs changed after DOM update          | Re-run snapshot to get fresh refs                             |
| `page.goto` times out                | Using Electron Forge port (5173)       | Use standalone Vite server on port 5174 instead               |
| `electronAPI` is undefined           | Running outside Electron shell         | Expected in standalone mode — test canvas/UI only             |
| Tests fail with viewport clipping    | Default viewport too small             | Use `-ViewportSize "1400x1100"` for full canvas visibility    |
