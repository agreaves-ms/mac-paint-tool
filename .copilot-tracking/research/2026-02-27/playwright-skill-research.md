<!-- markdownlint-disable-file -->

# Playwright Automation Skill Research

## Scope

Create a VS Code Agent Skill (SKILL.md + scripts/ + references/ + assets/) that provides Playwright browser automation capabilities equivalent to the existing `playwright-features.instructions.md` file, using PowerShell for all executable scripts.

## Assumptions

- Target location: `.github/skills/playwright-automation/`
- PowerShell only (no bash scripts) per user requirement
- All parameterized operations become PowerShell scripts in `scripts/`
- Detailed reference documentation goes in `references/`
- Template files for agent-generated code go in `assets/templates/`
- Follows hve-core SKILL.md conventions (pr-reference as canonical example)

## Success Criteria

1. SKILL.md under 500 lines with keyword-rich description for discovery
2. PowerShell scripts with CmdletBinding, comment-based help, OutputType, shared module
3. References covering full feature reference, CLI commands, API mapping, pitfalls
4. Assets with template files agents generate (playwright.config.ts, test spec template, cli config)
5. All parameters documented in SKILL.md Parameters Reference table
6. Script Reference section with usage examples for each script
7. Project-specific context (mac-paint-tool Vite server, port 5174) preserved

## Source Material Analysis

The `playwright-features.instructions.md` contains 18 feature categories plus custom agent integration, configuration, mapping table, and pitfalls. Key capabilities to preserve:

### Scriptable Operations (→ PowerShell scripts)

1. **Install-Playwright** - Install CLI (`npm install -g @playwright/cli@latest`) and browsers (`npx playwright install`)
2. **Start-DevServer** - Start standalone Vite dev server for testing (`npx vite --config vite.renderer.config.ts --port 5174`)
3. **Start-Browser** - Open browser session via CLI with options (URL, headed, session name, persistent)
4. **Stop-Browser** - Close browser sessions (named, all, force kill)
5. **Take-Screenshot** - Screenshot via CLI with element ref and filename options
6. **Invoke-BrowserAction** - Execute CLI actions (click, fill, type, select, hover, drag, etc.)
7. **Run-Tests** - Execute Playwright Test runner with options (file, headed, debug, report)

### Reference Documentation (→ references/)

1. **REFERENCE.md** - Complete feature reference covering all 18 categories with CLI + API examples
2. **CLI-COMMANDS.md** - Quick reference of all CLI commands grouped by category
3. **API-MAPPING.md** - MCP Tool → CLI Command → Playwright API mapping table
4. **PITFALLS.md** - CLI pitfalls, API pitfalls, project-specific pitfalls

### Template Files (→ assets/templates/)

1. **playwright.config.ts** - Playwright Test configuration template
2. **cli.config.json** - CLI configuration template
3. **test-spec.ts** - Test specification template
4. **page-interaction.ts** - Page interaction script template

## Selected Approach

Follow the pr-reference skill pattern:
- SKILL.md as the main entry point with overview, prerequisites, quick start, parameters, script reference, troubleshooting
- `shared.psm1` module for common utilities (platform detection, npm/npx resolution, process management)
- Individual .ps1 scripts for each operation with full CmdletBinding and comment-based help
- REFERENCE.md with the detailed feature documentation (moved from instructions body)
- Template files that agents can copy and customize when generating code

## Alternatives Considered

1. **Single monolithic SKILL.md** - Rejected: would exceed 500-line limit and violate progressive loading
2. **Bash + PowerShell paired scripts** - Rejected: user explicitly requested PowerShell only
3. **Split into multiple skills** - Rejected: the instructions file is a cohesive unit; one skill is appropriate
