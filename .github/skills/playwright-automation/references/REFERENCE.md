---
title: Playwright Automation Skill Reference
description: Complete feature reference covering all 18 Playwright categories with CLI commands and direct API examples
author: Microsoft
ms.date: 2026-02-27
ms.topic: reference
keywords:
  - playwright
  - browser-automation
  - cli
  - testing
estimated_reading_time: 15
---

<!-- markdownlint-disable MD024 -->

Complete reference for all Playwright browser automation features. Covers both CLI commands (`playwright-cli`) and direct API usage (`playwright` npm package).

## When to Use Which Approach

| Criteria | Playwright CLI | Direct Playwright API |
| --- | --- | --- |
| **Best for** | Agents automating browser interactions | Writing persistent test suites, CI/CD |
| **Token efficiency** | High — concise commands | Medium — requires code |
| **State persistence** | Session-based | Script-controlled |
| **Flexibility** | High via `run-code` | Full control |
| **Test assertions** | Manual via snapshots | Built-in (`expect`) |

---

## 1. Navigation

### CLI Commands

```text
playwright-cli open [url]                  # Open browser, optionally navigate
playwright-cli open https://example.com --headed  # Open in headed mode
playwright-cli goto https://example.com    # Navigate to URL
playwright-cli go-back                     # Go back in history
playwright-cli go-forward                  # Go forward in history
playwright-cli reload                      # Reload current page
playwright-cli close                       # Close browser
```

### Direct API

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

await page.goto('https://example.com');
await page.goBack();
await page.goForward();
await page.reload();
await browser.close();
```

---

## 2. Element Interaction (Click, Hover, Drag)

### CLI Commands

```text
playwright-cli snapshot                    # Take snapshot first to get element refs
playwright-cli click e3                    # Click element ref e3
playwright-cli click e3 right              # Right-click
playwright-cli dblclick e7                 # Double-click
playwright-cli hover e4                    # Hover over element
playwright-cli drag e2 e8                  # Drag from e2 to e8
playwright-cli check e12                   # Check checkbox
playwright-cli uncheck e12                 # Uncheck checkbox
```

### Direct API

```typescript
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('button').dblclick();
await page.locator('canvas').click({
  button: 'right',
  modifiers: ['Shift'],
  position: { x: 100, y: 200 },
});
await page.getByRole('link').hover();
await page.locator('#source').dragTo(page.locator('#target'));
await page.getByRole('checkbox').check();
await page.getByRole('checkbox').uncheck();
```

---

## 3. Form Input

### CLI Commands

```text
playwright-cli type "search query"         # Type into focused element
playwright-cli fill e5 "user@example.com"  # Fill specific element
playwright-cli select e9 "option-value"    # Select dropdown option
playwright-cli upload ./document.pdf       # Upload file
```

### Direct API

```typescript
await page.getByRole('textbox').fill('Hello World');
await page.getByRole('textbox').clear();
await page.getByRole('textbox').pressSequentially('Hello', { delay: 100 });
await page.getByRole('combobox').selectOption('blue');
await page.getByRole('combobox').selectOption({ label: 'Blue' });
await page.getByLabel('Upload file').setInputFiles('myfile.pdf');
await page.getByLabel('Upload files').setInputFiles(['file1.txt', 'file2.txt']);
```

---

## 4. Keyboard Input

### CLI Commands

```text
playwright-cli press Enter                 # Press key
playwright-cli press ArrowDown             # Arrow keys
playwright-cli keydown Shift               # Key down
playwright-cli keyup Shift                 # Key up
```

### Direct API

```typescript
await page.getByRole('textbox').press('Enter');
await page.keyboard.press('Control+A');
await page.keyboard.type('Hello');
await page.keyboard.down('Shift');
await page.keyboard.up('Shift');
```

---

## 5. Mouse Input (Coordinate-Based)

### CLI Commands

```text
playwright-cli mousemove 150 300           # Move mouse to position
playwright-cli mousedown                   # Press left button down
playwright-cli mousedown right             # Press right button down
playwright-cli mouseup                     # Release left button
playwright-cli mousewheel 0 100            # Scroll wheel
```

### Direct API

```typescript
await page.mouse.move(100, 200);
await page.mouse.click(100, 200);
await page.mouse.down();
await page.mouse.up();
await page.mouse.wheel(0, 100);
```

---

## 6. Screenshots and PDF

### CLI Commands

```text
playwright-cli screenshot                  # Screenshot current page
playwright-cli screenshot e5               # Screenshot specific element
playwright-cli screenshot --filename=page.png  # Save with name
playwright-cli pdf                         # Save page as PDF
playwright-cli pdf --filename=page.pdf     # Save PDF with name
```

### Direct API

```typescript
await page.screenshot({ path: 'page.png', fullPage: true });
await page.getByRole('button').screenshot({ path: 'button.png' });
await page.pdf({ path: 'page.pdf', format: 'A4' });  // Chromium only
```

---

## 7. Page Snapshots (Accessibility Tree)

### CLI Commands

```text
playwright-cli snapshot                    # Capture accessibility snapshot
playwright-cli snapshot --filename=state.yaml  # Save to file
```

Snapshot output format:

```yaml
### Page
- Page URL: https://example.com/
- Page Title: Example Domain
### Snapshot
[Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

The snapshot contains element refs (e1, e2, etc.) used to target elements.

### Direct API

```typescript
const snapshot = await page.accessibility.snapshot();
console.log(JSON.stringify(snapshot, null, 2));
```

---

## 8. JavaScript Evaluation

### CLI Commands

```text
playwright-cli eval "document.title"
playwright-cli eval "el => el.textContent" e5
playwright-cli run-code "async page => {
  await page.getByRole('button', { name: 'Submit' }).click();
  return await page.title();
}"
```

### Direct API

```typescript
const title = await page.evaluate(() => document.title);
const text = await page.locator('#myElement').evaluate(el => el.textContent);
const data = await page.evaluate(() => ({
  userAgent: navigator.userAgent,
  cookies: document.cookie,
}));
```

---

## 9. Dialog Handling

### CLI Commands

```text
playwright-cli dialog-accept               # Accept dialog
playwright-cli dialog-accept "confirm"     # Accept with prompt text
playwright-cli dialog-dismiss              # Dismiss dialog
```

### Direct API

```typescript
page.on('dialog', async dialog => {
  console.log(dialog.message());
  await dialog.accept('confirmation text');
});

page.on('dialog', async dialog => {
  await dialog.dismiss();
});
```

---

## 10. Console and Network Monitoring

### CLI Commands

```text
playwright-cli console                     # List console messages
playwright-cli console warning             # Filter by level
playwright-cli network                     # List network requests
```

### Direct API

```typescript
page.on('console', msg => {
  console.log(`${msg.type()}: ${msg.text()}`);
});

page.on('request', request => {
  console.log(`>> ${request.method()} ${request.url()}`);
});

page.on('response', response => {
  console.log(`<< ${response.status()} ${response.url()}`);
});
```

---

## 11. Network Mocking / Route Interception

### CLI Commands

```text
playwright-cli route "**/*.jpg" --status=404
playwright-cli route "https://api.example.com/**" --body='{"mock": true}'
playwright-cli route-list                  # List active routes
playwright-cli unroute "**/*.jpg"          # Remove specific route
playwright-cli unroute                     # Remove all routes
```

### Direct API

```typescript
await page.route('**/api/data', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ mock: true }),
  });
});

await page.route('**/*.{png,jpg,jpeg}', route => route.abort());

await page.route('**/api/user', async route => {
  const response = await route.fetch();
  const json = await response.json();
  json.name = 'Modified';
  await route.fulfill({ response, json });
});
```

---

## 12. Tab Management

### CLI Commands

```text
playwright-cli tab-list                    # List all tabs
playwright-cli tab-new                     # Create new tab
playwright-cli tab-new https://example.com # New tab with URL
playwright-cli tab-close                   # Close current tab
playwright-cli tab-close 2                 # Close tab by index
playwright-cli tab-select 0               # Switch to tab by index
```

### Direct API

```typescript
const context = await browser.newContext();
const page2 = await context.newPage();
await page2.goto('https://example.com');
const pages = context.pages();
console.log(pages.map(p => p.url()));
await page2.close();
```

---

## 13. Storage State (Cookies, LocalStorage, SessionStorage)

### CLI Commands

```text
# Save/load full state
playwright-cli state-save auth.json
playwright-cli state-load auth.json

# Cookies
playwright-cli cookie-list
playwright-cli cookie-list --domain=example.com
playwright-cli cookie-get session_id
playwright-cli cookie-set session_id abc123
playwright-cli cookie-set session_id abc123 --domain=example.com --httpOnly --secure
playwright-cli cookie-delete session_id
playwright-cli cookie-clear

# LocalStorage
playwright-cli localstorage-list
playwright-cli localstorage-get theme
playwright-cli localstorage-set theme dark
playwright-cli localstorage-delete theme
playwright-cli localstorage-clear

# SessionStorage
playwright-cli sessionstorage-list
playwright-cli sessionstorage-get step
playwright-cli sessionstorage-set step 3
playwright-cli sessionstorage-delete step
playwright-cli sessionstorage-clear
```

### Direct API

```typescript
// Save storage state (cookies + localStorage)
await context.storageState({ path: 'auth.json' });

// Load storage state
const context = await browser.newContext({
  storageState: 'auth.json',
});

// Cookies
const cookies = await context.cookies();
await context.addCookies([{
  name: 'session',
  value: 'abc123',
  domain: 'example.com',
  path: '/',
}]);
await context.clearCookies();

// LocalStorage via evaluate
await page.evaluate(() => {
  localStorage.setItem('theme', 'dark');
});
const value = await page.evaluate(() => localStorage.getItem('theme'));
```

---

## 14. Browser Sessions

### CLI Commands

```text
# Named sessions (isolated browser instances)
playwright-cli -s=auth open https://app.example.com/login
playwright-cli -s=public open https://example.com

# Commands scoped to session
playwright-cli -s=auth fill e1 "user@example.com"
playwright-cli -s=public snapshot

# Session management
playwright-cli list                        # List all sessions
playwright-cli -s=auth close               # Close named session
playwright-cli close-all                   # Close all browsers
playwright-cli kill-all                    # Force kill all

# Persistent profile (survives browser restart)
playwright-cli open https://example.com --persistent
playwright-cli open --profile=/path/to/profile

# Environment variable for default session
# export PLAYWRIGHT_CLI_SESSION="my-session"
```

### Direct API

```typescript
const context1 = await browser.newContext();
const context2 = await browser.newContext();
const page1 = await context1.newPage();
const page2 = await context2.newPage();

// Persistent context
const context = await chromium.launchPersistentContext('/path/to/profile', {
  headless: false,
});
```

---

## 15. Tracing and Video Recording

### CLI Commands

```text
# Tracing
playwright-cli tracing-start
# ... perform actions ...
playwright-cli tracing-stop

# Video recording
playwright-cli video-start
# ... perform actions ...
playwright-cli video-stop recording.webm
```

### Direct API

```typescript
// Tracing
await context.tracing.start({ screenshots: true, snapshots: true });
await context.tracing.stop({ path: 'trace.zip' });
// View: npx playwright show-trace trace.zip

// Video recording
const context = await browser.newContext({
  recordVideo: { dir: './videos/', size: { width: 1280, height: 720 } },
});
await context.close(); // Video saved on close
```

---

## 16. Test Runner and Assertions (Direct API Only)

```typescript
import { test, expect } from '@playwright/test';

test('page has title', async ({ page }) => {
  await page.goto('https://example.com');

  await expect(page).toHaveTitle(/Example/);
  await expect(page.getByRole('heading')).toBeVisible();
  await expect(page.getByText('Example Domain')).toHaveText('Example Domain');
  await expect(page).toHaveScreenshot('homepage.png');
});

test('form submission', async ({ page }) => {
  await page.goto('https://example.com/form');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

---

## 17. Locator Strategies (Direct API)

Ordered by preference:

```typescript
// 1. Role-based (preferred — semantic, resilient)
page.getByRole('button', { name: 'Submit' });
page.getByRole('textbox', { name: 'Email' });
page.getByRole('heading', { level: 1 });

// 2. Label-based
page.getByLabel('Password');

// 3. Placeholder-based
page.getByPlaceholder('Enter email');

// 4. Text-based
page.getByText('Welcome');
page.getByText('Welcome', { exact: true });

// 5. Test ID (data-testid attribute)
page.getByTestId('submit-button');

// 6. CSS selector (least preferred — fragile)
page.locator('#submit-btn');
page.locator('.form-input');

// Chaining and filtering
page.getByRole('listitem').filter({ hasText: 'Product' });
page.getByRole('listitem').nth(2);
```

---

## 18. Waiting Strategies

### CLI Commands

```text
playwright-cli run-code "async page => {
  await page.waitForLoadState('networkidle');
}"

playwright-cli run-code "async page => {
  await page.waitForSelector('.loading', { state: 'hidden' });
}"
```

### Direct API

```typescript
await page.waitForURL('**/dashboard');
await page.waitForLoadState('networkidle');
await page.waitForSelector('.loading', { state: 'hidden' });
await page.waitForFunction(() => window.appReady === true);
// page.click(), page.fill(), etc. auto-wait for actionability
```

---

## Installation

### Playwright CLI

```powershell
# Global install
npm install -g @playwright/cli@latest

# Or use npx (no install)
npx playwright-cli --help

# Install browser automation skills for agent discovery
playwright-cli install --skills
```

### Direct Playwright API

```powershell
# Install as dev dependency
npm install -D playwright @playwright/test

# Install browsers
npx playwright install
```

---

## Configuration

### CLI Configuration File

Create `.playwright/cli.config.json` (loaded automatically):

```json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "headless": true
    },
    "contextOptions": {
      "viewport": { "width": 1280, "height": 720 }
    }
  }
}
```

### Environment Variables

| Variable | Description |
| --- | --- |
| `PLAYWRIGHT_CLI_SESSION` | Default session name |
| `PLAYWRIGHT_MCP_BROWSER` | Browser: chrome, firefox, webkit, msedge |
| `PLAYWRIGHT_MCP_HEADLESS` | Run headless (true/false) |
| `PLAYWRIGHT_MCP_VIEWPORT_SIZE` | Viewport, e.g., "1280x720" |
| `PLAYWRIGHT_MCP_DEVICE` | Device emulation, e.g., "iPhone 15" |
| `PLAYWRIGHT_MCP_USER_DATA_DIR` | User data directory path |
| `PLAYWRIGHT_MCP_TIMEOUT_ACTION` | Action timeout ms (default: 5000) |
| `PLAYWRIGHT_MCP_TIMEOUT_NAVIGATION` | Navigation timeout ms (default: 60000) |
