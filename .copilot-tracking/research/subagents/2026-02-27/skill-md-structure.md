# SKILL.md Files and Skill Directory Structure Research

## Research Topics

1. What existing SKILL.md files exist in VS Code extensions directories
2. Directory structure for each skill (scripts/, references/, assets/ subdirectories)
3. Exact content and format of SKILL.md examples
4. How scripts are structured in scripts/ subdirectory (.sh and .ps1)
5. How references/ files are structured
6. How parameters are documented in SKILL.md

## Status: Complete

---

## 1. All SKILL.md Files Found

### HVE Core Extension (`ise-hve-essentials.hve-core-3.0.2`)

- `.github/skills/shared/pr-reference/SKILL.md` — PR reference generation skill

### GitHub Copilot Chat Extension (`github.copilot-chat-0.38.2026022704`)

- `assets/prompts/skills/agent-customization/SKILL.md` — Agent customization workflow skill
- `assets/prompts/skills/project-setup-info-local/SKILL.md` — Project scaffolding (local templates)
- `assets/prompts/skills/project-setup-info-context7/SKILL.md` — Project scaffolding (Context7 API)
- `assets/prompts/skills/install-vscode-extension/SKILL.md` — VS Code extension installation
- `assets/prompts/skills/get-search-view-results/SKILL.md` — Search view results retrieval

### GitHub PR Extension (`github.vscode-pull-request-github-0.129.2026022604`)

- `src/lm/skills/summarize-github-issue-pr-notification/SKILL.md` — Issue/PR/notification summarization
- `src/lm/skills/suggest-fix-issue/SKILL.md` — Issue fix suggestion
- `src/lm/skills/show-github-search-result/SKILL.md` — GitHub search result display
- `src/lm/skills/form-github-search-query/SKILL.md` — GitHub search query formation

### Python Envs Extension (`ms-python.vscode-python-envs-1.21.10561015-darwin-arm64`)

- `.github/skills/debug-failing-test/SKILL.md`
- `.github/skills/python-manager-discovery/SKILL.md`
- `.github/skills/run-e2e-tests/SKILL.md`
- `.github/skills/run-integration-tests/SKILL.md`
- `.github/skills/run-smoke-tests/SKILL.md`
- `.github/skills/settings-precedence/SKILL.md`
- `.github/skills/cross-platform-paths/SKILL.md`
- `.github/skills/run-pre-commit-checks/SKILL.md`
- `.github/skills/generate-snapshot/SKILL.md`

### GitLens Extension (`eamodio.gitlens-2026.2.2704`)

- `.claude/skills/commit/SKILL.md`
- `.claude/skills/add-test/SKILL.md`
- `.claude/skills/create-issue/SKILL.md`
- `.claude/skills/audit-commits/SKILL.md`
- `.claude/skills/investigate/SKILL.md`
- `.claude/skills/add-webview/SKILL.md`
- `.claude/skills/add-ai-provider/SKILL.md`
- `.claude/skills/review/SKILL.md`
- `.claude/skills/analyze/SKILL.md`
- `.claude/skills/add-icon/SKILL.md`
- `.claude/skills/add-command/SKILL.md`

**Total: 31 SKILL.md files discovered**

---

## 2. Directory Structures

### Complex Skill: pr-reference (hve-core) — Full subdirectories

```text
.github/skills/shared/pr-reference/
├── SKILL.md                          # Main skill definition
├── references/
│   └── REFERENCE.md                  # Detailed XML schema, usage scenarios, output path docs
└── scripts/
    ├── generate.ps1                  # PowerShell: generates pr-reference.xml
    ├── generate.sh                   # Bash: generates pr-reference.xml
    ├── list-changed-files.ps1        # PowerShell: extracts changed file paths from XML
    ├── list-changed-files.sh         # Bash: extracts changed file paths from XML
    ├── read-diff.ps1                 # PowerShell: reads diff content with chunking
    ├── read-diff.sh                  # Bash: reads diff content with chunking
    └── shared.psm1                   # PowerShell module with shared utilities
```

### Complex Skill: agent-customization (Copilot Chat) — References only

```text
assets/prompts/skills/agent-customization/
├── SKILL.md                          # Main skill definition (workflow skill)
└── references/
    ├── agents.md                     # Custom agent mode documentation
    ├── hooks.md                      # Hooks documentation
    ├── instructions.md               # Instructions documentation
    ├── prompts.md                    # Prompts documentation
    ├── skills.md                     # Skills documentation (meta!)
    └── workspace-instructions.md     # Workspace instructions documentation
```

### Simple Skills: Single SKILL.md only (no subdirectories)

Most skills consist of just a single SKILL.md file:

```text
# GitLens pattern
.claude/skills/commit/
└── SKILL.md

# Python envs pattern
.github/skills/run-e2e-tests/
└── SKILL.md

# GitHub PR pattern
src/lm/skills/summarize-github-issue-pr-notification/
└── SKILL.md

# Copilot Chat simple pattern
assets/prompts/skills/install-vscode-extension/
└── SKILL.md
```

### Supported Skill Locations (from official docs)

| Path                          | Scope    |
|-------------------------------|----------|
| `.github/skills/<name>/`     | Project  |
| `.agents/skills/<name>/`     | Project  |
| `.claude/skills/<name>/`     | Project  |
| `~/.copilot/skills/<name>/`  | Personal |
| `~/.agents/skills/<name>/`   | Personal |
| `~/.claude/skills/<name>/`   | Personal |

---

## 3. SKILL.md Format and Content Examples

### YAML Frontmatter Reference

```yaml
---
name: skill-name              # Required: 1-64 chars, lowercase alphanumeric + hyphens, must match folder
description: 'What and when to use. Max 1024 chars.'
argument-hint: 'Optional hint shown for slash invocation'
user-invocable: true          # Optional: show as slash command (default: true)
disable-model-invocation: false # Optional: disable automatic model-triggered loading
compatibility: 'Requires git available on PATH'  # Optional: platform requirements
---
```

#### Frontmatter Fields Observed

| Field                       | Required | Default | Description                                               | Seen In                       |
|-----------------------------|----------|---------|-----------------------------------------------------------|-------------------------------|
| `name`                      | Yes      | —       | Skill identifier, must match folder name                  | All                           |
| `description`               | Yes      | —       | Discovery surface — keyword-rich description (max 1024)   | All                           |
| `argument-hint`             | No       | —       | Hint shown for slash command invocation                   | settings-precedence, python-manager-discovery |
| `user-invocable`            | No       | `true`  | Whether to show as slash command                          | settings-precedence, python-manager-discovery |
| `disable-model-invocation`  | No       | `false` | Prevent automatic model-triggered loading                 | Official docs only            |
| `compatibility`             | No       | —       | Platform/runtime requirements                             | pr-reference                  |

### Example 1: Complex skill with scripts (pr-reference)

**Full content** of `.github/skills/shared/pr-reference/SKILL.md`:

```markdown
---
name: pr-reference
description: 'Generates PR reference XML containing commit history and unified diffs between branches. Includes utilities to list changed files and read diff chunks. Use when creating pull request descriptions, preparing code reviews, analyzing branch changes, discovering work items from diffs, or generating structured diff summaries. - Brought to you by microsoft/hve-core'
user-invocable: true
compatibility: 'Requires git available on PATH'
---

# PR Reference Generation Skill

## Overview

Queries git for commit metadata and diff output, then produces a structured XML document. Both bash and PowerShell implementations are provided.

Use cases:

* PR description generation from commit history
* Code review preparation with structured diff context
* Work item discovery by analyzing branch changes
* Security analysis of modified files

After successful generation, include a file link to the absolute path of the XML output in the response.

## Prerequisites

The repository must have at least one commit diverging from the base branch.

| Platform       | Runtime              |
| -------------- | -------------------- |
| macOS / Linux  | Bash (pre-installed) |
| Windows        | PowerShell 7+ (pwsh) |
| Cross-platform | PowerShell 7+ (pwsh) |

## Quick Start

Run the following command to generate a PR reference with default settings (compares against `origin/main`):

    ./scripts/generate.sh       # bash
    ./scripts/generate.ps1      # powershell

Output saves to `.copilot-tracking/pr/pr-reference.xml` by default.

## Parameters Reference

| Parameter        | Flag (bash)     | Flag (PowerShell)      | Default                                    | Description                                 |
| ---------------- | --------------- | ---------------------- | ------------------------------------------ | ------------------------------------------- |
| Base branch      | `--base-branch` | `-BaseBranch`          | `origin/main` (bash) / `main` (PowerShell) | Target branch for comparison                |
| Exclude markdown | `--no-md-diff`  | `-ExcludeMarkdownDiff` | false                                      | Exclude markdown files (*.md) from the diff |
| Output path      | `--output`      | `-OutputPath`          | `.copilot-tracking/pr/pr-reference.xml`    | Custom output file path                     |

Both defaults resolve to the same remote comparison.

## Additional Scripts Reference

### List Changed Files

    ./scripts/list-changed-files.sh                    # all changed files
    ./scripts/list-changed-files.sh --type added       # filter by change type
    ./scripts/list-changed-files.sh --format markdown  # output as markdown table

    ./scripts/list-changed-files.ps1                   # all changed files
    ./scripts/list-changed-files.ps1 -Type Added       # filter by change type
    ./scripts/list-changed-files.ps1 -Format Json      # output as JSON

### Read Diff Content

    ./scripts/read-diff.sh --info             # chunk info (count, line ranges)
    ./scripts/read-diff.sh --chunk 1          # read a specific chunk
    ./scripts/read-diff.sh --file src/main.ts  # extract diff for one file
    ./scripts/read-diff.sh --summary          # file stats summary

    ./scripts/read-diff.ps1 -Info              # chunk info
    ./scripts/read-diff.ps1 -Chunk 1           # read a specific chunk
    ./scripts/read-diff.ps1 -File "src/main.ts" # extract diff for one file

## Output Format

The generated XML wraps commit metadata and unified diff output in a `<commit_history>` root element. See the [reference guide](references/REFERENCE.md) for the complete XML schema, element reference, output path variations, and workflow integration patterns.

## Troubleshooting

| Symptom                          | Cause                                | Resolution                                                               |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| "No commits found" or empty XML  | No diverging commits from base branch | Verify the branch has commits ahead of the base with `git log base..HEAD` |
| "Branch not found" error         | Base branch ref missing locally      | Run `git fetch origin` to update remote tracking refs                    |
| "git: command not found"         | git is not on PATH                   | Install git or verify PATH includes the git binary directory             |
```

### Example 2: Workflow skill with references (agent-customization)

**Full content** of `assets/prompts/skills/agent-customization/SKILL.md`:

```markdown
---
name: agent-customization
description: '**WORKFLOW SKILL** — Create, update, review, fix, or debug VS Code agent customization files (.instructions.md, .prompt.md, .agent.md, SKILL.md, copilot-instructions.md, AGENTS.md). USE FOR: saving coding preferences; troubleshooting why instructions/skills/agents are ignored or not invoked; configuring applyTo patterns; defining tool restrictions; creating custom agent modes or specialized workflows; packaging domain knowledge; fixing YAML frontmatter syntax. DO NOT USE FOR: general coding questions (use default agent); runtime debugging or error diagnosis; MCP server configuration (use MCP docs directly); VS Code extension development. INVOKES: file system tools (read/write customization files), ask-questions tool (interview user for requirements), subagents for codebase exploration. FOR SINGLE OPERATIONS: For quick YAML frontmatter fixes or creating a single file from a known pattern, edit the file directly — no skill needed.'
---

# Agent Customization

## Decision Flow

| Primitive | When to Use |
|-----------|-------------|
| Workspace Instructions | Always-on, applies everywhere in the project |
| File Instructions | Explicit via `applyTo` patterns, or on-demand via `description` |
| MCP | Integrates external systems, APIs, or data |
| Hooks | Deterministic shell commands at agent lifecycle points |
| Custom Agents | Subagents for context isolation, or multi-stage workflows with tool restrictions |
| Prompts | Single focused task with parameterized inputs |
| Skills | On-demand workflow with bundled assets (scripts/templates) |

## Quick Reference

| Type | File | Location | Reference |
|------|------|----------|-----------|
| Workspace Instructions | `copilot-instructions.md`, `AGENTS.md` | `.github/` or root | [Link](./references/workspace-instructions.md) |
| File Instructions | `*.instructions.md` | `.github/instructions/` | [Link](./references/instructions.md) |
| Prompts | `*.prompt.md` | `.github/prompts/` | [Link](./references/prompts.md) |
| Hooks | `*.json` | `.github/hooks/` | [Link](./references/hooks.md) |
| Custom Agents | `*.agent.md` | `.github/agents/` | [Link](./references/agents.md) |
| Skills | `SKILL.md` | `.github/skills/<name>/` etc. | [Link](./references/skills.md) |

## Creation Process
[Steps for creating customization files]

## Edge Cases
[When to use this vs. that primitives]

## Common Pitfalls
[Anti-patterns and gotchas]
```

### Example 3: Non-invocable reference skill (settings-precedence)

```markdown
---
name: settings-precedence
description: VS Code settings precedence rules and common pitfalls. Essential for any code that reads or writes settings. Covers getConfiguration scope, inspect() vs get(), and multi-workspace handling.
argument-hint: Review settings handling in [file or component]
user-invocable: false
---

# VS Code Settings Precedence

Settings precedence bugs corrupt user configurations. This skill documents the correct patterns.

## Precedence Order (Highest to Lowest)
1. **Workspace folder value** - Per-folder in multi-root workspace
2. **Workspace value** - `.vscode/settings.json` or `.code-workspace`
3. **User/global value** - User `settings.json`
4. **Default value** - From extension's `package.json`

## Core Rules
### Rule 1: Always Pass Scope to getConfiguration() [code examples]
### Rule 2: Use inspect() to Check Explicit Values [code examples]
### Rule 3: Don't Overwrite User's Explicit Values [code examples]
### Rule 4: Update at the Correct Scope [code examples]
```

### Example 4: GitLens investigation skill (investigate)

```markdown
---
name: investigate
description: Structured investigation of a bug or unexpected behavior before implementing a fix
---

# /investigate - Bug Investigation

Perform structured root cause analysis before implementing any fix.

## Usage
/investigate [symptom description or issue reference]

## Instructions
### 1. Understand the Symptom [clarifying questions]
### 2. Trace the Code Path [code reading strategy]
### 3. Form Hypotheses [evidence gathering]
### 4. Audit Impact [search for call sites]
### 5. Present Findings [structured template]
### 6. Get Confirmation [wait for user before implementing]

## Anti-Patterns [things not to do]
## Decorator Reference [domain-specific knowledge]
```

---

## 4. Script Structure Patterns

### PowerShell Scripts (.ps1)

Key patterns observed in pr-reference scripts:

1. **File header**: Copyright + SPDX license + `#Requires -Version 7.0`
2. **Comment-based help**: `.SYNOPSIS`, `.DESCRIPTION`, `.PARAMETER`, `.EXAMPLE`
3. **CmdletBinding + param block**: Typed parameters with aliases, defaults, and validation
4. **ErrorActionPreference = 'Stop'**: Fail-fast error handling
5. **Import shared module**: `Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force`
6. **Individual functions**: Each with `[OutputType()]`, comment-based help, and `SupportsShouldProcess` where applicable
7. **Main orchestration function**: e.g., `Invoke-PrReferenceGeneration` — coordinates all sub-functions
8. **Main execution guard**: `if ($MyInvocation.InvocationName -ne '.') { ... }` — allows both dot-sourcing and direct execution

Example function structure from `generate.ps1`:

```powershell
function Resolve-ComparisonReference {
<#
.SYNOPSIS
Resolves the git reference used for comparisons.
.DESCRIPTION
Prefers origin/<BaseBranch> when available and falls back to the provided branch.
.PARAMETER BaseBranch
Branch name supplied by the caller.
.OUTPUTS
PSCustomObject
#>
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseBranch
    )
    # ... implementation
}
```

**Shared module pattern** (`shared.psm1`):

- Contains cross-script utility functions (e.g., `Get-RepositoryRoot`)
- Exported via `Export-ModuleMember`
- Imported by all scripts in the same directory

### Bash Scripts (.sh)

Key patterns observed:

1. **Shebang**: `#!/usr/bin/env bash`
2. **Copyright header**: Comment block
3. **Purpose comment**: Brief description of what the script does
4. **`set -euo pipefail`**: Strict mode
5. **`show_usage()` function**: Help text with all options documented
6. **Argument parsing**: `while [[ $# -gt 0 ]]; do case "$1" in ... esac; done`
7. **Validation**: Check for required argument values, file existence
8. **Functional decomposition**: Helper functions for distinct operations (e.g., `extract_files`, `format_output`)
9. **Pipeline-friendly**: Uses `printf`, `cut`, `sort`, `grep` etc.

### Cross-Platform Convention

Every script exists as both `.sh` and `.ps1` with identical parameters and output format. The SKILL.md documents both variants side by side. The agent selects based on detected platform.

---

## 5. References File Structure

### REFERENCE.md (pr-reference/references/)

**YAML frontmatter** in reference files:

```yaml
---
title: PR Reference Skill Reference
description: XML output format, usage scenarios, output path variations, and semantic invocation patterns
author: Microsoft
ms.date: 2026-02-18
ms.topic: reference
keywords:
  - pr-reference
  - xml
  - git
estimated_reading_time: 5
---
```

**Content sections:**

1. **Output format documentation** — XML schema with full example, element reference table
2. **Usage scenarios** — Multiple annotated examples (default, custom branch, exclusions, custom path)
3. **Utility script reference** — Parameter tables for companion scripts
4. **Output path variations** — Table mapping workflows to output paths
5. **Semantic invocation** — How callers should reference the skill (by intent, not path)

### references/ in agent-customization

Each reference file is a standalone documentation page for one primitive:

- `agents.md` — Custom agent mode documentation
- `hooks.md` — Hooks lifecycle documentation
- `instructions.md` — Instructions (.instructions.md) documentation
- `prompts.md` — Prompt files (.prompt.md) documentation
- `skills.md` — Skills (SKILL.md) meta-documentation
- `workspace-instructions.md` — Workspace instructions documentation

Referenced from SKILL.md body via relative links: `[Link](./references/skills.md)`

---

## 6. Parameter Documentation Patterns

### Pattern A: Cross-Platform Parameters Table (pr-reference)

Used for scripts with CLI flags. Documents bash and PowerShell flags side by side:

```markdown
| Parameter        | Flag (bash)     | Flag (PowerShell)      | Default                                    | Description                                 |
|------------------|-----------------|------------------------|--------------------------------------------|---------------------------------------------|
| Base branch      | `--base-branch` | `-BaseBranch`          | `origin/main` (bash) / `main` (PowerShell) | Target branch for comparison                |
| Exclude markdown | `--no-md-diff`  | `-ExcludeMarkdownDiff` | false                                      | Exclude markdown files (*.md) from the diff |
| Output path      | `--output`      | `-OutputPath`          | `.copilot-tracking/pr/pr-reference.xml`    | Custom output file path                     |
```

### Pattern B: Quick Reference Table (run-e2e-tests)

Used for simple "how to run" skills:

```markdown
| Action            | Command                                                        |
|-------------------|----------------------------------------------------------------|
| Run all E2E tests | `npm run compile && npm run compile-tests && npm run e2e-test` |
| Run specific test | `npm run e2e-test -- --grep "discovers"`                       |
| Debug in VS Code  | Debug panel → "E2E Tests" → F5                                 |
```

### Pattern C: Platform/Prerequisites Table (pr-reference)

```markdown
| Platform       | Runtime              |
|----------------|----------------------|
| macOS / Linux  | Bash (pre-installed) |
| Windows        | PowerShell 7+ (pwsh) |
| Cross-platform | PowerShell 7+ (pwsh) |
```

### Pattern D: Frontmatter argument-hint (settings-precedence, python-manager-discovery)

For skills invoked via slash commands:

```yaml
argument-hint: 'Review settings handling in [file or component]'
argument-hint: 'manager name (e.g., poetry, conda, pyenv)'
```

### Pattern E: Inline CLI Argument List (project-setup-info-local)

CLI commands documented inline with argument descriptions:

```markdown
Run this command:
    npx create-next-app@latest .

The command has the following arguments:
- `--ts, --typescript`: Initialize as a TypeScript project. This is the default.
- `--tailwind`: Initialize with Tailwind CSS config. This is the default.
```

---

## 7. Progressive Loading Design

Skills use a three-phase loading strategy:

1. **Discovery** (~100 tokens): Agent reads `name` and `description` only
2. **Instructions** (<5000 tokens): Agent loads SKILL.md body when task matches
3. **Resources**: Additional files (references/, scripts/) loaded only when referenced

**Implication**: Keep SKILL.md under 500 lines. Move deep documentation to `references/` files.

### Slash Command Behavior Matrix

| Configuration                     | Slash command | Auto-loaded |
|-----------------------------------|---------------|-------------|
| Default (both omitted)            | Yes           | Yes         |
| `user-invocable: false`           | No            | Yes         |
| `disable-model-invocation: true`  | Yes           | No          |
| Both set                          | No            | No          |

---

## 8. Anti-Patterns (from official docs)

- **Vague descriptions**: "A helpful skill" doesn't enable discovery — include trigger words
- **Monolithic SKILL.md**: Everything in one file instead of using references/
- **Name mismatch**: Folder name doesn't match frontmatter `name` field
- **Missing procedures**: Descriptions without step-by-step guidance
- **Hardcoded script paths in prompts**: Use semantic invocation (describe intent) instead

---

## Key Discoveries

1. **Only 1 SKILL.md exists in hve-core** — the pr-reference skill. No other hve-* extensions (coding-standards, github, project-planning) have SKILL.md files.
2. **The pr-reference skill is the most complete example** — it has scripts/ (both .sh and .ps1), references/ (REFERENCE.md), and a well-structured SKILL.md with parameters table.
3. **GitLens uses `.claude/skills/` path** — different from `.github/skills/` used by others. Both are valid skill locations.
4. **Most skills are simple** — a single SKILL.md with no subdirectories. Only pr-reference and agent-customization have subdirectories.
5. **PowerShell scripts follow strict patterns** — RequiresVersion, CmdletBinding, OutputType on every function, shared module import, `SupportsShouldProcess` for write operations, execution guard for dot-sourcing.
6. **Bash scripts follow strict patterns** — shebang, `set -euo pipefail`, `show_usage()`, while-case argument parsing, functional decomposition, pipeline-friendly output.
7. **Cross-platform pairing** — every .sh script has a matching .ps1 with identical parameters and output format.
8. **`compatibility` frontmatter field** — only seen in pr-reference, documents runtime requirements.
9. **`argument-hint` field** — only seen in Python extension skills, provides slash command input hints.
10. **Description is the primary discovery mechanism** — keyword-rich descriptions with "Use when..." patterns enable agent matching.

---

## Clarifying Questions

None — all research topics have been fully answered through local file inspection.

## Next Research (Not Completed)

- [ ] Read remaining Python extension SKILL.md files (debug-failing-test, generate-snapshot, cross-platform-paths, run-integration-tests, run-smoke-tests, run-pre-commit-checks) for any additional patterns
- [ ] Read remaining GitLens SKILL.md files (add-test, create-issue, audit-commits, add-webview, add-ai-provider, review, analyze, add-icon, add-command) for any additional patterns
- [ ] Read agent-customization's individual reference files (agents.md, hooks.md, instructions.md, prompts.md) for detailed documentation patterns
- [ ] Check if `~/.copilot/skills/` or `~/.agents/skills/` directories exist with user-level skills
