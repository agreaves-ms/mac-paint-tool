# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

<#
.SYNOPSIS
Closes Playwright browser sessions.

.DESCRIPTION
Closes one or more browser sessions managed by playwright-cli.
Supports closing a specific named session, all sessions, or
force-killing all sessions.

.PARAMETER Session
Close a specific named session.

.PARAMETER All
Close all browser sessions gracefully.

.PARAMETER Force
Force kill all browser sessions immediately.

.EXAMPLE
./Stop-Browser.ps1 -Session "testing"
Closes the named session "testing".

.EXAMPLE
./Stop-Browser.ps1 -All
Closes all browser sessions gracefully.

.EXAMPLE
./Stop-Browser.ps1 -Force
Force kills all browser sessions.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Session,

    [Parameter()]
    [switch]$All,

    [Parameter()]
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Close-PlaywrightSession {
<#
.SYNOPSIS
Closes browser sessions based on the provided parameters.
.OUTPUTS
System.String
#>
    [OutputType([string])]
    param(
        [string]$Session,
        [switch]$All,
        [switch]$Force
    )

    if ($Force) {
        Write-SkillOutput -Title 'Browser' -Message 'Force killing all browser sessions...'
        return Invoke-PlaywrightCli -Arguments @('kill-all')
    }

    if ($All) {
        Write-SkillOutput -Title 'Browser' -Message 'Closing all browser sessions...'
        return Invoke-PlaywrightCli -Arguments @('close-all')
    }

    if ($Session) {
        Write-SkillOutput -Title 'Browser' -Message "Closing session '$Session'..."
        return Invoke-PlaywrightCli -Arguments @('close') -Session $Session
    }

    Write-SkillOutput -Title 'Browser' -Message 'Closing current browser session...'
    return Invoke-PlaywrightCli -Arguments @('close')
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $result = Close-PlaywrightSession -Session $Session -All:$All -Force:$Force

        if ($result) {
            Write-Host $result
        }

        Write-SkillOutput -Title 'Browser' -Message 'Browser session(s) closed.'
        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Stop-Browser failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
