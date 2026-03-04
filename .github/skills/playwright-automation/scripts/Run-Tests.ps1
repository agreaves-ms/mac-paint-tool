# PowerShell 5.1+ compatible — no #Requires -Version 7.0

<#
.SYNOPSIS
Runs Playwright tests using the @playwright/test runner.

.DESCRIPTION
Executes Playwright tests with configurable options for test file selection,
browser visibility, debug mode, test filtering, project selection, worker
count, and HTML report display.

.PARAMETER TestFile
Path to a specific test file to run.

.PARAMETER Headed
Run tests with visible browser windows.

.PARAMETER Debug
Run tests in debug mode with Playwright Inspector.

.PARAMETER ShowReport
Open the HTML test report after tests complete.

.PARAMETER Grep
Filter tests by title pattern.

.PARAMETER Project
Run tests for a specific browser project.

.PARAMETER Workers
Number of parallel worker processes for test execution.

.EXAMPLE
./Run-Tests.ps1

.EXAMPLE
./Run-Tests.ps1 -TestFile "tests/my.spec.ts" -Headed

.EXAMPLE
./Run-Tests.ps1 -Grep "navigation" -Project chromium
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
