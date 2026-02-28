---
title: Playwright CLI Command Quick Reference
description: Concise listing of all playwright-cli commands grouped by category
author: Microsoft
ms.date: 2026-02-27
ms.topic: reference
keywords:
  - playwright-cli
  - commands
  - quick-reference
estimated_reading_time: 5
---

All commands use `playwright-cli` (or `npx playwright-cli`). Use `-s=<name>` before any command to target a named session.

## Browser Lifecycle

| Command | Description |
| --- | --- |
| `open [url]` | Open browser, optionally navigate to URL |
| `open <url> --headed` | Open in headed (visible) mode |
| `open <url> --persistent` | Use persistent profile |
| `open --profile=<path>` | Use specific profile directory |
| `close` | Close current browser |
| `close-all` | Close all browsers |
| `kill-all` | Force kill all browsers |
| `list` | List all active sessions |

## Navigation

| Command | Description |
| --- | --- |
| `goto <url>` | Navigate to URL |
| `go-back` | Go back in history |
| `go-forward` | Go forward in history |
| `reload` | Reload current page |

## Page Inspection

| Command | Description |
| --- | --- |
| `snapshot` | Capture accessibility tree with element refs |
| `snapshot --filename=<file>` | Save snapshot to file |
| `screenshot` | Screenshot current page |
| `screenshot <ref>` | Screenshot specific element |
| `screenshot --filename=<file>` | Save screenshot with name |
| `pdf` | Save page as PDF |
| `pdf --filename=<file>` | Save PDF with name |

## Element Interaction

| Command | Description |
| --- | --- |
| `click <ref>` | Click element |
| `click <ref> right` | Right-click element |
| `dblclick <ref>` | Double-click element |
| `hover <ref>` | Hover over element |
| `drag <startRef> <endRef>` | Drag from start to end element |
| `check <ref>` | Check checkbox |
| `uncheck <ref>` | Uncheck checkbox |

## Form Input

| Command | Description |
| --- | --- |
| `fill <ref> "<text>"` | Fill element with text |
| `type "<text>"` | Type into focused element |
| `select <ref> "<value>"` | Select dropdown option |
| `upload <filePath>` | Upload file |

## Keyboard

| Command | Description |
| --- | --- |
| `press <key>` | Press key (Enter, ArrowDown, Tab, etc.) |
| `keydown <key>` | Key down |
| `keyup <key>` | Key up |

## Mouse (Coordinate-Based)

| Command | Description |
| --- | --- |
| `mousemove <x> <y>` | Move mouse to position |
| `mousedown [button]` | Press mouse button down |
| `mouseup [button]` | Release mouse button |
| `mousewheel <dx> <dy>` | Scroll wheel |

## JavaScript

| Command | Description |
| --- | --- |
| `eval "<expression>"` | Evaluate expression |
| `eval "<fn>" <ref>` | Evaluate on element |
| `run-code "<asyncFn>"` | Run full Playwright code |

## Dialogs

| Command | Description |
| --- | --- |
| `dialog-accept` | Accept dialog |
| `dialog-accept "<text>"` | Accept with prompt text |
| `dialog-dismiss` | Dismiss dialog |

## Monitoring

| Command | Description |
| --- | --- |
| `console` | List console messages |
| `console <level>` | Filter by level (warning, error, etc.) |
| `network` | List network requests |

## Network Mocking

| Command | Description |
| --- | --- |
| `route "<pattern>" --status=<code>` | Mock with status code |
| `route "<pattern>" --body='<json>'` | Mock with response body |
| `route-list` | List active routes |
| `unroute "<pattern>"` | Remove specific route |
| `unroute` | Remove all routes |

## Tabs

| Command | Description |
| --- | --- |
| `tab-list` | List all tabs |
| `tab-new [url]` | Create new tab |
| `tab-close [index]` | Close tab |
| `tab-select <index>` | Switch to tab |

## Storage

| Command | Description |
| --- | --- |
| `state-save <file>` | Save full state (cookies + localStorage) |
| `state-load <file>` | Load saved state |
| `cookie-list [--domain=<d>]` | List cookies |
| `cookie-get <name>` | Get cookie value |
| `cookie-set <name> <val> [--domain=<d>] [--httpOnly] [--secure]` | Set cookie |
| `cookie-delete <name>` | Delete cookie |
| `cookie-clear` | Clear all cookies |
| `localstorage-list` | List localStorage keys |
| `localstorage-get <key>` | Get localStorage value |
| `localstorage-set <key> <val>` | Set localStorage value |
| `localstorage-delete <key>` | Delete localStorage key |
| `localstorage-clear` | Clear all localStorage |
| `sessionstorage-list` | List sessionStorage keys |
| `sessionstorage-get <key>` | Get sessionStorage value |
| `sessionstorage-set <key> <val>` | Set sessionStorage value |
| `sessionstorage-delete <key>` | Delete sessionStorage key |
| `sessionstorage-clear` | Clear all sessionStorage |

## Tracing and Recording

| Command | Description |
| --- | --- |
| `tracing-start` | Start trace recording |
| `tracing-stop` | Stop trace and save |
| `video-start` | Start video recording |
| `video-stop <file>` | Stop video and save |

## Sessions

| Command | Description |
| --- | --- |
| `-s=<name> <command>` | Scope command to named session |
| `list` | List all active sessions |
| `show` | Open visual session dashboard |

## Viewport

| Command | Description |
| --- | --- |
| `resize <width> <height>` | Resize viewport |
