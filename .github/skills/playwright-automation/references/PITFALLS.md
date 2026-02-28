---
title: Playwright Pitfalls and Best Practices
description: Common mistakes and best practices for Playwright CLI, API, and project-specific usage
author: Microsoft
ms.date: 2026-02-27
ms.topic: reference
keywords:
  - playwright
  - pitfalls
  - best-practices
  - troubleshooting
estimated_reading_time: 5
---

## CLI Pitfalls

### 1. Element refs are ephemeral

Refs from `snapshot` change after navigation or DOM mutations. Always re-snapshot before interacting.

**Wrong**: Take snapshot → navigate → click ref from old snapshot
**Right**: Take snapshot → interact → snapshot again after navigation → use new refs

### 2. Session cleanup

Always close browsers when done (`playwright-cli close` or `close-all`). Zombie processes persist otherwise and consume memory.

**Cleanup pattern**:

```powershell
# At end of automation session
./scripts/Stop-Browser.ps1 -All

# If sessions are stuck
./scripts/Stop-Browser.ps1 -Force
```

### 3. Headed mode at launch time

Pass `--headed` to `open`, not to subsequent commands. The display mode is set at browser launch time and cannot be changed after.

**Wrong**: `playwright-cli click e3 --headed`
**Right**: `playwright-cli open https://example.com --headed`

### 4. Quoting in run-code

Use double quotes for the outer string, single quotes inside:

**Wrong**: `playwright-cli run-code 'async page => { await page.goto("url"); }'`
**Right**: `playwright-cli run-code "async page => { await page.goto('url'); }"`

### 5. Session isolation

Named sessions are fully isolated (separate cookies, storage, cache). Use this for parallel testing but be aware that state is not shared between sessions.

---

## API Pitfalls

### 1. Auto-waiting

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

### 2. Context isolation

Each `browser.newContext()` has independent cookies, storage, and cache. Use this for test isolation but be aware that login state does not carry between contexts.

### 3. Headless by default

Pass `{ headless: false }` to `chromium.launch()` to see the browser. Headless is the default.

### 4. Close resources

Always close `browser` and `context` to avoid resource leaks:

```typescript
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // ... work ...
} finally {
  await browser.close();
}
```

### 5. Locator preference

Use semantic locators in this order:

1. `getByRole()` — most resilient, semantic
2. `getByLabel()` — for form elements
3. `getByPlaceholder()` — for inputs
4. `getByText()` — for visible text
5. `getByTestId()` — for data-testid attributes
6. `locator()` with CSS — last resort, most fragile

---

## Project-Specific Pitfalls (mac-paint-tool)

### 1. Electron Forge dev server is not accessible

The Electron Forge Vite server (`npm run start`) on port 5173 serves content intended for the Electron renderer process. Navigating to it from Playwright causes `net::ERR_ABORTED` or infinite timeouts.

**Solution**: Use a standalone Vite server:

```powershell
./scripts/Start-DevServer.ps1 -Port 5174
```

### 2. Port conflict avoidance

Port 5174 avoids conflicts with Electron Forge's port 5173. Always use 5174 for Playwright testing.

### 3. No electronAPI in standalone mode

`window.electronAPI` (preload bridge) is **not available** when running the standalone Vite server. File save/open, clipboard, and menu IPC handlers do not work.

**What works**: Canvas drawing, UI interactions, tool selection, color picking
**What does not work**: File dialogs, save/open, clipboard paste, menu event listeners

### 4. Canvas testing via evaluate

For drawing on the canvas, use `page.evaluate()` to call Canvas 2D API directly:

```typescript
await page.evaluate(() => {
  const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(100, 100, 50, 50);
  }
});
```

### 5. Viewport sizing

Default viewport may clip the 1024x768 canvas. Use a larger viewport:

```powershell
./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -ViewportSize "1400x1100" -Headed
```

### 6. Save canvas output via download

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

Downloaded files land in `.playwright-mcp/` directory.

---

## Agent-Specific Best Practices

### 1. Snapshot before interact

Always take a snapshot before any element interaction to get fresh refs:

```powershell
./scripts/Invoke-BrowserAction.ps1 -Action snapshot
# Read refs from output
./scripts/Invoke-BrowserAction.ps1 -Action click -Ref e3
```

### 2. Clean up sessions

Always close browsers and stop servers when ending a session:

```powershell
./scripts/Stop-Browser.ps1 -All
# Stop the Vite dev server process
Stop-Process -Id <PID>
```

### 3. Use named sessions for parallel work

```powershell
./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Session "test1"
./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -Session "test2"
# ... interact with each session independently ...
./scripts/Stop-Browser.ps1 -All
```

### 4. Screenshot for verification

Take screenshots after key actions to verify state:

```powershell
./scripts/Take-Screenshot.ps1 -Filename "after-click.png"
```

### 5. fill_form expects fields array

When using MCP tools, `fill_form` expects a `fields` array, not a single ref + value. For sliders, use `evaluate` to set `.value` and dispatch an `input` event instead.

### 6. Resize viewport for canvas apps

```powershell
./scripts/Start-Browser.ps1 -Url "http://localhost:5174" -ViewportSize "1400x1100" -Headed
```
