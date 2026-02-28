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
Browser engine to use: chromium, firefox, webkit, or msedge.
Defaults to chromium.

.PARAMETER ViewportSize
Viewport dimensions as WIDTHxHEIGHT string. Defaults to 1280x720.

.EXAMPLE
./Start-Browser.ps1 -Url "http://localhost:5174" -Headed
Opens a visible Chromium browser and navigates to the URL.

.EXAMPLE
./Start-Browser.ps1 -Url "http://localhost:5174" -Session "testing" -Headed
Opens a named session for isolated testing.

.EXAMPLE
./Start-Browser.ps1 -BrowserType firefox -ViewportSize "1400x1100"
Opens Firefox with a larger viewport.
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
    [ValidateSet('chromium', 'firefox', 'webkit', 'msedge')]
    [string]$BrowserType = 'chromium',

    [Parameter()]
    [ValidatePattern('^\d+x\d+$')]
    [string]$ViewportSize = '1280x720'
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

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
        [string]$ViewportSize
    )

    $cliArgs = @('open')

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

    # Set environment variables for browser and viewport
    $env:PLAYWRIGHT_MCP_BROWSER = $BrowserType
    $env:PLAYWRIGHT_MCP_VIEWPORT_SIZE = $ViewportSize

    $output = Invoke-PlaywrightCli -Arguments $cliArgs -Session $Session

    return $output
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        Write-SkillOutput -Title 'Browser' -Message "Opening $BrowserType browser..."

        $result = Open-PlaywrightBrowser `
            -Url $Url `
            -Headed:$Headed `
            -Session $Session `
            -Persistent:$Persistent `
            -ProfilePath $ProfilePath `
            -BrowserType $BrowserType `
            -ViewportSize $ViewportSize

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
        Write-Error -ErrorAction Continue "Start-Browser failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
