# PowerShell 5.1+ compatible — no #Requires -Version 7.0

<#
.SYNOPSIS
Opens a Playwright browser session via the CLI using Chrome by default.

.DESCRIPTION
Launches a browser using playwright-cli with configurable options for
URL navigation, headed mode, named sessions, persistent profiles,
browser type, and viewport size. Defaults to Chrome.

.PARAMETER Url
URL to navigate to after opening the browser.

.PARAMETER Headed
Open the browser in headed (visible) mode.

.PARAMETER Session
Named session for browser isolation.

.PARAMETER Persistent
Use a persistent browser profile that survives browser restarts.

.PARAMETER ProfilePath
Path to a specific browser profile directory.

.PARAMETER BrowserType
Browser channel/engine to use. Defaults to chrome.
Valid: chrome, msedge, chromium, firefox, webkit.

.PARAMETER ViewportSize
Viewport dimensions as WIDTHxHEIGHT string. Defaults to 1280x720.

.EXAMPLE
./Start-Browser.ps1 -Url "http://localhost:5174" -Headed
Opens a visible Chrome browser and navigates to the URL.

.EXAMPLE
./Start-Browser.ps1 -Url "http://localhost:5174" -Session "testing" -Headed
Opens a named session for isolated testing.

.EXAMPLE
./Start-Browser.ps1 -BrowserType chrome -ViewportSize "1400x1100"
Opens Chrome with a larger viewport.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Url,

    [Parameter()]
    [switch]$Headed,

    [Parameter()]
    [string]$Session,

    [Parameter()]
    [switch]$Persistent,

    [Parameter()]
    [string]$ProfilePath,

    [Parameter()]
    [ValidateSet('chrome', 'msedge', 'chromium', 'firefox', 'webkit')]
    [string]$BrowserType = 'chrome',

    [Parameter()]
    [ValidatePattern('^\d+x\d+$')]
    [string]$ViewportSize = '1280x720'
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Open-PlaywrightBrowser {
    [OutputType([string])]
    param(
        [string]$Url,
        [switch]$Headed,
        [string]$Session,
        [switch]$Persistent,
        [string]$ProfilePath,
        [string]$BrowserType,
        [string]$ViewportSize
    )

    $cliArgs = @('open', "--browser=$BrowserType")

    if ($Url) {
        $cliArgs += $Url
    }

    if ($Headed) {
        $cliArgs += '--headed'
    }

    if ($Persistent) {
        $cliArgs += '--persistent'
    }

    if ($ProfilePath) {
        $cliArgs += "--profile=$ProfilePath"
    }

    $output = Invoke-PlaywrightCli -Arguments $cliArgs -Session $Session

    # playwright-cli uses a separate resize command for viewport changes.
    if ($ViewportSize) {
        $size = $ViewportSize -split 'x'
        if ($size.Count -eq 2) {
            $null = Invoke-PlaywrightCli -Arguments @('resize', $size[0], $size[1]) -Session $Session
        }
    }

    return $output
}

function Get-BrowserFallbackOrder {
    [OutputType([string[]])]
    param(
        [string]$PrimaryBrowser
    )

    $preferredOrder = @('chrome', 'msedge', 'chromium', 'firefox', 'webkit')
    $ordered = @($PrimaryBrowser)

    foreach ($candidate in $preferredOrder) {
        if ($candidate -ne $PrimaryBrowser) {
            $ordered += $candidate
        }
    }

    return $ordered
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $attemptOrder = Get-BrowserFallbackOrder -PrimaryBrowser $BrowserType
        $installAttempted = $false
        $lastError = $null

        foreach ($candidateBrowser in $attemptOrder) {
            try {
                Write-SkillOutput -Title 'Browser' -Message "Opening $candidateBrowser browser..."

                $result = Open-PlaywrightBrowser `
                    -Url $Url `
                    -Headed:$Headed `
                    -Session $Session `
                    -Persistent:$Persistent `
                    -ProfilePath $ProfilePath `
                    -BrowserType $candidateBrowser `
                    -ViewportSize $ViewportSize

                if ($result) {
                    Write-Host $result
                }

                Write-SkillOutput -Title 'Browser' -Message "Browser session opened using $candidateBrowser."
                if ($Session) {
                    Write-Host "Session: $Session"
                }

                exit 0
            }
            catch {
                $lastError = $_.Exception.Message
                Write-Warning "Failed to open ${candidateBrowser}: $lastError"

                if (-not $installAttempted -and $lastError -match 'not installed|browser .* is not installed') {
                    Write-Warning 'Browser channel may not be initialized. Running playwright-cli install once...'
                    try {
                        $null = Invoke-PlaywrightCli -Arguments @('install')
                    }
                    catch {
                        Write-Warning "Workspace init failed: $($_.Exception.Message). Continuing fallback attempts..."
                    }
                    $installAttempted = $true
                }
            }
        }

        Write-Error -ErrorAction Continue "Start-Browser failed after trying browsers in order: $($attemptOrder -join ', '). Last error: $lastError"
        exit 1
    }
    catch {
        Write-Error -ErrorAction Continue "Start-Browser failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
