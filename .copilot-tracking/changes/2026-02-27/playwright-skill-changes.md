<!-- markdownlint-disable-file -->

# Playwright Automation Skill - Changes Log

## Related Plan

Path: `.copilot-tracking/plans/2026-02-27/playwright-skill-plan.instructions.md`

## Implementation Date

2026-02-27

## Summary

Created a complete VS Code Agent Skill for Playwright browser automation at `.github/skills/playwright-automation/`. The skill provides PowerShell scripts for all automation operations, reference documentation for all 18 Playwright feature categories, and template files for agent code generation.

## Changes by Category

### Added

**Core Skill Definition**:

- `.github/skills/playwright-automation/SKILL.md` — Main skill file with overview, prerequisites, quick start, parameters reference (7 scripts), script reference with usage examples, workflow pattern for agents, template links, extended reference links, and troubleshooting table

**PowerShell Scripts** (`.github/skills/playwright-automation/scripts/`):

- `shared.psm1` — Shared module with utilities: Get-RepositoryRoot, Test-CommandAvailable, Invoke-NpmCommand, Invoke-PlaywrightCli, Wait-ForUrl, Write-SkillOutput
- `Install-Playwright.ps1` — Installs CLI, API packages, and browser binaries
- `Start-DevServer.ps1` — Starts standalone Vite dev server for Playwright testing
- `Start-Browser.ps1` — Opens browser session with URL, headed mode, session name, browser type, viewport options
- `Stop-Browser.ps1` — Closes browser sessions (named, all, or force kill)
- `Invoke-BrowserAction.ps1` — Executes 20+ browser actions (click, fill, type, select, hover, drag, press, snapshot, eval, goto, dialogs, console, network, tabs, navigation)
- `Take-Screenshot.ps1` — Takes screenshots and PDFs with element ref and filename options
- `Run-Tests.ps1` — Executes Playwright Test runner with file, headed, debug, grep, project, workers, report options

**Reference Documentation** (`.github/skills/playwright-automation/references/`):

- `REFERENCE.md` — Complete feature reference covering all 18 Playwright categories with CLI and API examples, installation, and configuration
- `CLI-COMMANDS.md` — Quick reference of all CLI commands grouped by category (browser lifecycle, navigation, inspection, interaction, form input, keyboard, mouse, JavaScript, dialogs, monitoring, network mocking, tabs, storage, tracing, sessions, viewport)
- `API-MAPPING.md` — MCP Tool → CLI Command → Playwright API mapping table with key differences section
- `PITFALLS.md` — CLI pitfalls (5), API pitfalls (5), project-specific pitfalls (6), and agent-specific best practices (6)

**Asset Templates** (`.github/skills/playwright-automation/assets/templates/`):

- `playwright.config.ts` — Playwright Test configuration with Chromium/Firefox/WebKit projects and Vite webServer
- `cli.config.json` — CLI configuration for browser, launch options, and viewport
- `test-spec.ts` — Test specification template with form, canvas, and visual snapshot examples
- `page-interaction.ts` — Standalone automation script template with element, canvas, and mouse interaction examples

### Modified

None

### Removed

None

## Additional Changes

None — implementation followed the plan exactly.

## Release Summary

New `playwright-automation` skill provides complete Playwright browser automation capabilities equivalent to the `playwright-features.instructions.md` file. All operations are scriptable via PowerShell with CmdletBinding, comment-based help, and typed parameters. Detailed reference documentation supports progressive loading: SKILL.md provides the overview (<500 lines), references/ provides depth, and assets/ provides ready-to-use templates.
