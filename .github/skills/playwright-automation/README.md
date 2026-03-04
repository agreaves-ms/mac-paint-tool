# Playwright Automation Skill

Browser automation for Mac Paint Tool via CLI commands and PowerShell scripts. This skill enables visual testing, screenshot capture, and interactive browser automation without the Playwright MCP server.

## Prerequisites

| Requirement       | Version    |
|-------------------|------------|
| Node.js and npm   | 18+        |
| PowerShell (pwsh) | 7+         |

## Setup

Install the Playwright CLI and browser binaries:

```bash
pwsh .github/skills/playwright-automation/scripts/Install-Playwright.ps1
```

The skill defaults to **Microsoft Edge** (`msedge`) as the browser channel, with automatic fallback to Chrome then Chromium if Edge is unavailable.

## Quick Start

```bash
# Start the dev server
pwsh .github/skills/playwright-automation/scripts/Start-DevServer.ps1 -Command "npm run dev -- --port 5174" -Port 5174

# Open a headed browser session
pwsh .github/skills/playwright-automation/scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Headed

# Take a screenshot
pwsh .github/skills/playwright-automation/scripts/Take-Screenshot.ps1 -Filename "screenshot.png"

# Stop the browser and dev server
pwsh .github/skills/playwright-automation/scripts/Stop-Browser.ps1
pwsh .github/skills/playwright-automation/scripts/Stop-DevServer.ps1 -Port 5174
```

## Using the Skill with Copilot Agents

The playwright-automation skill is available to Copilot agents automatically. Agents can use it for:

- Capturing screenshots of canvas state during development
- Running visual regression tests
- Automating browser interactions for testing
- Exporting canvas content as PNG or SVG

## Workflow Pattern for Agents

Agents using this skill follow this interaction pattern:

1. **Install**: Run `Install-Playwright.ps1` if Playwright is not installed.
2. **Start server**: Run `Start-DevServer.ps1 -Command "<your start command>"` to serve the web app.
3. **Open browser**: Run `Start-Browser.ps1 -Url "http://localhost:5174" -Headed`.
4. **Verify headed mode**: Run `playwright-cli list` and confirm the session reports `headed: true`.
5. **Snapshot**: Run `Invoke-BrowserAction.ps1 -Action snapshot` to get element refs.
6. **Interact**: Use `Invoke-BrowserAction.ps1` with refs from the snapshot.
7. **Export if requested**: Use browser APIs in `eval`/`run-code` to create and download files (including SVG).
8. **Screenshot**: Run `Take-Screenshot.ps1 -Filename "result.png"` to capture state.
9. **Close**: Run `Stop-Browser.ps1` to clean up.
10. **Stop server**: Run `Stop-DevServer.ps1` to stop the dev server.

## Script Reference

### Dev Server Management

```bash
# Start dev server with an npm script
pwsh .github/skills/playwright-automation/scripts/Start-DevServer.ps1 -Command "npm run dev -- --port 5174"

# Start with a custom command and port
pwsh .github/skills/playwright-automation/scripts/Start-DevServer.ps1 -Command "npx vite --config vite.renderer.config.ts --port 3000" -Port 3000

# Start without waiting for readiness
pwsh .github/skills/playwright-automation/scripts/Start-DevServer.ps1 -Command "node server.js" -Port 8080 -Wait:$false

# Stop the dev server
pwsh .github/skills/playwright-automation/scripts/Stop-DevServer.ps1

# Stop a dev server on a custom port
pwsh .github/skills/playwright-automation/scripts/Stop-DevServer.ps1 -Port 3000
```

### Browser Session Management

```bash
# Open headed browser and navigate
pwsh .github/skills/playwright-automation/scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Headed

# Open named session for isolation
pwsh .github/skills/playwright-automation/scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Session "testing" -Headed

# Open with specific browser and viewport
pwsh .github/skills/playwright-automation/scripts/Start-Browser.ps1 -Url "http://localhost:5174" -BrowserType firefox -ViewportSize "1400x1100"

# Open with Chrome explicitly (no fallback to other browsers)
pwsh .github/skills/playwright-automation/scripts/Start-Browser.ps1 -Url "http://localhost:5174" -BrowserType chrome -NoFallback

# Close specific session
pwsh .github/skills/playwright-automation/scripts/Stop-Browser.ps1 -Session "testing"

# Close all sessions
pwsh .github/skills/playwright-automation/scripts/Stop-Browser.ps1 -All
```

### Browser Interaction

```bash
# Take page snapshot to get element refs
pwsh .github/skills/playwright-automation/scripts/Invoke-BrowserAction.ps1 -Action snapshot

# Click an element
pwsh .github/skills/playwright-automation/scripts/Invoke-BrowserAction.ps1 -Action click -Ref e3

# Fill a form field
pwsh .github/skills/playwright-automation/scripts/Invoke-BrowserAction.ps1 -Action fill -Ref e5 -Value "user@example.com"

# Evaluate a single JavaScript expression
pwsh .github/skills/playwright-automation/scripts/Invoke-BrowserAction.ps1 -Action eval -Value "document.title"

# Navigate to URL
pwsh .github/skills/playwright-automation/scripts/Invoke-BrowserAction.ps1 -Action goto -Value "http://localhost:5174"
```

### Screenshots

```bash
# Full page screenshot
pwsh .github/skills/playwright-automation/scripts/Take-Screenshot.ps1 -Filename "page.png"

# Element screenshot
pwsh .github/skills/playwright-automation/scripts/Take-Screenshot.ps1 -Ref e5 -Filename "element.png"

# Save as PDF
pwsh .github/skills/playwright-automation/scripts/Take-Screenshot.ps1 -Format pdf -Filename "page.pdf"
```

## Standalone Mode Considerations

The standalone Vite dev server on port 5174 serves the renderer UI without the Electron shell. `window.electronAPI` (file dialogs, clipboard, menu events) is not available in standalone mode.

For export tasks (SVG, PNG), use browser-only APIs:

1. Generate content in the page context via `evaluate` or `run-code`.
2. Trigger a browser download using an anchor element with a Blob URL.
3. Verify the downloaded artifact exists before finishing.

## Troubleshooting

| Symptom | Cause | Resolution |
|---------|-------|------------|
| `playwright-cli: command not found` | CLI not installed | Run `Install-Playwright.ps1` |
| Browser fails to launch | Workspace not initialized or wrong browser channel | Run `playwright-cli install`, or use `-BrowserType chrome`. Default msedge falls back to chrome then chromium automatically. |
| Dev server hangs on startup | Port already in use | Kill the process on the port: `lsof -i :5174` and kill the PID |
| Snapshot returns empty | Page not loaded | Wait for navigation to complete before taking a snapshot |
| Element refs not found | Refs changed after DOM update | Re-run the snapshot to get fresh refs |
| User cannot see browser window | Session launched headless | Start with `-Headed` and verify with `playwright-cli list` |
| SVG export did not occur | Tried Electron export path in standalone mode | Build and download SVG inside the browser context |
| Tests fail with viewport clipping | Default viewport too small | Use `-ViewportSize "1400x1100"` for full canvas visibility |

## Extended Reference

For detailed feature documentation covering all 18 Playwright categories, see the [SKILL.md](SKILL.md) file, which includes:

- Full parameter reference for every script
- CLI command quick reference
- MCP to CLI to API mapping tables
- Agent execution rules and export semantics
- Ready-to-use code templates
