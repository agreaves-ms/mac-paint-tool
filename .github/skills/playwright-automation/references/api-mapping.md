---
title: MCP Tool to CLI Command to API Mapping
description: Quick reference translating between Playwright MCP tools, CLI commands, and direct API calls
author: Microsoft
ms.date: 2026-02-27
ms.topic: reference
keywords:
  - playwright
  - mcp
  - api-mapping
  - cli
estimated_reading_time: 3
---

Use this table to translate between Playwright MCP server tools, CLI commands, and direct API calls.

| MCP Tool | CLI Command | Playwright API |
| --- | --- | --- |
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

## Key Differences

### MCP Server vs CLI

* MCP tools use structured JSON schemas — the CLI uses flat shell arguments
* MCP snapshot returns YAML with element refs — CLI snapshot does the same
* MCP requires MCP server running — CLI runs directly from terminal
* MCP tools have built-in error responses — CLI uses exit codes

### CLI vs Direct API

* CLI uses element refs (e1, e2, ...) from snapshots — API uses locators
* CLI maintains session state between commands — API manages page objects directly
* CLI is platform-agnostic (shell commands) — API requires TypeScript/JavaScript
* CLI auto-snapshots after each action — API requires explicit assertions
