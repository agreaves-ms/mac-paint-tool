# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

<#
.SYNOPSIS
Runs Playwright tests using the @playwright/test runner.

.DESCRIPTION
Executes Playwright tests with configurable options for test file selection,
browser visibility, debug mode, test filtering, project selection, worker
count, and HTML report display.

.PARAMETER TestFile
Path to a specific test file to run. When omitted, runs all tests.

.PARAMETER Headed
Run tests with visible browser windows.

.PARAMETER Debug
Run tests in debug mode with Playwright Inspector.

.PARAMETER ShowReport
Open the HTML test report after tests complete. When used alone
(without other flags), shows the report from the last test run.

.PARAMETER Grep
Filter tests by title pattern. Only tests matching this pattern run.

.PARAMETER Project
Run tests for a specific browser project defined in playwright.config.ts.
Common values: chromium, firefox, webkit.

.PARAMETER Workers
Number of parallel worker processes for test execution.

.EXAMPLE
./Run-Tests.ps1
Runs all Playwright tests.

.EXAMPLE
./Run-Tests.ps1 -TestFile "tests/my.spec.ts" -Headed
Runs a specific test file with visible browser.

.EXAMPLE
./Run-Tests.ps1 -Debug
Runs tests in debug mode with Playwright Inspector.

.EXAMPLE
./Run-Tests.ps1 -Grep "navigation" -Project chromium
Runs tests matching "navigation" in Chromium only.

.EXAMPLE
./Run-Tests.ps1 -ShowReport
Opens the HTML report from the last test run.

.EXAMPLE
./Run-Tests.ps1 -Workers 4
Runs all tests with 4 parallel workers.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$TestFile,

    [Parameter()]
    [switch]$Headed,

    [Parameter()]
    [switch]$Debug,

    [Parameter()]
    [switch]$ShowReport,

    [Parameter()]
    [string]$Grep,

    [Parameter()]
    [string]$Project,

    [Parameter()]
    [int]$Workers
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Invoke-PlaywrightTests {
    <#
.SYNOPSIS
Builds and executes the npx playwright test command.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [string]$TestFile,
        [switch]$Headed,
        [switch]$Debug,
        [string]$Grep,
        [string]$Project,
        [int]$Workers
    )

    $testArgs = @('playwright', 'test')

    if ($TestFile) {
        $testArgs += $TestFile
    }

    if ($Headed) {
        $testArgs += '--headed'
    }

    if ($Debug) {
        $testArgs += '--debug'
    }

    if ($Grep) {
        $testArgs += @('--grep', $Grep)
    }

    if ($Project) {
        $testArgs += @('--project', $Project)
    }

    if ($Workers -gt 0) {
        $testArgs += @('--workers', $Workers.ToString())
    }

    if (-not (Test-CommandAvailable 'npx')) {
        throw "npx is required but was not found on PATH. Install Node.js from https://nodejs.org"
    }

    Write-SkillOutput -Title 'Test' -Message "Running: npx $($testArgs -join ' ')"
    $output = & npx @testArgs 2>&1
    $exitCode = $LASTEXITCODE

    $resultText = $output -join [Environment]::NewLine
    Write-Host $resultText

    if ($exitCode -ne 0) {
        Write-Warning "Tests exited with code $exitCode"
    }

    return $resultText
}

function Show-TestReport {
    <#
.SYNOPSIS
Opens the Playwright HTML test report.
.OUTPUTS
System.Void
#>
    [OutputType([void])]
    param()

    if (-not (Test-CommandAvailable 'npx')) {
        throw "npx is required but was not found on PATH."
    }

    Write-SkillOutput -Title 'Test' -Message 'Opening HTML test report...'
    & npx playwright show-report
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        # If ShowReport is the only flag, just show the report
        $reportOnly = $ShowReport -and -not $TestFile -and -not $Headed -and `
            -not $Debug -and -not $Grep -and -not $Project -and $Workers -eq 0

        if ($reportOnly) {
            Show-TestReport
            exit 0
        }

        $null = Invoke-PlaywrightTests `
            -TestFile $TestFile `
            -Headed:$Headed `
            -Debug:$Debug `
            -Grep $Grep `
            -Project $Project `
            -Workers $Workers

        if ($ShowReport) {
            Show-TestReport
        }

        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Run-Tests failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
