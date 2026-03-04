# PowerShell 5.1+ compatible — no #Requires -Version 7.0

<#
.SYNOPSIS
Executes browser interaction actions via playwright-cli.

.DESCRIPTION
Performs browser actions such as clicking elements, filling forms, typing text,
selecting options, hovering, dragging, pressing keys, evaluating JavaScript,
navigating, handling dialogs, and taking page snapshots.

Requires element refs from a prior snapshot action. Refs (e1, e2, ...) change
after page navigation or DOM mutations — always re-snapshot before interacting.

.PARAMETER Action
The browser action to perform.

.PARAMETER Ref
Element reference from a snapshot (e.g., e3).

.PARAMETER Value
Value for the action (fill text, type text, key name, expression, URL).

.PARAMETER Target
Target element reference for drag actions.

.PARAMETER Session
Named session to scope the action to.

.PARAMETER Button
Mouse button for click actions: left, right, middle.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action snapshot

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action click -Ref e3

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action fill -Ref e5 -Value "user@example.com"

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action eval -Value "document.title"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        'click', 'dblclick', 'fill', 'type', 'select',
        'hover', 'drag', 'check', 'uncheck',
        'press', 'snapshot', 'eval', 'goto',
        'dialog-accept', 'dialog-dismiss',
        'console', 'network', 'tab-list',
        'reload', 'go-back', 'go-forward'
    )]
    [string]$Action,

    [Parameter()]
    [string]$Ref,

    [Parameter()]
    [string]$Value,

    [Parameter()]
    [string]$Target,

    [Parameter()]
    [string]$Session,

    [Parameter()]
    [ValidateSet('left', 'right', 'middle')]
    [string]$Button
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Build-ActionArguments {
    [OutputType([string[]])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Action,
        [string]$Ref,
        [string]$Value,
        [string]$Target,
        [string]$Button
    )

    $cliArgs = @()

    switch ($Action) {
        'click' {
            $cliArgs += 'click'
            if ($Ref) { $cliArgs += $Ref }
            if ($Button -and $Button -ne 'left') { $cliArgs += $Button }
        }
        'dblclick' {
            $cliArgs += 'dblclick'
            if ($Ref) { $cliArgs += $Ref }
        }
        'fill' {
            $cliArgs += 'fill'
            if ($Ref) { $cliArgs += $Ref }
            if ($Value) { $cliArgs += $Value }
        }
        'type' {
            $cliArgs += 'type'
            if ($Value) { $cliArgs += $Value }
        }
        'select' {
            $cliArgs += 'select'
            if ($Ref) { $cliArgs += $Ref }
            if ($Value) { $cliArgs += $Value }
        }
        'hover' {
            $cliArgs += 'hover'
            if ($Ref) { $cliArgs += $Ref }
        }
        'drag' {
            $cliArgs += 'drag'
            if ($Ref) { $cliArgs += $Ref }
            if ($Target) { $cliArgs += $Target }
        }
        'check' {
            $cliArgs += 'check'
            if ($Ref) { $cliArgs += $Ref }
        }
        'uncheck' {
            $cliArgs += 'uncheck'
            if ($Ref) { $cliArgs += $Ref }
        }
        'press' {
            $cliArgs += 'press'
            if ($Value) { $cliArgs += $Value }
        }
        'snapshot' {
            $cliArgs += 'snapshot'
        }
        'eval' {
            $cliArgs += 'eval'
            if ($Value) { $cliArgs += $Value }
        }
        'goto' {
            $cliArgs += 'goto'
            if ($Value) { $cliArgs += $Value }
        }
        'dialog-accept' {
            $cliArgs += 'dialog-accept'
            if ($Value) { $cliArgs += $Value }
        }
        'dialog-dismiss' {
            $cliArgs += 'dialog-dismiss'
        }
        'console' {
            $cliArgs += 'console'
            if ($Value) { $cliArgs += $Value }
        }
        'network' {
            $cliArgs += 'network'
        }
        'tab-list' {
            $cliArgs += 'tab-list'
        }
        'reload' {
            $cliArgs += 'reload'
        }
        'go-back' {
            $cliArgs += 'go-back'
        }
        'go-forward' {
            $cliArgs += 'go-forward'
        }
    }

    return $cliArgs
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $cliArgs = Build-ActionArguments `
            -Action $Action `
            -Ref $Ref `
            -Value $Value `
            -Target $Target `
            -Button $Button

        Write-SkillOutput -Title 'Action' -Message "Executing: $Action $(if ($Ref) { "on $Ref" } elseif ($Value) { "with '$Value'" })"

        $result = Invoke-PlaywrightCli -Arguments $cliArgs -Session $Session

        if ($result) {
            Write-Host $result
        }

        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Invoke-BrowserAction failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
