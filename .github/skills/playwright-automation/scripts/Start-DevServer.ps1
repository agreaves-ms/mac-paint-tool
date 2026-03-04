# PowerShell 5.1+ compatible — no #Requires -Version 7.0

<#
.SYNOPSIS
Starts a dev server for Playwright testing.

.DESCRIPTION
Launches a dev server using the provided command and port. The command
can be any shell command that starts an HTTP server.

The server runs as a background process. Its PID is saved to
.dev-server.pid for later cleanup by Stop-DevServer.ps1.

.PARAMETER Command
Shell command to start the dev server.

.PARAMETER Port
Port number the server listens on. Defaults to 5174.

.PARAMETER Wait
Wait until the server is ready before returning. Defaults to true.

.PARAMETER TimeoutSeconds
Maximum seconds to wait for server readiness. Defaults to 30.

.PARAMETER ReadinessUrl
Custom URL to poll for readiness instead of http://localhost:<Port>.

.EXAMPLE
./Start-DevServer.ps1 -Command "npm run dev -- --port 5174"

.EXAMPLE
./Start-DevServer.ps1 -Command "npx vite --config vite.renderer.config.ts --port 3000" -Port 3000

.EXAMPLE
./Start-DevServer.ps1 -Command "node server.js" -Port 8080 -Wait:$false
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Command,

    [Parameter()]
    [int]$Port = 5174,

    [Parameter()]
    [string]$Wait = 'true',

    [Parameter()]
    [int]$TimeoutSeconds = 30,

    [Parameter()]
    [string]$ReadinessUrl
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function ConvertTo-Boolean {
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $normalized = $Value.Trim().ToLowerInvariant()
    switch ($normalized) {
        'true' { return $true }
        '$true' { return $true }
        '1' { return $true }
        'false' { return $false }
        '$false' { return $false }
        '0' { return $false }
        default {
            throw "Invalid -Wait value '$Value'. Use true/false/1/0."
        }
    }
}

function Test-PortInUse {
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    try {
        $listener = New-Object System.Net.Sockets.TcpClient
        $listener.Connect('127.0.0.1', $Port)
        $listener.Close()
        return $true
    }
    catch {
        return $false
    }
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        if (Test-PortInUse -Port $Port) {
            Write-SkillOutput -Title 'DevServer' -Message "Port $Port is already in use. Server may already be running."
            Write-Host "URL: http://localhost:$Port"
            exit 0
        }

        $repoRoot = Get-RepositoryRoot
        $shouldWait = ConvertTo-Boolean -Value $Wait
        $url = if ($ReadinessUrl) { $ReadinessUrl } else { "http://localhost:$Port" }
        $logFile = Join-Path $repoRoot '.dev-server.log'
        $pidFile = Join-Path $repoRoot '.dev-server.pid'

        Write-SkillOutput -Title 'DevServer' -Message "Starting dev server on port $Port..."
        Write-Host "URL: $url"
        Write-Host "Command: $Command"
        Write-Host ""

        # On Windows, use Start-Process for background launch.
        # On macOS/Linux, use nohup.
        $isWindows = Test-IsWindowsHost

        if ($isWindows) {
            # Split the command into executable and arguments for Start-Process
            $parts = $Command -split '\s+', 2
            $exe = $parts[0]
            $spArgs = if ($parts.Length -gt 1) { $parts[1] } else { '' }
            $process = Start-Process -FilePath $exe `
                -ArgumentList $spArgs `
                -WorkingDirectory $repoRoot `
                -NoNewWindow -PassThru `
                -RedirectStandardOutput $logFile
            $processId = $process.Id
            Set-Content -Path $pidFile -Value $processId
            Write-Host "Server PID: $processId"
        }
        else {
            Push-Location $repoRoot
            try {
                & bash -c "nohup $Command > '$logFile' 2>&1 & echo `$! > '$pidFile'"
            }
            finally {
                Pop-Location
            }
            $processId = [int](Get-Content $pidFile -ErrorAction Stop)
            Write-Host "Server PID: $processId"
        }

        if ($shouldWait) {
            $ready = Wait-ForUrl -Url $url -TimeoutSeconds $TimeoutSeconds
            if ($ready) {
                Write-SkillOutput -Title 'DevServer' -Message "Server ready at $url (PID $processId)"
            }
            else {
                Write-Warning "Server did not respond within $TimeoutSeconds seconds. It may still be starting."
            }
        }
        else {
            Write-SkillOutput -Title 'DevServer' -Message "Server launched at $url (PID $processId). Not waiting for readiness."
        }
    }
    catch {
        Write-Error -ErrorAction Continue "Start-DevServer failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
