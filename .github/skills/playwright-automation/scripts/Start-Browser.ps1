# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

<#
.SYNOPSIS
Opens a Playwright browser session via the CLI.

.DESCRIPTION
Launches a browser using playwright-cli with configurable options for
URL navigation, headed mode, named sessions, persistent profiles,
browser type, and viewport size.

When no explicit -BrowserType is specified, the script attempts msedge
first, then falls back to chrome, then chromium. Use -NoFallback to
disable this behavior and fail immediately if the requested browser
is unavailable.

.PARAMETER Url
URL to navigate to after opening the browser.

.PARAMETER Headed
Open the browser in headed (visible) mode. Must be set at browser
launch time — cannot be changed for subsequent commands.

.PARAMETER Session
Named session for browser isolation. Commands scoped to this session
use -s=<name> internally.

.PARAMETER Persistent
Use a persistent browser profile that survives browser restarts.

.PARAMETER Profile
Path to a specific browser profile directory.

.PARAMETER BrowserType
Browser channel/engine to use: msedge, chrome, firefox, or webkit.
The value `chromium` is accepted as an alias and maps to `chrome` for
compatibility with older skill examples.
Defaults to msedge. When the default is used, automatic fallback to
chrome then chromium is attempted if the preferred browser is unavailable.

.PARAMETER NoFallback
Disable automatic browser fallback. When set, the script fails immediately
if the requested browser is unavailable instead of trying alternatives.

.PARAMETER ViewportSize
Viewport dimensions as WIDTHxHEIGHT string. Defaults to 1280x720.

.EXAMPLE
./Start-Browser.ps1 -Url "http://localhost:5174" -Headed
Opens a visible Edge browser (or Chrome/Chromium fallback) and navigates to the URL.

.EXAMPLE
./Start-Browser.ps1 -Url "http://localhost:5174" -Session "testing" -Headed
Opens a named session for isolated testing.

.EXAMPLE
./Start-Browser.ps1 -BrowserType firefox -ViewportSize "1400x1100"
Opens Firefox with a larger viewport.

.EXAMPLE
./Start-Browser.ps1 -BrowserType chrome -NoFallback
Opens Chrome without fallback — fails if Chrome is not available.
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
    [ValidateSet('chrome', 'chromium', 'firefox', 'webkit', 'msedge')]
    [string]$BrowserType = 'msedge',

    [Parameter()]
    [switch]$NoFallback,

    [Parameter()]
    [ValidatePattern('^\d+x\d+$')]
    [string]$ViewportSize = '1280x720'
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

# Fallback order for Chromium-based browsers when the default is used.
$Script:BrowserFallbackOrder = @('msedge', 'chrome', 'chromium')

function Open-PlaywrightBrowser {
    <#
.SYNOPSIS
Opens a browser session with the specified options.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [string]$Url,
        [switch]$Headed,
        [string]$Session,
        [switch]$Persistent,
        [string]$ProfilePath,
        [string]$BrowserType,
        [string]$ViewportSize,
        [switch]$NoFallback,
        [bool]$UserExplicitBrowser
    )

    $resolvedBrowser = switch ($BrowserType) {
        'chromium' { 'chrome' }
        default { $BrowserType }
    }

    $cliArgs = @('open', "--browser=$resolvedBrowser")

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

    # Determine whether fallback is available.
    # Fallback only applies to Chromium-family browsers when the user did not
    # explicitly choose a browser and -NoFallback is not set.
    $canFallback = (-not $NoFallback) -and (-not $UserExplicitBrowser) -and
        ($resolvedBrowser -in $Script:BrowserFallbackOrder)

    if ($canFallback) {
        # Try each browser in the fallback order starting from the current one.
        $startIndex = [Math]::Max(0, [Array]::IndexOf($Script:BrowserFallbackOrder, $resolvedBrowser))
        $lastError = $null

        for ($i = $startIndex; $i -lt $Script:BrowserFallbackOrder.Count; $i++) {
            $candidate = $Script:BrowserFallbackOrder[$i]
            $cliArgs[1] = "--browser=$candidate"

            try {
                $output = Invoke-PlaywrightCli -Arguments $cliArgs -Session $Session

                if ($candidate -ne $resolvedBrowser) {
                    Write-SkillOutput -Title 'Browser' -Message "Fell back from $resolvedBrowser to $candidate."
                }

                # Resize viewport after successful launch.
                if ($ViewportSize) {
                    $size = $ViewportSize -split 'x'
                    if ($size.Count -eq 2) {
                        $null = Invoke-PlaywrightCli -Arguments @('resize', $size[0], $size[1]) -Session $Session
                    }
                }

                return $output
            }
            catch {
                $lastError = $_
                Write-Warning "Browser '$candidate' unavailable: $($_.Exception.Message)"
            }
        }

        throw "All browsers in fallback chain ($($Script:BrowserFallbackOrder -join ' -> ')) failed. Last error: $($lastError.Exception.Message)"
    }

    # No fallback — launch directly.
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

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $userExplicit = $PSBoundParameters.ContainsKey('BrowserType')
        Write-SkillOutput -Title 'Browser' -Message "Opening $BrowserType browser..."

        $result = Open-PlaywrightBrowser `
            -Url $Url `
            -Headed:$Headed `
            -Session $Session `
            -Persistent:$Persistent `
            -ProfilePath $ProfilePath `
            -BrowserType $BrowserType `
            -ViewportSize $ViewportSize `
            -NoFallback:$NoFallback `
            -UserExplicitBrowser $userExplicit

        if ($result) {
            Write-Host $result
        }

        Write-SkillOutput -Title 'Browser' -Message "Browser session opened."
        if ($Session) {
            Write-Host "Session: $Session"
        }

        exit 0
    }
    catch {
        $errorText = $_.Exception.Message

        # First-run environments may need playwright-cli workspace initialization
        # so the CLI can discover installed browser channels like Chrome/Edge.
        if ($errorText -match 'not installed|browser .* is not installed') {
            Write-Warning "Browser channel not ready. Running playwright-cli install and retrying once..."
            $null = Invoke-PlaywrightCli -Arguments @('install') -Session $Session

            try {
                $retryResult = Open-PlaywrightBrowser `
                    -Url $Url `
                    -Headed:$Headed `
                    -Session $Session `
                    -Persistent:$Persistent `
                    -ProfilePath $ProfilePath `
                    -BrowserType $BrowserType `
                    -ViewportSize $ViewportSize `
                    -NoFallback:$NoFallback `
                    -UserExplicitBrowser $userExplicit

                if ($retryResult) {
                    Write-Host $retryResult
                }

                Write-SkillOutput -Title 'Browser' -Message 'Browser session opened after initialization.'
                if ($Session) {
                    Write-Host "Session: $Session"
                }
                exit 0
            }
            catch {
                Write-Error -ErrorAction Continue "Start-Browser retry failed: $($_.Exception.Message)"
                exit 1
            }
        }

        Write-Error -ErrorAction Continue "Start-Browser failed: $errorText"
        exit 1
    }
}
#endregion
