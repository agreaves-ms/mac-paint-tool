# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

<#
.SYNOPSIS
Starts a standalone Vite dev server for Playwright testing.

.DESCRIPTION
Launches a Vite dev server using the specified config file and port.
The Electron Forge dev server on port 5173 is not accessible from external
browsers. This script starts a standalone server on port 5174 (default)
that Playwright can navigate to.

Note: window.electronAPI (preload bridge) is not available in standalone
mode. File dialogs, clipboard IPC, and menu event listeners do not work.
Test canvas drawing and UI interactions only.

.PARAMETER Port
Port number for the dev server. Defaults to 5174 to avoid conflicts
with Electron Forge's port 5173.

.PARAMETER Config
Path to the Vite config file. Defaults to vite.renderer.config.ts.

.PARAMETER Wait
Wait until the server is ready before returning. Defaults to true.

.PARAMETER TimeoutSeconds
Maximum seconds to wait for server readiness. Defaults to 30.

.EXAMPLE
./Start-DevServer.ps1
Starts the dev server on port 5174 with default config.

.EXAMPLE
./Start-DevServer.ps1 -Port 3000 -Config "vite.config.ts"
Starts the dev server on port 3000 with a custom config.

.EXAMPLE
./Start-DevServer.ps1 -Wait:$false
Starts the dev server without waiting for readiness.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [int]$Port = 5174,

    [Parameter()]
    [string]$Config = "vite.renderer.config.ts",

    [Parameter()]
    [bool]$Wait = $true,

    [Parameter()]
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Start-ViteServer {
<#
.SYNOPSIS
Launches the Vite dev server as a background process.
.PARAMETER Port
Port to listen on.
.PARAMETER Config
Vite config file path.
.OUTPUTS
System.Diagnostics.Process
#>
    [OutputType([System.Diagnostics.Process])]
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port,

        [Parameter(Mandatory = $true)]
        [string]$Config
    )

    if (-not (Test-CommandAvailable 'npx')) {
        throw "npx is required but was not found on PATH. Install Node.js from https://nodejs.org"
    }

    $repoRoot = Get-RepositoryRoot

    $processArgs = @{
        FilePath     = 'npx'
        ArgumentList = @('vite', '--config', $Config, '--port', $Port.ToString())
        WorkingDirectory = $repoRoot
        PassThru     = $true
        NoNewWindow  = $true
    }

    Write-SkillOutput -Title 'DevServer' -Message "Starting Vite dev server on port $Port..."
    $process = Start-Process @processArgs

    return $process
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $process = Start-ViteServer -Port $Port -Config $Config

        if ($Wait) {
            $url = "http://localhost:$Port"
            Write-SkillOutput -Title 'DevServer' -Message "Waiting for $url to become responsive..."

            $ready = Wait-ForUrl -Url $url -TimeoutSeconds $TimeoutSeconds
            if ($ready) {
                Write-SkillOutput -Title 'DevServer' -Message "Server ready at $url (PID: $($process.Id))"
            }
            else {
                Write-Warning "Server did not respond within $TimeoutSeconds seconds. It may still be starting."
                Write-SkillOutput -Title 'DevServer' -Message "Process started with PID: $($process.Id)"
            }
        }
        else {
            Write-SkillOutput -Title 'DevServer' -Message "Server process started (PID: $($process.Id))"
        }

        Write-Host "PID: $($process.Id)"
        Write-Host "URL: http://localhost:$Port"
        Write-Host "Config: $Config"
        Write-Host ""
        Write-Host "To stop: Stop-Process -Id $($process.Id)"

        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Start-DevServer failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
