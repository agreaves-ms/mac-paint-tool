# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

<#
.SYNOPSIS
Stops a dev server previously started by Start-DevServer.ps1.

.DESCRIPTION
Reads the PID file written by Start-DevServer and kills the server process.
Falls back to killing any process listening on the target port when the
PID file is missing or stale.

.PARAMETER Port
Port of the dev server to stop. Defaults to 5174.

.EXAMPLE
./Stop-DevServer.ps1
Stops the dev server on port 5174.

.EXAMPLE
./Stop-DevServer.ps1 -Port 3000
Stops a dev server running on port 3000.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [int]$Port = 5174
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    $repoRoot = Get-RepositoryRoot
    $pidFile = Join-Path $repoRoot '.dev-server.pid'
    $logFile = Join-Path $repoRoot '.dev-server.log'
    $stopped = $false

    # Try PID file first
    if (Test-Path $pidFile) {
        $processId = [int](Get-Content $pidFile -ErrorAction SilentlyContinue)
        if ($processId) {
            try {
                if ($IsLinux -or $IsMacOS) {
                    & kill $processId 2>$null
                }
                else {
                    Stop-Process -Id $processId -Force -ErrorAction Stop
                }
                $stopped = $true
                Write-SkillOutput -Title 'DevServer' -Message "Stopped server (PID $processId)."
            }
            catch {
                Write-Host "PID $processId not running. Checking port $Port..."
            }
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }

    # Fall back to killing by port
    if (-not $stopped) {
        if ($IsLinux -or $IsMacOS) {
            $pids = & lsof -ti ":$Port" 2>$null
            if ($pids) {
                foreach ($p in ($pids -split "`n")) {
                    $p = $p.Trim()
                    if ($p) {
                        & kill $p 2>$null
                        $stopped = $true
                    }
                }
                if ($stopped) {
                    Write-SkillOutput -Title 'DevServer' -Message "Stopped process(es) on port $Port."
                }
            }
        }
        else {
            $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
            Where-Object State -eq 'Listen'
            if ($conn) {
                $conn | ForEach-Object {
                    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
                }
                $stopped = $true
                Write-SkillOutput -Title 'DevServer' -Message "Stopped process(es) on port $Port."
            }
        }
    }

    if (-not $stopped) {
        Write-SkillOutput -Title 'DevServer' -Message "No server found on port $Port."
    }

    # Clean up log file
    Remove-Item $logFile -Force -ErrorAction SilentlyContinue

    exit 0
}
#endregion
