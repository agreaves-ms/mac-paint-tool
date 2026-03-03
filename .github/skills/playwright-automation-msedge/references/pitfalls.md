---
title: Playwright Pitfalls and Best Practices (Edge + PowerShell 5.1)
description: Common mistakes and best practices for Playwright with Edge browser on Windows PowerShell 5.1
author: Microsoft
ms.date: 2026-02-27
ms.topic: reference
keywords:
  - playwright
  - pitfalls
  - best-practices
  - troubleshooting
  - msedge
  - powershell-5.1
estimated_reading_time: 7
---

## Windows / PowerShell 5.1 Pitfalls

### 1. Execution policy blocks `playwright-cli.ps1` shim

When `playwright-cli` is installed globally via `npm install -g @playwright/cli`, npm creates a `.ps1` shim script. On Windows, the default execution policy is `Restricted`, which blocks all `.ps1` scripts.

**Symptoms:**
- `playwright-cli : File C:\...\playwright-cli.ps1 cannot be loaded because running scripts is disabled on this system.`
- The `.cmd` shim might also fail if PowerShell's `$PSCommandPath` resolution tries to load the `.ps1`

**Solutions (pick one):**

```powershell
# Option 1: Set execution policy for the current session (preferred)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Option 2: Use npx to bypass the shim entirely (most reliable)
npx playwright-cli open https://example.com

# Option 3: Set execution policy for the current user (persistent)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Recommendation:** This skill's scripts use `npx playwright-cli` as an automatic fallback. If the global `playwright-cli` command fails, the shared module detects the failure and routes through `npx` instead.

### 2. PowerShell 7 (`pwsh`) not available

The original `playwright-automation` skill requires PowerShell 7 via `#Requires -Version 7.0`. On most Windows machines, only PowerShell 5.1 (`powershell.exe`) is available — PowerShell 7 (`pwsh.exe`) must be installed separately.

**Symptoms:**
- `The script 'Start-Browser.ps1' cannot be run because it contained a "#requires" statement for Windows PowerShell 7.0.`
- `pwsh: The term 'pwsh' is not recognized as the name of a cmdlet`

**Solution:** This skill removes all `#Requires -Version 7.0` directives. All scripts are compatible with PowerShell 5.1+.

### 3. Running skill scripts from an agent environment

When agents run `.ps1` scripts, always use:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Start-Browser.ps1 -Url "https://example.com"
```

This ensures the execution policy is bypassed regardless of the system default.

---

## CLI Pitfalls

### 4. Element refs are ephemeral

Refs from `snapshot` change after navigation or DOM mutations. Always re-snapshot before interacting.

**Wrong**: Take snapshot → navigate → click ref from old snapshot
**Right**: Take snapshot → interact → snapshot again after navigation → use new refs

### 5. Session cleanup

Always close browsers when done (`playwright-cli close` or `close-all`). Zombie processes persist otherwise and consume memory.

**Cleanup pattern**:

```powershell
# At end of automation session
powershell -ExecutionPolicy Bypass -File ./scripts/Stop-Browser.ps1 -All

# If sessions are stuck
powershell -ExecutionPolicy Bypass -File ./scripts/Stop-Browser.ps1 -Force
```

### 6. Headed mode at launch time

Pass `--headed` to `open`, not to subsequent commands. The display mode is set at browser launch time and cannot be changed after.

**Wrong**: `npx playwright-cli click e3 --headed`
**Right**: `npx playwright-cli open https://example.com --headed`

### 7. eval vs run-code — know the difference

`eval` wraps your code as `() => (code)`, so it only works for **single expressions**. Multi-statement scripts, IIFEs, or code with variable declarations fail silently or return "result is not a function".

**Wrong** — multi-statement code with `eval`:

```bash
npx playwright-cli eval "const canvas = document.getElementById('paint-canvas'); canvas.toDataURL()"
# Fails: eval wraps as () => (const canvas = ...) which is invalid
```

**Right** — single expression with `eval`:

```bash
npx playwright-cli eval "document.title"
npx playwright-cli eval "document.getElementById('paint-canvas').toDataURL()"
```

**Right** — multi-statement code with `run-code`:

```bash
npx playwright-cli run-code "async (page) => {
  const result = await page.evaluate(() => {
    const canvas = document.getElementById('paint-canvas');
    return canvas.toDataURL();
  });
  console.log(result);
}"
```

**Decision guide**:

| Need | Use | Example |
| --- | --- | --- |
| Read a single value | `eval` | `eval "document.title"` |
| Call a single method | `eval` | `eval "document.querySelector('#btn').click()"` |
| Multi-statement logic | `run-code` | `run-code "async (page) => { ... }"` |
| Canvas drawing (complex) | `run-code` | Full `page.evaluate` with drawing code |
| File/script execution | `run-code` | Wrap file contents in async function |

> **Note**: `run-code` is not available through the `Invoke-BrowserAction.ps1` wrapper. Use `npx playwright-cli run-code` directly for multi-statement scripts.

### 8. Quoting in run-code

Use double quotes for the outer string, single quotes inside:

**Wrong**: `npx playwright-cli run-code 'async page => { await page.goto("url"); }'`
**Right**: `npx playwright-cli run-code "async page => { await page.goto('url'); }"`

### 9. Session isolation

Named sessions are fully isolated (separate cookies, storage, cache). Use this for parallel testing but be aware that state is not shared between sessions.

---

## Edge-Specific Pitfalls

### 10. SSO redirects destroy CLI browser context

When navigating to URLs that perform SSO redirects (e.g., SAML, OAuth, ADFS), the `playwright-cli goto` command may fail with:
- `"Target page, context or browser has been closed"`
- The redirect destroys the browser context before the CLI can resume control

**Solution:** Use a standalone Node.js Playwright script instead of the CLI for SSO-heavy flows:

```javascript
// sso-automation.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: false });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  await page.goto('https://your-sso-url.com/login', {
    waitUntil: 'load',
    timeout: 30000,
  });

  // Wait for redirect to complete
  await page.waitForLoadState('networkidle');

  // Now interact with the login form — read credentials from environment variables
  await page.fill('#username', process.env.APP_USERNAME || '');
  await page.fill('#password', process.env.APP_PASSWORD || '');
  await page.screenshot({ path: 'after-login.png' });
} finally {
  await browser.close();
}
```

Run with: `node sso-automation.mjs`

### 11. Edge channel name

The correct channel name for Edge is `msedge` (not `edge` or `microsoft-edge`).

**Wrong**: `channel: 'edge'` or `channel: 'microsoft-edge'`
**Right**: `channel: 'msedge'`

### 12. Edge auto-detection

Playwright detects the system-installed Edge automatically. No browser download is needed. If Edge is not found at the expected location, Playwright will fail with:
- `"Executable doesn't exist at C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`

**Solution:** Ensure Edge is installed (it's pre-installed on Windows 10/11).

### 13. HTTPS certificate errors

When testing internal or staging sites with self-signed certificates, use the `ignoreHTTPSErrors` option:

```javascript
const context = await browser.newContext({ ignoreHTTPSErrors: true });
```

For CLI, Edge's system certificate store is used — but self-signed certs may still cause issues. Use the direct API approach for full control.

---

## API Pitfalls

### 14. Auto-waiting

Playwright auto-waits for elements to be actionable before performing actions. Avoid manual `waitForSelector` unless checking for absence or specific states.

**Unnecessary**:

```typescript
await page.waitForSelector('#button');
await page.click('#button');
```

**Correct**:

```typescript
await page.click('#button');  // Auto-waits for actionable state
```

### 15. Context isolation

Each `browser.newContext()` has independent cookies, storage, and cache. Use this for test isolation but be aware that login state does not carry between contexts.

### 16. Headless by default

Pass `{ headless: false }` to `chromium.launch()` to see the browser. Headless is the default.

### 17. Close resources

Always close `browser` and `context` to avoid resource leaks:

```typescript
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  // ... work ...
} finally {
  await browser.close();
}
```

### 18. Locator preference

Use semantic locators in this order:

1. `getByRole()` — most resilient, semantic
2. `getByLabel()` — for form elements
3. `getByPlaceholder()` — for inputs
4. `getByText()` — for visible text
5. `getByTestId()` — for data-testid attributes
6. `locator()` with CSS — last resort, most fragile

---

## Project-Specific Pitfalls (mac-paint-tool)

### 19. Framework dev server may not be accessible

Electron Forge on port 5173 serves content intended for the Electron shell. Navigating to it from Playwright causes `net::ERR_ABORTED` or infinite timeouts.

**Solution**: Start a standalone dev server:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Start-DevServer.ps1 -Command "npx vite --config vite.renderer.config.ts --port 5174" -Port 5174
```

### 20. Port conflict avoidance

Port 5174 avoids conflicts with Electron Forge's port 5173. Always use 5174 for Playwright testing.

### 21. No electronAPI in standalone mode

`window.electronAPI` (preload bridge) is **not available** when running a standalone dev server outside the Electron shell.

**What works**: Canvas drawing, UI interactions, tool selection, color picking
**What does not work**: File dialogs, save/open, clipboard paste, menu event listeners

### 22. Canvas testing via evaluate

For drawing on the canvas, use `page.evaluate()` to call Canvas 2D API directly:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Invoke-BrowserAction.ps1 -Action eval -Value "document.getElementById('paint-canvas').getContext('2d').fillRect(100, 100, 50, 50)"
```

### 23. Viewport sizing

Default viewport may clip the 1024x768 canvas. Use a larger viewport:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -ViewportSize "1400x1100" -Headed
```

### 24. Save canvas output via download

Since `electronAPI` is unavailable, save canvas output by triggering a download:

```typescript
await page.evaluate(() => {
  const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
  const link = document.createElement('a');
  link.download = 'canvas-output.png';
  link.href = canvas.toDataURL();
  link.click();
});
```

Downloaded files land in `.playwright-cli/` directory.

---

## Agent-Specific Best Practices

### 1. Run long-lived commands non-blocking

From agent tool environments, launch these as background/non-blocking steps:

* Dev server startup
* Browser startup

Then continue with action commands in subsequent commands.

### 2. Set execution policy first

Before running any `.ps1` script, set the execution policy:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Or prefix every command:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Start-Browser.ps1 ...
```

### 3. Snapshot before interact

Always take a snapshot before any element interaction to get fresh refs:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Invoke-BrowserAction.ps1 -Action snapshot
# Read refs from output
powershell -ExecutionPolicy Bypass -File ./scripts/Invoke-BrowserAction.ps1 -Action click -Ref e3
```

### 4. Clean up sessions

Always close browsers and stop servers when ending a session:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Stop-Browser.ps1 -All
powershell -ExecutionPolicy Bypass -File ./scripts/Stop-DevServer.ps1
```

### 5. Use standalone scripts for SSO flows

When the CLI fails due to SSO redirects, write a standalone `.mjs` script using the Playwright API with `channel: 'msedge'`. See pitfall #10.

### 6. Screenshot for verification

Take screenshots after key actions to verify state:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/Take-Screenshot.ps1 -Filename "after-click.png"
```
