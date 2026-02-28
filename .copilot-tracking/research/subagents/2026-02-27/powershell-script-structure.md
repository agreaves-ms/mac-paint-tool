# PowerShell Script Structure Research

## Research Topics

- How PowerShell scripts are structured with CmdletBinding, comment-based help, and parameter blocks
- How shared modules work (`.psm1` files with `Export-ModuleMember`)
- How reference files are structured with YAML frontmatter

## File 1: generate.ps1

**Path:** `/Users/allengreaves/.vscode-insiders/extensions/ise-hve-essentials.hve-core-3.0.2/.github/skills/shared/pr-reference/scripts/generate.ps1`
**Lines:** 502

### Complete Content

```powershell
# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

<#
.SYNOPSIS
Generates the Copilot PR reference XML using git history and diff data.

.DESCRIPTION
Creates a pr-reference.xml file (default: .copilot-tracking/pr/pr-reference.xml)
relative to the repository root, mirroring the behaviour of generate.sh. Supports
excluding markdown files from the diff and specifying an alternate base branch
for comparisons.

.PARAMETER BaseBranch
Git branch used as the comparison base. Defaults to "main".

.PARAMETER ExcludeMarkdownDiff
When supplied, excludes markdown (*.md) files from the diff output.

.PARAMETER OutputPath
Custom output file path. When empty, defaults to
.copilot-tracking/pr/pr-reference.xml relative to the repository root.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$BaseBranch = "main",

    [Parameter()]
    [switch]$ExcludeMarkdownDiff,

    [Parameter()]
    [string]$OutputPath = ""
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Test-GitAvailability {
<#
.SYNOPSIS
Verifies the git executable is available.
.DESCRIPTION
Throws a terminating error when git can't be resolved from PATH.
#>
    [OutputType([void])]
    param()

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is required but was not found on PATH."
    }
}

function New-PrDirectory {
<#
.SYNOPSIS
Creates the parent directory for the output file when missing.
.DESCRIPTION
Ensures the parent directory of the specified path exists.
.PARAMETER OutputFilePath
Absolute path to the output file whose parent directory should be created.
.OUTPUTS
System.String
#>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$OutputFilePath
    )

    $parentDir = Split-Path -Parent $OutputFilePath
    if (-not (Test-Path $parentDir)) {
        if ($PSCmdlet.ShouldProcess($parentDir, 'Create output directory')) {
            $null = New-Item -ItemType Directory -Path $parentDir -Force
        }
    }

    return $parentDir
}

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

    $candidates = @()
    if ($BaseBranch -notlike 'origin/*' -and $BaseBranch -notlike 'refs/*') {
        $candidates += "origin/$BaseBranch"
    }
    $candidates += $BaseBranch

    foreach ($candidate in $candidates) {
        & git rev-parse --verify $candidate *> $null
        if ($LASTEXITCODE -eq 0) {
            $label = if ($candidate -eq $BaseBranch) {
                $BaseBranch
            } else {
                "$BaseBranch (via $candidate)"
            }

            return [PSCustomObject]@{
                Ref   = $candidate
                Label = $label
            }
        }
    }

    throw "Branch '$BaseBranch' does not exist or is not accessible."
}

function Get-ShortCommitHash {
<#
.SYNOPSIS
Retrieves the short commit hash for a ref.
.DESCRIPTION
Uses git rev-parse --short to resolve the supplied ref.
.PARAMETER Ref
Git reference to resolve.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Ref
    )

    $commit = (& git rev-parse --short $Ref).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to resolve ref '$Ref'."
    }

    return $commit
}

function Get-CurrentBranchOrRef {
<#
.SYNOPSIS
Retrieves the current branch name or a fallback reference.
.DESCRIPTION
Returns the current branch name when on a branch. In detached HEAD state
(common in CI environments), falls back to a short commit SHA prefixed with
'detached@'.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param()

    $branchOutput = & git --no-pager branch --show-current 2>$null
    if ($branchOutput) {
        return $branchOutput.Trim()
    }

    # Detached HEAD - fall back to short SHA
    $sha = (& git rev-parse --short HEAD 2>$null)
    if ($LASTEXITCODE -eq 0 -and $sha) {
        return "detached@$($sha.Trim())"
    }

    return 'unknown'
}

function Get-CommitEntry {
<#
.SYNOPSIS
Collects formatted commit metadata.
.DESCRIPTION
Runs git log to gather commit entries relative to the supplied comparison ref.
.PARAMETER ComparisonRef
Git reference that acts as the diff base.
.OUTPUTS
System.String[]
#>
    [OutputType([string[]])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ComparisonRef
    )

    $logArgs = @(
        '--no-pager',
        'log',
        '--pretty=format:<commit hash="%h" date="%cd"><message><subject><![CDATA[%s]]></subject><body><![CDATA[%b]]></body></message></commit>',
        '--date=short',
        "${ComparisonRef}..HEAD"
    )

    $entries = & git @logArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to retrieve commit history."
    }

    return $entries
}

function Get-CommitCount {
<#
.SYNOPSIS
Counts commits between HEAD and the comparison ref.
.DESCRIPTION
Executes git rev-list --count to measure branch divergence.
.PARAMETER ComparisonRef
Git reference that acts as the diff base.
.OUTPUTS
System.Int32
#>
    [OutputType([int])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ComparisonRef
    )

    $countText = (& git --no-pager rev-list --count "${ComparisonRef}..HEAD").Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to count commits."
    }

    if (-not $countText) {
        return 0
    }

    return [int]$countText
}

function Get-DiffOutput {
<#
.SYNOPSIS
Builds the git diff output for the comparison ref.
.DESCRIPTION
Runs git diff against the comparison ref with optional markdown exclusion.
.PARAMETER ComparisonRef
Git reference that acts as the diff base.
.PARAMETER ExcludeMarkdownDiff
Switch to omit markdown files from the diff.
.OUTPUTS
System.String[]
#>
    [OutputType([string[]])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ComparisonRef,

        [Parameter()]
        [switch]$ExcludeMarkdownDiff
    )

    $diffArgs = @('--no-pager', 'diff', $ComparisonRef)
    if ($ExcludeMarkdownDiff) {
        $diffArgs += @('--', ':!*.md')
    }

    $diffOutput = & git @diffArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to retrieve diff output."
    }

    return $diffOutput
}

function Get-DiffSummary {
<#
.SYNOPSIS
Summarizes the diff for quick reporting.
.DESCRIPTION
Uses git diff --shortstat against the comparison ref.
.PARAMETER ComparisonRef
Git reference that acts as the diff base.
.PARAMETER ExcludeMarkdownDiff
Switch to omit markdown files from the summary.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ComparisonRef,

        [Parameter()]
        [switch]$ExcludeMarkdownDiff
    )

    $diffStatArgs = @('--no-pager', 'diff', '--shortstat', $ComparisonRef)
    if ($ExcludeMarkdownDiff) {
        $diffStatArgs += @('--', ':!*.md')
    }

    $summary = & git @diffStatArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to summarize diff output."
    }

    if (-not $summary) {
        return '0 files changed'
    }

    return $summary
}

function Get-PrXmlContent {
<#
.SYNOPSIS
Constructs the PR reference XML document.
.DESCRIPTION
Creates XML containing the current branch, base branch, commits, and diff.
.PARAMETER CurrentBranch
Name of the active git branch.
.PARAMETER BaseBranch
Branch used as the base reference.
.PARAMETER CommitEntries
Formatted commit entries produced by Get-CommitEntry.
.PARAMETER DiffOutput
Diff lines produced by Get-DiffOutput.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$CurrentBranch,

        [Parameter(Mandatory = $true)]
        [string]$BaseBranch,

        [Parameter()]
        [string[]]$CommitEntries,

        [Parameter()]
        [string[]]$DiffOutput
    )

    $commitBlock = if ($CommitEntries) {
        ($CommitEntries | ForEach-Object { "  $_" }) -join [Environment]::NewLine
    } else {
        ""
    }

    $diffBlock = if ($DiffOutput) {
        ($DiffOutput | ForEach-Object { "  $_" }) -join [Environment]::NewLine
    } else {
        ""
    }

    return @"
<commit_history>
  <current_branch>
    $CurrentBranch
  </current_branch>

  <base_branch>
    $BaseBranch
  </base_branch>

  <commits>
$commitBlock
  </commits>

  <full_diff>
$diffBlock
  </full_diff>
</commit_history>
"@
}

function Get-LineImpact {
<#
.SYNOPSIS
Calculates total line impact from a diff summary.
.DESCRIPTION
Parses insertion and deletion counts from git diff --shortstat output.
.PARAMETER DiffSummary
Short diff summary text.
.OUTPUTS
System.Int32
#>
    [OutputType([int])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$DiffSummary
    )

    $lineImpact = 0
    if ($DiffSummary -match '(\d+) insertions') {
        $lineImpact += [int]$matches[1]
    }
    if ($DiffSummary -match '(\d+) deletions') {
        $lineImpact += [int]$matches[1]
    }

    return $lineImpact
}

function Invoke-PrReferenceGeneration {
<#
.SYNOPSIS
Generates the pr-reference.xml file.
.DESCRIPTION
Coordinates git queries, XML creation, and console reporting for Copilot usage.
.PARAMETER BaseBranch
Branch used as the comparison base.
.PARAMETER ExcludeMarkdownDiff
Switch to omit markdown files from the diff and summary.
.PARAMETER OutputPath
Custom output file path. When empty, defaults to
.copilot-tracking/pr/pr-reference.xml relative to the repository root.
.OUTPUTS
System.IO.FileInfo
#>
    [OutputType([System.IO.FileInfo])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseBranch,

        [Parameter()]
        [switch]$ExcludeMarkdownDiff,

        [Parameter()]
        [string]$OutputPath = ""
    )

    Test-GitAvailability

    $repoRoot = Get-RepositoryRoot -Strict

    if ($OutputPath) {
        $prReferencePath = $OutputPath
    } else {
        $prReferencePath = Join-Path $repoRoot '.copilot-tracking/pr/pr-reference.xml'
    }

    $null = New-PrDirectory -OutputFilePath $prReferencePath

    $diffSummary = '0 files changed'
    $commitCount = 0
    $comparisonInfo = $null
    $baseCommit = ''

    Push-Location $repoRoot
    try {
        $currentBranch = Get-CurrentBranchOrRef
        $comparisonInfo = Resolve-ComparisonReference -BaseBranch $BaseBranch
        $baseCommit = Get-ShortCommitHash -Ref $comparisonInfo.Ref
        $commitEntries = Get-CommitEntry -ComparisonRef $comparisonInfo.Ref
        $commitCount = Get-CommitCount -ComparisonRef $comparisonInfo.Ref
        $diffOutput = Get-DiffOutput -ComparisonRef $comparisonInfo.Ref -ExcludeMarkdownDiff:$ExcludeMarkdownDiff
        $diffSummary = Get-DiffSummary -ComparisonRef $comparisonInfo.Ref -ExcludeMarkdownDiff:$ExcludeMarkdownDiff

        $xmlContent = Get-PrXmlContent -CurrentBranch $currentBranch -BaseBranch $BaseBranch -CommitEntries $commitEntries -DiffOutput $diffOutput
        $xmlContent | Set-Content -LiteralPath $prReferencePath
    }
    finally {
        Pop-Location
    }

    $lineCount = (Get-Content -LiteralPath $prReferencePath).Count
    $lineImpact = Get-LineImpact -DiffSummary $diffSummary

    Write-Host "Created $prReferencePath"
    if ($ExcludeMarkdownDiff) {
        Write-Host 'Note: Markdown files were excluded from diff output'
    }
    Write-Host "Lines: $lineCount"
    Write-Host "Base branch: $($comparisonInfo.Label) (@ $baseCommit)"
    Write-Host "Commits compared: $commitCount"
    Write-Host "Diff summary: $diffSummary"

    if ($lineImpact -gt 1000) {
        Write-Host 'Large diff detected. Rebase onto the intended base branch or narrow your changes if this scope is unexpected.'
    }

    return Get-Item -LiteralPath $prReferencePath
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        Invoke-PrReferenceGeneration -BaseBranch $BaseBranch -ExcludeMarkdownDiff:$ExcludeMarkdownDiff -OutputPath $OutputPath | Out-Null
        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Generate PR Reference failed: $($_.Exception.Message)"
        Write-Warning "PR reference generation failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
```

## File 2: shared.psm1

**Path:** `/Users/allengreaves/.vscode-insiders/extensions/ise-hve-essentials.hve-core-3.0.2/.github/skills/shared/pr-reference/scripts/shared.psm1`
**Lines:** 36

### Complete Content

```powershell
# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT

function Get-RepositoryRoot {
<#
.SYNOPSIS
Gets the repository root path.
.DESCRIPTION
Runs git rev-parse --show-toplevel to locate the repository root.
In default mode, falls back to the current directory when git fails.
With -Strict, throws a terminating error instead.
.PARAMETER Strict
When set, throws instead of falling back to the current directory.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [switch]$Strict
    )

    if ($Strict) {
        $repoRoot = (& git rev-parse --show-toplevel).Trim()
        if (-not $repoRoot) {
            throw "Unable to determine repository root."
        }
        return $repoRoot
    }

    $root = & git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0 -and $root) {
        return $root.Trim()
    }
    return $PWD.Path
}

Export-ModuleMember -Function Get-RepositoryRoot
```

## File 3: REFERENCE.md

**Path:** `/Users/allengreaves/.vscode-insiders/extensions/ise-hve-essentials.hve-core-3.0.2/.github/skills/shared/pr-reference/references/REFERENCE.md`
**Lines:** ~180

### Complete Content

```markdown
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

## XML Output Format

The PR reference generator produces an XML document with four top-level elements inside a `<commit_history>` root:

... (full XML example)

### Element Reference

| Element            | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `<current_branch>` | Active git branch name or `detached@<sha>` in CI environments  |
| `<base_branch>`    | Comparison branch provided via `--base-branch` / `-BaseBranch` |
| `<commits>`        | Ordered commit entries with hash, date, subject, and body      |
| `<full_diff>`      | Unified diff output from `git diff`                            |

## Usage Scenarios
## Output Path Variations
## Utility Script Reference
## Semantic Invocation
```

## Key Discoveries

### PowerShell Script Structure (generate.ps1)

1. **License header** — `# Copyright (c) Microsoft Corporation.` + SPDX identifier at top
2. **`#Requires` directive** — `#Requires -Version 7.0` enforces minimum PowerShell version
3. **Script-level comment-based help** — `<# .SYNOPSIS ... .DESCRIPTION ... .PARAMETER ... #>` block before `[CmdletBinding()]`
4. **`[CmdletBinding()]` attribute** — Enables advanced function features (common parameters like `-Verbose`, `-WhatIf`)
5. **`param()` block** — Typed parameters with `[Parameter()]` attributes, defaults, and `[switch]` types
6. **`$ErrorActionPreference = 'Stop'`** — Makes all errors terminating
7. **Module import** — `Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force` for shared functions
8. **Function-level comment-based help** — Each function has `.SYNOPSIS`, `.DESCRIPTION`, `.PARAMETER`, `.OUTPUTS`
9. **`[OutputType()]` attribute** — Declares return type on every function
10. **`SupportsShouldProcess`** — Used on `New-PrDirectory` for `-WhatIf` / `-Confirm` support
11. **`#region` / `#endregion`** — Code folding markers for logical sections
12. **Dot-source guard** — `if ($MyInvocation.InvocationName -ne '.')` prevents execution when dot-sourced
13. **Error handling** — `try/catch` with `Write-Error` + `Write-Warning` + explicit `exit` codes

### Shared Module Structure (shared.psm1)

1. **File extension** — `.psm1` (PowerShell module file)
2. **No `#Requires` directive** — Module doesn't enforce PS version independently
3. **Single function** — `Get-RepositoryRoot` with `-Strict` switch parameter
4. **`Export-ModuleMember`** — Explicitly exports only the public function
5. **Comment-based help** — Same pattern as script functions
6. **`[OutputType()]`** — Return type declaration
7. **Error handling** — `-Strict` mode throws; default mode falls back gracefully

### Reference File Structure (REFERENCE.md)

1. **YAML frontmatter** — Delimited by `---`, contains: `title`, `description`, `author`, `ms.date`, `ms.topic`, `keywords` (array), `estimated_reading_time`
2. **Structured sections** — XML Output Format, Element Reference (table), Usage Scenarios, Output Path Variations (table), Utility Script Reference (tables), Semantic Invocation
3. **Cross-platform examples** — Each scenario shows both bash and PowerShell commands
4. **Tables** — Used for element reference, output path variations, and parameter documentation
5. **Footer attribution** — Copilot/human review credit line with markdownlint disable/enable comments

## Next Research

- No outstanding topics; all three files fully captured and analyzed.
