<!-- markdownlint-disable-file -->

# Playwright Automation Skill - Implementation Plan

## Overview

Create a VS Code Agent Skill at `.github/skills/playwright-automation/` that provides complete Playwright browser automation capabilities, replacing the `playwright-features.instructions.md` file. Uses PowerShell for all executable scripts.

### User Requirements

- Source: User request to create a Skill equivalent to `playwright-features.instructions.md`
- PowerShell for all scripts
- Scripts with parameters in `scripts/` directory
- Detailed parameter documentation
- Reference files and code templates in correct skill subdirectories

### Derived Objectives

- Follow hve-core SKILL.md conventions (pr-reference as canonical pattern)
- Progressive disclosure: SKILL.md < 500 lines, detailed content in references/
- PowerShell scripts with CmdletBinding, comment-based help, OutputType, shared module
- Template files in assets/templates/ for agent-generated code

## Context Summary

- `.github/instructions/playwright-features.instructions.md` - Source material (900+ lines)
- `.github/copilot-instructions.md` - Project conventions (Electron, Vite, port 5174)
- hve-core `prompt-builder.instructions.md` - SKILL.md authoring standards
- hve-core `pr-reference` skill - Canonical example with scripts/, references/

## Implementation Checklist

### Phase 1: Core SKILL.md and Shared Module <!-- parallelizable: false -->

- [ ] Create `.github/skills/playwright-automation/SKILL.md` with frontmatter, overview, prerequisites, quick start, parameters, script reference, troubleshooting
- [ ] Create `.github/skills/playwright-automation/scripts/shared.psm1` with common utilities

### Phase 2: PowerShell Scripts <!-- parallelizable: true -->

- [ ] Create `scripts/Install-Playwright.ps1` - Install CLI and browsers
- [ ] Create `scripts/Start-DevServer.ps1` - Start standalone Vite server
- [ ] Create `scripts/Start-Browser.ps1` - Open browser session via CLI
- [ ] Create `scripts/Stop-Browser.ps1` - Close browser sessions
- [ ] Create `scripts/Invoke-BrowserAction.ps1` - Execute CLI actions
- [ ] Create `scripts/Take-Screenshot.ps1` - Take screenshots via CLI
- [ ] Create `scripts/Run-Tests.ps1` - Execute Playwright Test runner

### Phase 3: Reference Documentation <!-- parallelizable: true -->

- [ ] Create `references/REFERENCE.md` - Complete feature reference (all 18 categories)
- [ ] Create `references/CLI-COMMANDS.md` - Quick CLI command reference
- [ ] Create `references/API-MAPPING.md` - MCP → CLI → API mapping table
- [ ] Create `references/PITFALLS.md` - Pitfalls and best practices

### Phase 4: Asset Templates <!-- parallelizable: true -->

- [ ] Create `assets/templates/playwright.config.ts` - Test configuration template
- [ ] Create `assets/templates/cli.config.json` - CLI configuration template
- [ ] Create `assets/templates/test-spec.ts` - Test specification template
- [ ] Create `assets/templates/page-interaction.ts` - Page interaction template

## Planning Log

Path: `.copilot-tracking/plans/logs/2026-02-27/playwright-skill-log.md`

## Dependencies

- Skill: None (new skill creation)
- Instructions: `prompt-builder.instructions.md` for SKILL.md conventions
- Reference: `pr-reference` skill for pattern guidance

## Success Criteria

1. SKILL.md validates against prompt-builder.instructions.md conventions
2. All PowerShell scripts execute successfully with `-WhatIf` support where applicable
3. Parameters documented in both SKILL.md tables and script comment-based help
4. Reference files cover all 18 Playwright feature categories from source material
5. Template files are complete and usable for agent code generation
6. Skill description enables discovery for browser automation tasks
