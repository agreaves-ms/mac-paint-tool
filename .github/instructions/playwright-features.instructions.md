---
description: "Comprehensive reference for using Playwright browser automation without the MCP server — via CLI commands or direct API. Includes feature categories, agent integration guidance, and practical examples."
applyTo: "**"
---

# Playwright Browser Automation — Without MCP Server

This document covers how to use Playwright for browser automation **without** the Playwright MCP server. It describes two MCP-free approaches:

1. **Playwright CLI** (`@playwright/cli`) — Shell commands invoked via terminal, optimized for coding agents
2. **Direct Playwright API** — TypeScript/JavaScript programmatic usage via `playwright` npm package

## When to Use Which Approach

| Criteria | Playwright CLI | Direct Playwright API |
|---|---|---|
| **Best for** | Agents automating browser interactions | Writing persistent test suites, CI/CD |
| **Token efficiency** | High — concise commands, no schema overhead | Medium — requires writing/reading code |
| **State persistence** | Session-based (in-memory or persistent) | Script-controlled |
| **Learning curve** | Low — shell commands | Medium — API knowledge required |
| **Flexibility** | High via `run-code` escape hatch | Full control |
| **Test assertions** | Manual via snapshots | Built-in (`expect`) |
| **Parallelization** | Named sessions | Native test runner |

## Installation

### Playwright CLI

```bash
# Global install
npm install -g @playwright/cli@latest

# Or use npx (no install)
npx playwright-cli --help

# Install browser automation skills for agent discovery
playwright-cli install --skills
```

### Direct Playwright API

```bash
# Install as dev dependency
npm install -D playwright @playwright/test

# Install browsers
npx playwright install
```

---

## Feature Reference

### 1. Navigation

#### CLI Commands

```bash
playwright-cli open [url]               # Open browser, optionally navigate
playwright-cli open https://example.com --headed  # Open in headed mode
playwright-cli goto https://example.com  # Navigate to URL
playwright-cli go-back                   # Go back in history
playwright-cli go-forward                # Go forward in history
playwright-cli reload                    # Reload current page
playwright-cli close                     # Close browser
```

#### Direct API

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

### 2. Element Interaction (Click, Hover, Drag)

#### CLI Commands

```bash
# Take snapshot first to get element refs
playwright-cli snapshot

# Click, double-click, hover
playwright-cli click e3                  # Click element ref e3
playwright-cli click e3 right            # Right-click
playwright-cli dblclick e7               # Double-click
playwright-cli hover e4                  # Hover over element
playwright-cli drag e2 e8                # Drag from e2 to e8
playwright-cli check e12                 # Check checkbox
playwright-cli uncheck e12               # Uncheck checkbox
```

#### Direct API

```typescript
// Click actions
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('button').dblclick();
await page.locator('canvas').click({
  button: 'right',
  modifiers: ['Shift'],
  position: { x: 100, y: 200 },
});

// Hover and drag
await page.getByRole('link').hover();
await page.locator('#source').dragTo(page.locator('#target'));

// Checkboxes
await page.getByRole('checkbox').check();
await page.getByRole('checkbox').uncheck();
```

---

### 3. Form Input

#### CLI Commands

```bash
playwright-cli type "search query"       # Type into focused element
playwright-cli fill e5 "user@example.com" # Fill specific element
playwright-cli select e9 "option-value"  # Select dropdown option
playwright-cli upload ./document.pdf     # Upload file
```

#### Direct API

```typescript
// Text input
await page.getByRole('textbox').fill('Hello World');
await page.getByRole('textbox').clear();
await page.getByRole('textbox').pressSequentially('Hello', { delay: 100 });

// Dropdowns
await page.getByRole('combobox').selectOption('blue');
await page.getByRole('combobox').selectOption({ label: 'Blue' });

// File uploads
await page.getByLabel('Upload file').setInputFiles('myfile.pdf');
await page.getByLabel('Upload files').setInputFiles(['file1.txt', 'file2.txt']);
```

---

### 4. Keyboard Input

#### CLI Commands

```bash
playwright-cli press Enter               # Press key
playwright-cli press ArrowDown           # Arrow keys
playwright-cli keydown Shift             # Key down
playwright-cli keyup Shift               # Key up
```

#### Direct API

```typescript
await page.getByRole('textbox').press('Enter');
await page.keyboard.press('Control+A');
await page.keyboard.type('Hello');
await page.keyboard.down('Shift');
await page.keyboard.up('Shift');
```

---

### 5. Mouse Input (Coordinate-Based)

#### CLI Commands

```bash
playwright-cli mousemove 150 300         # Move mouse to position
playwright-cli mousedown                 # Press left button down
playwright-cli mousedown right           # Press right button down
playwright-cli mouseup                   # Release left button
playwright-cli mousewheel 0 100          # Scroll wheel
```

#### Direct API

```typescript
await page.mouse.move(100, 200);
await page.mouse.click(100, 200);
await page.mouse.down();
await page.mouse.up();
await page.mouse.wheel(0, 100);
```

---

### 6. Screenshots and PDF

#### CLI Commands

```bash
playwright-cli screenshot                # Screenshot current page
playwright-cli screenshot e5             # Screenshot specific element
playwright-cli screenshot --filename=page.png  # Save with name
playwright-cli pdf                       # Save page as PDF
playwright-cli pdf --filename=page.pdf   # Save PDF with name
```

#### Direct API

```typescript
// Full page screenshot
await page.screenshot({ path: 'page.png', fullPage: true });

// Element screenshot
await page.getByRole('button').screenshot({ path: 'button.png' });

// PDF (Chromium only)
await page.pdf({ path: 'page.pdf', format: 'A4' });
```

---

### 7. Page Snapshots (Accessibility Tree)

#### CLI Commands

```bash
playwright-cli snapshot                  # Capture accessibility snapshot
playwright-cli snapshot --filename=state.yaml  # Save to file
```

**Snapshot output format** — after each CLI command, a snapshot is automatically provided:

```yaml
### Page
- Page URL: https://example.com/
- Page Title: Example Domain
### Snapshot
[Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

The snapshot contains element refs (e1, e2, etc.) used to target elements in subsequent commands.

#### Direct API

Playwright does not have a built-in accessibility snapshot in the same format. Use the accessibility tree API:

```typescript
const snapshot = await page.accessibility.snapshot();
console.log(JSON.stringify(snapshot, null, 2));
```

---

### 8. JavaScript Evaluation

#### CLI Commands

```bash
# Evaluate expression
playwright-cli eval "document.title"

# Evaluate on element
playwright-cli eval "el => el.textContent" e5

# Run full Playwright code
playwright-cli run-code "async page => {
  await page.getByRole('button', { name: 'Submit' }).click();
  return await page.title();
}"
```

#### Direct API

```typescript
// Evaluate in page context
const title = await page.evaluate(() => document.title);

// Evaluate on element
const text = await page.locator('#myElement').evaluate(el => el.textContent);

// Complex evaluation
const data = await page.evaluate(() => {
  return {
    userAgent: navigator.userAgent,
    cookies: document.cookie,
  };
});
```

---

### 9. Dialog Handling

#### CLI Commands

```bash
playwright-cli dialog-accept             # Accept dialog
playwright-cli dialog-accept "confirm"   # Accept with prompt text
playwright-cli dialog-dismiss            # Dismiss dialog
```

#### Direct API

```typescript
// Auto-accept dialogs
page.on('dialog', async dialog => {
  console.log(dialog.message());
  await dialog.accept('confirmation text');
});

// Or dismiss
page.on('dialog', async dialog => {
  await dialog.dismiss();
});
```

---

### 10. Console and Network Monitoring

#### CLI Commands

```bash
playwright-cli console                   # List console messages
playwright-cli console warning           # Filter by level
playwright-cli network                   # List network requests
```

#### Direct API

```typescript
// Console messages
page.on('console', msg => {
  console.log(`${msg.type()}: ${msg.text()}`);
});

// Network requests
page.on('request', request => {
  console.log(`>> ${request.method()} ${request.url()}`);
});

page.on('response', response => {
  console.log(`<< ${response.status()} ${response.url()}`);
});
```

---

### 11. Network Mocking / Route Interception

#### CLI Commands

```bash
# Mock requests matching pattern
playwright-cli route "**/*.jpg" --status=404
playwright-cli route "https://api.example.com/**" --body='{"mock": true}'
playwright-cli route-list                # List active routes
playwright-cli unroute "**/*.jpg"        # Remove specific route
playwright-cli unroute                   # Remove all routes
```

#### Direct API

```typescript
// Intercept and mock API responses
await page.route('**/api/data', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ mock: true }),
  });
});

// Block images
await page.route('**/*.{png,jpg,jpeg}', route => route.abort());

// Modify response
await page.route('**/api/user', async route => {
  const response = await route.fetch();
  const json = await response.json();
  json.name = 'Modified';
  await route.fulfill({ response, json });
});
```

---

### 12. Tab Management

#### CLI Commands

```bash
playwright-cli tab-list                  # List all tabs
playwright-cli tab-new                   # Create new tab
playwright-cli tab-new https://example.com  # New tab with URL
playwright-cli tab-close                 # Close current tab
playwright-cli tab-close 2              # Close tab by index
playwright-cli tab-select 0             # Switch to tab by index
```

#### Direct API

```typescript
const context = await browser.newContext();

// Create new page (tab)
const page2 = await context.newPage();
await page2.goto('https://example.com');

// List all pages
const pages = context.pages();
console.log(pages.map(p => p.url()));

// Close specific page
await page2.close();
```

---

### 13. Storage State (Cookies, LocalStorage, SessionStorage)

#### CLI Commands

```bash
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

#### Direct API

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

### 14. Browser Sessions

#### CLI Commands

```bash
# Named sessions (isolated browser instances)
playwright-cli -s=auth open https://app.example.com/login
playwright-cli -s=public open https://example.com

# Commands scoped to session
playwright-cli -s=auth fill e1 "user@example.com"
playwright-cli -s=public snapshot

# Session management
playwright-cli list                      # List all sessions
playwright-cli -s=auth close             # Close named session
playwright-cli close-all                 # Close all browsers
playwright-cli kill-all                  # Force kill all

# Persistent profile (survives browser restart)
playwright-cli open https://example.com --persistent
playwright-cli open --profile=/path/to/profile

# Environment variable for default session
# export PLAYWRIGHT_CLI_SESSION="my-session"
```

#### Direct API

```typescript
// Multiple contexts = isolated sessions
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

### 15. Tracing and Video Recording

#### CLI Commands

```bash
# Tracing
playwright-cli tracing-start
# ... perform actions ...
playwright-cli tracing-stop

# Video recording
playwright-cli video-start
# ... perform actions ...
playwright-cli video-stop recording.webm
```

#### Direct API

```typescript
// Tracing
await context.tracing.start({ screenshots: true, snapshots: true });
// ... perform actions ...
await context.tracing.stop({ path: 'trace.zip' });
// View: npx playwright show-trace trace.zip

// Video recording
const context = await browser.newContext({
  recordVideo: { dir: './videos/', size: { width: 1280, height: 720 } },
});
// ... perform actions ...
await context.close(); // Video saved on close
```

---

### 16. Test Runner and Assertions (Direct API Only)

The Playwright Test runner (`@playwright/test`) provides a full testing framework not available through CLI.

```typescript
import { test, expect } from '@playwright/test';

test('page has title', async ({ page }) => {
  await page.goto('https://example.com');

  // Web-first assertions (auto-retry)
  await expect(page).toHaveTitle(/Example/);
  await expect(page.getByRole('heading')).toBeVisible();
  await expect(page.getByText('Example Domain')).toHaveText('Example Domain');

  // Screenshot comparison
  await expect(page).toHaveScreenshot('homepage.png');
});

test('form submission', async ({ page }) => {
  await page.goto('https://example.com/form');

  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Success')).toBeVisible();
});
```

#### Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npx vite --config vite.renderer.config.ts --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### 17. Locator Strategies (Direct API)

Playwright provides multiple locator strategies, ordered by preference:

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

### 18. Waiting Strategies

#### CLI Commands

```bash
playwright-cli run-code "async page => {
  await page.waitForLoadState('networkidle');
}"

playwright-cli run-code "async page => {
  await page.waitForSelector('.loading', { state: 'hidden' });
}"
```

#### Direct API

```typescript
// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for load state
await page.waitForLoadState('networkidle');

// Wait for element
await page.waitForSelector('.loading', { state: 'hidden' });

// Wait for function
await page.waitForFunction(() => window.appReady === true);

// Auto-waiting (built into actions)
// page.click(), page.fill(), etc. auto-wait for actionability
```

---

## Custom Agent Integration Guide

### Using Playwright CLI in a Custom Agent

The CLI approach is ideal for Custom Agents because commands run via terminal, requiring no special tool infrastructure beyond `run_in_terminal`.

#### Agent Instructions Template

When creating a Custom Agent that uses Playwright CLI, include these instructions:

```markdown
## Browser Automation

This agent uses `playwright-cli` for browser automation. No MCP server is needed.

### Setup

Ensure playwright-cli is installed:
- Global: `npm install -g @playwright/cli@latest`
- Local: `npx playwright-cli <command>`

### Workflow Pattern

1. Open browser: `playwright-cli open <url>` (add `--headed` to see the browser)
2. Take snapshot: `playwright-cli snapshot` to get element refs
3. Interact using refs: `playwright-cli click e3`, `playwright-cli fill e5 "text"`
4. Take screenshot: `playwright-cli screenshot --filename=result.png`
5. Close browser: `playwright-cli close`

### Key Rules

- Always take a `snapshot` before interacting with elements to get current refs
- Element refs (e1, e2, ...) change after page navigation or DOM updates
- Use `--filename=` for screenshots/snapshots that are workflow artifacts
- Use named sessions (`-s=name`) when managing multiple browsers
- Close browsers when done: `playwright-cli close` or `playwright-cli close-all`
```

#### Agent Tool Restrictions

For a SKILL.md or agent file, restrict tools to only the CLI:

```yaml
---
name: browser-automation
description: Automates browser interactions for testing and data extraction
allowed-tools: Bash(playwright-cli:*)
---
```

#### Session Management for Agents

```bash
# Set session via environment variable
export PLAYWRIGHT_CLI_SESSION="agent-session"

# Or use -s= flag per command
playwright-cli -s=testing open https://localhost:5174
playwright-cli -s=testing snapshot
playwright-cli -s=testing click e3
playwright-cli -s=testing close
```

### Using Direct Playwright API in a Custom Agent

For agents that write and run test scripts:

```markdown
## Writing Playwright Tests

### File Pattern

Create test files in `tests/` with `.spec.ts` extension:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // ... assertions
  });
});
```

### Running Tests

```bash
npx playwright test                      # Run all tests
npx playwright test tests/my.spec.ts     # Run specific file
npx playwright test --headed             # Run with browser visible
npx playwright test --debug              # Debug mode
npx playwright show-report               # View HTML report
```
```

### Monitoring Agent Browser Sessions

Use the visual dashboard to observe agent browser activity:

```bash
playwright-cli show
```

This opens a session grid showing all active browser sessions with live screencasts, allowing manual intervention if needed.

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

All configuration can also be set via environment variables:

| Variable | Description |
|---|---|
| `PLAYWRIGHT_CLI_SESSION` | Default session name |
| `PLAYWRIGHT_MCP_BROWSER` | Browser to use: chrome, firefox, webkit, msedge |
| `PLAYWRIGHT_MCP_HEADLESS` | Run headless (true/false) |
| `PLAYWRIGHT_MCP_VIEWPORT_SIZE` | Viewport size, e.g., "1280x720" |
| `PLAYWRIGHT_MCP_DEVICE` | Device to emulate, e.g., "iPhone 15" |
| `PLAYWRIGHT_MCP_USER_DATA_DIR` | Path to user data directory |
| `PLAYWRIGHT_MCP_TIMEOUT_ACTION` | Action timeout in ms (default: 5000) |
| `PLAYWRIGHT_MCP_TIMEOUT_NAVIGATION` | Navigation timeout in ms (default: 60000) |

---

## MCP Tool → CLI Command → API Mapping

Quick reference for translating between approaches:

| MCP Tool | CLI Command | Playwright API |
|---|---|---|
| `browser_navigate` | `goto <url>` | `page.goto(url)` |
| `browser_click` | `click <ref>` | `locator.click()` |
| `browser_type` | `type <text>` | `locator.fill(text)` |
| `browser_fill_form` | `fill <ref> <text>` | `locator.fill(text)` |
| `browser_press_key` | `press <key>` | `page.keyboard.press(key)` |
| `browser_hover` | `hover <ref>` | `locator.hover()` |
| `browser_drag` | `drag <start> <end>` | `locator.dragTo(target)` |
| `browser_select_option` | `select <ref> <val>` | `locator.selectOption(val)` |
| `browser_file_upload` | `upload <file>` | `locator.setInputFiles(path)` |
| `browser_snapshot` | `snapshot` | `page.accessibility.snapshot()` |
| `browser_take_screenshot` | `screenshot` | `page.screenshot()` |
| `browser_evaluate` | `eval <func>` | `page.evaluate(fn)` |
| `browser_run_code` | `run-code <code>` | Direct code execution |
| `browser_handle_dialog` | `dialog-accept/dismiss` | `page.on('dialog', ...)` |
| `browser_console_messages` | `console` | `page.on('console', ...)` |
| `browser_network_requests` | `network` | `page.on('request', ...)` |
| `browser_tabs` | `tab-list` | `context.pages()` |
| `browser_resize` | `resize <w> <h>` | `page.setViewportSize()` |
| `browser_navigate_back` | `go-back` | `page.goBack()` |
| `browser_close` | `close` | `browser.close()` |
| `browser_wait_for` | `run-code "..."` | `page.waitForSelector()` |
| `browser_install` | N/A | `npx playwright install` |
| `browser_pdf_save` | `pdf` | `page.pdf()` |

---

## Pitfalls and Best Practices

### CLI Pitfalls

1. **Element refs are ephemeral** — Refs from `snapshot` change after navigation or DOM mutations. Always re-snapshot before interacting.
2. **Session cleanup** — Always close browsers when done (`playwright-cli close` or `close-all`). Zombie processes persist otherwise.
3. **Headed mode** — Pass `--headed` to `open`, not to subsequent commands. The display mode is set at browser launch time.
4. **Quoting in run-code** — Use double quotes for the outer string, single quotes inside: `playwright-cli run-code "async page => { await page.goto('url'); }"`

### API Pitfalls

1. **Auto-waiting** — Playwright auto-waits for elements to be actionable. Avoid manual `waitForSelector` unless checking for absence or specific states.
2. **Context isolation** — Each `browser.newContext()` has independent cookies, storage, and cache. Use this for test isolation.
3. **Headless by default** — Pass `{ headless: false }` to `chromium.launch()` to see the browser.
4. **Close resources** — Always close `browser` and `context` to avoid resource leaks.

### For This Project (mac-paint-tool)

- The Electron app uses Vite. Run `npx vite --config vite.renderer.config.ts --port 5174` for a standalone server accessible to Playwright.
- `window.electronAPI` is **not available** in standalone mode — test canvas drawing and UI interactions only.
- Port 5174 avoids conflicts with Electron Forge's port 5173.
- For canvas testing, use `page.evaluate()` to call Canvas 2D API directly on `document.getElementById('paint-canvas')`.
