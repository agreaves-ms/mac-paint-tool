# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

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
The browser action to perform. Valid values:
  click, dblclick, fill, type, select, hover, drag, check, uncheck,
  press, snapshot, eval, goto, dialog-accept, dialog-dismiss,
  console, network, tab-list, reload, go-back, go-forward

.PARAMETER Ref
Element reference from a snapshot (e.g., e3). Required for element
interaction actions like click, fill, hover, etc.

.PARAMETER Value
Value for the action. Used with fill (text to enter), type (text to type),
select (option value), press (key name), eval (expression), goto (URL).

.PARAMETER Target
Target element reference for drag actions. Specifies the drop target.

.PARAMETER Session
Named session to scope the action to.

.PARAMETER Button
Mouse button for click actions: left, right, middle. Defaults to left.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action snapshot
Takes a page snapshot and returns element refs.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action click -Ref e3
Clicks element e3.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action fill -Ref e5 -Value "user@example.com"
Fills element e5 with the specified text.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action type -Value "search query"
Types text into the currently focused element.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action select -Ref e9 -Value "option-value"
Selects a dropdown option by value.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action drag -Ref e2 -Target e8
Drags element e2 to element e8.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action press -Value "Enter"
Presses the Enter key.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action eval -Value "document.title"
Evaluates a JavaScript expression in the page context.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action goto -Value "http://localhost:5174"
Navigates to the specified URL.

.EXAMPLE
./Invoke-BrowserAction.ps1 -Action dialog-accept
Accepts the current browser dialog.
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
<#
.SYNOPSIS
Builds the CLI argument list for the specified action.
.OUTPUTS
System.String[]
#>
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
