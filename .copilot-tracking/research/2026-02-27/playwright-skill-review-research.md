<!-- markdownlint-disable-file -->

# Playwright Automation Skill Review — Research

## Scope

Review and validate the `.github/skills/playwright-automation/` skill by exercising all scripts on the mac-paint-tool app. Fix any bugs, incorrect instructions, or broken workflows.

## Assumptions

- PowerShell 7+ (`pwsh`) is available
- `playwright-cli` is globally installed
- Node.js / npm / npx are available
- The mac-paint-tool Vite renderer can serve standalone on port 5174

## Success Criteria

1. All scripts execute without errors for the happy path
2. SKILL.md instructions are accurate and reproducible
3. Reference docs match actual CLI behavior
4. Templates are correct and usable

## Evidence Log

### Test Results

| Script | Status | Notes |
|--------|--------|-------|
| `Install-Playwright.ps1` | ✅ Pass | Installs CLI, browsers, and initializes workspace |
| `Start-DevServer.ps1` | ❌ Fail | `Start-Process -NoNewWindow` child process dies after script exits. Server starts during script but doesn't survive. |
| `Start-Browser.ps1` | ✅ Pass | Opens headed browser, navigates to URL, viewport resize works |
| `Invoke-BrowserAction.ps1 -Action snapshot` | ✅ Pass | Returns YAML with element refs |
| `Invoke-BrowserAction.ps1 -Action click` | ✅ Pass | Clicks specified element ref |
| `Invoke-BrowserAction.ps1 -Action eval` | ✅ Pass | Evaluates JS and returns result |
| `Take-Screenshot.ps1` | ✅ Pass | Saves PNG screenshot to disk |
| `Stop-Browser.ps1 -Session` | ✅ Pass | Closes named session |
| `Stop-Browser.ps1 -Force` | ⚠️ Untested in isolation | Need to verify kill-all path works |
| `Run-Tests.ps1` | ⚠️ Untested | No Playwright TypeScript tests in this project |

### Issues Found

#### Issue 1: Start-DevServer.ps1 — Process dies after script exits (Critical)

The script uses `Start-Process -NoNewWindow -PassThru` which spawns npx/vite as a child process. On macOS/Linux, when the pwsh script exits (after `exit 0`), the spawned process may also terminate. The `Wait-ForUrl` check passes during script execution (because the child is alive while pwsh runs), but the server becomes unreachable after the script completes.

**Root cause**: `Start-Process` in PowerShell on Unix is not a reliable way to background a long-running process. The child's stdout/stderr are attached to the parent's terminal, and process group behavior may terminate children when the parent exits.

**Fix**: Replace `Start-Process` with a foreground approach where the script stays alive and keeps Vite running. Since agents use background terminal mode, the script should run Vite as a foreground process (via `& npx vite ...`), not spawn-and-detach.

#### Issue 2: SKILL.md path references are relative to skill directory (Minor)

The Quick Start and Script Reference sections show paths like `./scripts/Install-Playwright.ps1`. An agent running from the repo root would need `.github/skills/playwright-automation/scripts/Install-Playwright.ps1`. However, this is standard for skill files — the agent is expected to locate the skill directory first.

**Decision**: No change needed. The `./` paths are conventional for skill documentation.

#### Issue 3: PITFALLS.md references `.playwright-mcp/` directory (Minor)

The pitfalls doc says "Downloaded files land in `.playwright-mcp/` directory" but `playwright-cli` actually uses `.playwright-cli/` for its output files (snapshots, console logs, etc.).

**Fix**: Update the reference from `.playwright-mcp/` to `.playwright-cli/`.

#### Issue 4: SKILL.md Parameter table — `-Profile` flag vs script parameter name (Minor)

The SKILL.md shows parameter flag `-Profile` for Start-Browser but the actual script parameter is `-ProfilePath`. This mismatch could confuse agents.

**Fix**: Update the SKILL.md parameter table to show `-ProfilePath`.

#### Issue 5: Start-DevServer.ps1 Wait parameter documentation (Minor)

The parameter table shows Default as `$true` but the actual script default is the string `'true'`. The `ConvertTo-Boolean` helper handles conversion but it's inconsistent with how other boolean params work (using `[switch]`).

**Decision**: Keep as-is. The string-based approach handles mixed shell invocation correctly, and the documentation functionally matches the behavior.

## Selected Approach

1. Fix `Start-DevServer.ps1` to run Vite as a foreground process instead of using `Start-Process`
2. Fix `.playwright-mcp/` → `.playwright-cli/` in PITFALLS.md
3. Fix `-Profile` → `-ProfilePath` in SKILL.md parameter table
4. Verify all fixes work end-to-end

## Next Steps

- Create implementation plan
- Fix Start-DevServer.ps1
- Fix documentation references
- End-to-end retest
