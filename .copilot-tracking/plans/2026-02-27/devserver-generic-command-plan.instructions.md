<!-- markdownlint-disable-file -->

# Plan: Remove Vite-specific Commands from Playwright Skill

## Overview

Make the dev server start command configurable by replacing Vite-specific hardcoded commands with a `-Command` parameter. The skill should work with any dev server (npm scripts, Vite, webpack-dev-server, etc.).

## Objectives

1. Replace `-Config` (Vite-specific) with `-Command` (generic) in Start-DevServer.ps1
2. Remove all Vite references from SKILL.md, Start-DevServer.ps1, and Stop-DevServer.ps1
3. Rename state files from `.vite-server.*` to `.dev-server.*` for consistency

## Implementation Checklist

### Phase 1: Start-DevServer.ps1 <!-- parallelizable: false -->

- [x] Replace `-Config` parameter with `-Command` (mandatory string, e.g., `"npm run dev"`)
- [x] Update synopsis/description to be generic (not Vite-specific)
- [x] Replace hardcoded `npx vite --config ... --port ...` with user-provided command
- [x] Rename `.vite-server.log` → `.dev-server.log`
- [x] Rename `.vite-server.pid` → `.dev-server.pid`
- [x] Update examples in comment-based help

### Phase 2: Stop-DevServer.ps1 <!-- parallelizable: true -->

- [x] Update synopsis/description to be generic
- [x] Rename `.vite-server.pid` → `.dev-server.pid`
- [x] Rename `.vite-server.log` → `.dev-server.log`

### Phase 3: SKILL.md <!-- parallelizable: false -->

- [x] Remove Vite references from Start-DevServer parameter table (replace Config with Command)
- [x] Update all dev server examples to use `-Command` parameter
- [x] Update Quick Start section
- [x] Update workflow pattern section
- [x] Remove "standalone Vite mode" language
- [x] Keep port 5174 recommendation (still useful to avoid Electron Forge conflicts)

### Phase 4: .gitignore <!-- parallelizable: true -->

- [x] Rename `.vite-server.log` → `.dev-server.log` in .gitignore
- [x] Rename `.vite-server.pid` → `.dev-server.pid` in .gitignore

## Success Criteria

- No mention of "Vite" or "vite" in Start-DevServer.ps1
- No mention of "Vite" or "vite" in Stop-DevServer.ps1
- SKILL.md references Vite only as one possible example command, not as the default
- `-Command` parameter accepts arbitrary shell commands
- Port-based readiness checking still works
- Stop-DevServer still works via PID file and port fallback
