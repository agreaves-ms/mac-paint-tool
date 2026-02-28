<!-- markdownlint-disable-file -->

# Implementation Plan: Playwright Skill Fixes

## Overview and Objectives

### User Requirements

- Review and test the playwright-automation skill on the mac-paint-tool app
- Fix any broken scripts, incorrect instructions, and documentation errors

### Derived Objectives

1. Fix `Start-DevServer.ps1` so the Vite server survives script exit
2. Fix incorrect directory reference in PITFALLS.md
3. Fix incorrect parameter name in SKILL.md
4. Verify all fixes with end-to-end testing

## Context Summary

- Skill root: `.github/skills/playwright-automation/`
- Research: `.copilot-tracking/research/2026-02-27/playwright-skill-review-research.md`

## Implementation Checklist

### Phase 1: Fix Start-DevServer.ps1 <!-- parallelizable: false -->

- [ ] Replace `Start-Process` approach with foreground `& npx vite ...` execution
- [ ] Keep the `Wait-ForUrl` readiness check as a pre-run check (use lsof or curl to verify port is free first, then start foreground)
- [ ] Restructure main execution to run Vite as the foreground process so the script stays alive and can be backgrounded by the agent's terminal

### Phase 2: Fix documentation references <!-- parallelizable: true -->

- [ ] PITFALLS.md: Change `.playwright-mcp/` to `.playwright-cli/` in the download directory reference
- [ ] SKILL.md: Change `-Profile` to `-ProfilePath` in the Start-Browser parameter table

### Phase 3: End-to-end retest <!-- parallelizable: false -->

- [ ] Run `Start-DevServer.ps1` in background terminal, verify server persists
- [ ] Run `Start-Browser.ps1`, `Invoke-BrowserAction.ps1 -Action snapshot`, `Take-Screenshot.ps1`, `Stop-Browser.ps1`
- [ ] Clean up (stop server, close browsers, remove test artifacts)

## Dependencies

- PowerShell 7+ (`pwsh`)
- `playwright-cli` globally installed
- Node.js/npm/npx

## Success Criteria

1. `Start-DevServer.ps1` run in background terminal keeps port 5174 responding after 10+ seconds
2. Documentation references match actual CLI behavior
3. Full workflow (install → start server → open browser → snapshot → screenshot → close) completes without errors
