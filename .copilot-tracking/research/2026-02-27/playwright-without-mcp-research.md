<!-- markdownlint-disable-file -->

# Playwright Without MCP Server — Research Document

**Date**: 2026-02-27
**Scope**: Research the microsoft/playwright-mcp repo, determine what is needed to use Playwright without the MCP server, and document Playwright features categorized for use by a Custom Agent.

## Success Criteria

- Comprehensive understanding of what playwright-mcp provides vs. what Playwright offers natively
- Clear documentation of three approaches: MCP Server, CLI + SKILLS, and Direct Programmatic API
- Feature categorization with practical usage instructions for each approach
- Agent-specific guidance for using Playwright without MCP dependency

## Evidence Log

### Source 1: microsoft/playwright-mcp Repository (GitHub)

- **URL**: <https://github.com/microsoft/playwright-mcp>
- **Version**: v0.0.68 (latest as of 2026-02-27)
- **Description**: MCP server wrapping Playwright for LLM browser automation via structured accessibility snapshots
- **Key finding**: The README explicitly recommends CLI+SKILLS over MCP for coding agents: "Modern coding agents increasingly favor CLI–based workflows exposed as SKILLs over MCP because CLI invocations are more token-efficient"
- **Architecture**: Monorepo with `packages/playwright-mcp` (core server) and `packages/extension` (Chrome extension)
- **Tool categories**: Core automation, Tab management, Browser installation, Vision (opt-in), PDF (opt-in), Testing (opt-in), Tracing (opt-in)

### Source 2: microsoft/playwright-cli Repository (GitHub)

- **URL**: <https://github.com/microsoft/playwright-cli>
- **Version**: v0.1.1 (latest as of 2026-02-27)
- **Description**: CLI interface into Playwright designed for coding agents, more token-efficient than MCP
- **Key finding**: Provides all MCP capabilities via shell commands, with SKILL files for agent integration
- **Architecture**: Single entry point (`playwright-cli.js`) that requires `playwright/lib/cli/client/program`
- **Skills system**: `playwright-cli install --skills` generates SKILL.md and reference docs for agent consumption

### Source 3: Playwright Official Documentation

- **URL**: <https://playwright.dev>
- **Library**: `playwright` / `@playwright/test` npm packages
- **Key finding**: Full programmatic API for browser automation — the foundation that both MCP and CLI wrap
- **Coverage**: Navigation, clicks, form filling, keyboard/mouse, screenshots, file upload, network interception, dialog handling, assertions, test runner

## Analysis: Three Approaches to Using Playwright

### Approach 1: Playwright MCP Server (`@playwright/mcp`)

**How it works**: Runs as a Model Context Protocol server, exposing browser automation as MCP tools that LLMs call through structured JSON schemas.

**Strengths**:
- Persistent browser state across tool calls
- Rich introspection via accessibility snapshots
- Iterative reasoning over page structure
- Self-healing test workflows

**Weaknesses**:
- Large tool schemas loaded into model context
- Verbose accessibility trees consume tokens
- Requires MCP client infrastructure
- Higher token cost per interaction

**Best for**: Exploratory automation, long-running autonomous workflows where maintaining continuous browser context outweighs token cost.

### Approach 2: Playwright CLI + SKILLS (`@playwright/cli`)

**How it works**: Shell commands invoked via `run_in_terminal` that wrap Playwright operations. SKILL files teach agents the command vocabulary.

**Strengths**:
- Token-efficient (no tool schemas or accessibility trees in context)
- Purpose-built commands for common operations
- Session management across CLI calls
- Snapshot files for page state inspection
- Code generation built-in (each action outputs Playwright TypeScript)

**Weaknesses**:
- Requires process spawning per command
- Session state tied to background daemon process
- Less rich introspection than MCP snapshots

**Best for**: Coding agents that balance browser automation with large codebases within limited context windows.

### Approach 3: Direct Playwright API (Programmatic)

**How it works**: TypeScript/JavaScript code using `playwright` npm package directly — writing and running scripts or tests.

**Strengths**:
- Full API access with no abstraction overhead
- Complete control over browser lifecycle
- Native test runner with assertions, fixtures, parallelization
- No daemon process or MCP server needed
- Standard testing framework patterns

**Weaknesses**:
- Requires writing and executing code files
- Agent must understand Playwright API
- No built-in snapshot format for agent consumption

**Best for**: Writing persistent test suites, complex automation scripts, CI/CD integration.

## Selected Approach for Document

The deliverable document will cover **all three approaches** but emphasize **Approach 2 (CLI + SKILLS)** and **Approach 3 (Direct API)** as the MCP-free alternatives, with a comparison table to help agents/users choose.

## MCP Server Tool → CLI Command → API Method Mapping

| MCP Tool | CLI Command | Playwright API |
|---|---|---|
| `browser_navigate` | `playwright-cli goto <url>` | `page.goto(url)` |
| `browser_click` | `playwright-cli click <ref>` | `page.getByRole(...).click()` |
| `browser_type` | `playwright-cli type <text>` | `page.getByRole('textbox').fill(text)` |
| `browser_fill_form` | `playwright-cli fill <ref> <text>` | `page.locator(selector).fill(text)` |
| `browser_press_key` | `playwright-cli press <key>` | `page.keyboard.press(key)` |
| `browser_snapshot` | `playwright-cli snapshot` | N/A (custom implementation) |
| `browser_take_screenshot` | `playwright-cli screenshot` | `page.screenshot()` |
| `browser_evaluate` | `playwright-cli eval <func>` | `page.evaluate(fn)` |
| `browser_drag` | `playwright-cli drag <start> <end>` | `page.locator(src).dragTo(target)` |
| `browser_hover` | `playwright-cli hover <ref>` | `page.locator(selector).hover()` |
| `browser_select_option` | `playwright-cli select <ref> <val>` | `page.selectOption(selector, value)` |
| `browser_file_upload` | `playwright-cli upload <file>` | `page.setInputFiles(selector, path)` |
| `browser_handle_dialog` | `playwright-cli dialog-accept` | `page.on('dialog', d => d.accept())` |
| `browser_console_messages` | `playwright-cli console` | `page.on('console', msg => ...)` |
| `browser_network_requests` | `playwright-cli network` | `page.on('request', req => ...)` |
| `browser_tabs` | `playwright-cli tab-list` | `context.pages()` |
| `browser_resize` | `playwright-cli resize <w> <h>` | `page.setViewportSize({w, h})` |
| `browser_navigate_back` | `playwright-cli go-back` | `page.goBack()` |
| `browser_close` | `playwright-cli close` | `browser.close()` |
| `browser_run_code` | `playwright-cli run-code <code>` | Direct code execution |
| `browser_wait_for` | N/A | `page.waitForSelector(...)` |
| `browser_install` | N/A | `npx playwright install` |

## Actionable Next Steps

1. Create the categorized Playwright features document (deliverable)
2. Include CLI command reference, API examples, and agent-specific instructions
3. Structure for Custom Agent consumption with clear sections per feature category
