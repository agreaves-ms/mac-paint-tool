# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT

<#
.SYNOPSIS
Shared utilities for Playwright automation skill scripts.

.DESCRIPTION
Provides common functions used across all Playwright automation scripts:
command resolution, process management, and output formatting.
#>

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
        $repoRoot = (& git rev-parse --show-toplevel 2>$null)
        if (-not $repoRoot) {
            throw "Unable to determine repository root."
        }
        return $repoRoot.Trim()
    }

    $root = & git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0 -and $root) {
        return $root.Trim()
    }
    return $PWD.Path
}

function Test-CommandAvailable {
    <#
.SYNOPSIS
Checks whether a command is available on PATH.
.PARAMETER CommandName
Name of the command to check.
.OUTPUTS
System.Boolean
#>
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandName
    )

    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Invoke-NpmCommand {
    <#
.SYNOPSIS
Executes an npm or npx command with error handling.
.PARAMETER Command
The npm/npx subcommand and arguments as a single string.
.PARAMETER UseNpx
Use npx instead of npm.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [switch]$UseNpx
    )

    $executable = if ($UseNpx) { 'npx' } else { 'npm' }

    if (-not (Test-CommandAvailable $executable)) {
        throw "$executable is required but was not found on PATH. Install Node.js from https://nodejs.org"
    }

    $output = & $executable @($Command -split '\s+') 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "$executable $Command failed with exit code $LASTEXITCODE`n$output"
    }

    return ($output -join [Environment]::NewLine)
}

function Invoke-PlaywrightCli {
    <#
.SYNOPSIS
Executes a playwright-cli command with optional session targeting.
.PARAMETER Arguments
Arguments to pass to playwright-cli.
.PARAMETER Session
Optional named session to target.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter()]
        [string]$Session
    )

    if (-not (Test-CommandAvailable 'playwright-cli')) {
        if (Test-CommandAvailable 'npx') {
            $executable = 'npx'
            $allArgs = @('playwright-cli') + $Arguments
        }
        else {
            throw "playwright-cli is not installed. Run Install-Playwright.ps1 first."
        }
    }
    else {
        $executable = 'playwright-cli'
        $allArgs = $Arguments
    }

    if ($Session) {
        $allArgs = @("-s=$Session") + $allArgs
    }

    $output = & $executable @allArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        $errorText = $output -join [Environment]::NewLine
        throw "playwright-cli $($Arguments -join ' ') failed: $errorText"
    }

    return ($output -join [Environment]::NewLine)
}

function Wait-ForUrl {
    <#
.SYNOPSIS
Waits for a URL to become responsive.
.PARAMETER Url
The URL to poll.
.PARAMETER TimeoutSeconds
Maximum seconds to wait.
.PARAMETER IntervalSeconds
Seconds between poll attempts.
.OUTPUTS
System.Boolean
#>
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,

        [Parameter()]
        [int]$TimeoutSeconds = 30,

        [Parameter()]
        [int]$IntervalSeconds = 2
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            $null = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            return $true
        }
        catch {
            Start-Sleep -Seconds $IntervalSeconds
        }
    }

    return $false
}

function Write-SkillOutput {
    <#
.SYNOPSIS
Writes formatted output for skill script results.
.PARAMETER Title
Output section title.
.PARAMETER Message
Output message text.
.PARAMETER IsError
Whether this is an error message.
#>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title,

        [Parameter(Mandatory = $true)]
        [string]$Message,

        [switch]$IsError
    )

    if ($IsError) {
        Write-Error "[$Title] $Message"
    }
    else {
        Write-Host "[$Title] $Message"
    }
}

Export-ModuleMember -Function @(
    'Get-RepositoryRoot',
    'Test-CommandAvailable',
    'Invoke-NpmCommand',
    'Invoke-PlaywrightCli',
    'Wait-ForUrl',
    'Write-SkillOutput'
)
