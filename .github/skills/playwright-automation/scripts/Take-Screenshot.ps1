# PowerShell 5.1+ compatible — no #Requires -Version 7.0

<#
.SYNOPSIS
Takes a screenshot or generates a PDF via playwright-cli.

.DESCRIPTION
Captures a screenshot of the current page or a specific element,
or generates a PDF document. Supports named sessions and custom
output filenames.

.PARAMETER Filename
Output filename for the screenshot or PDF.

.PARAMETER Ref
Element reference from a snapshot (e.g., e5) to screenshot a specific element.

.PARAMETER Format
Output format: png (screenshot) or pdf (PDF document). Defaults to png.

.PARAMETER Session
Named session to target for the capture.

.EXAMPLE
./Take-Screenshot.ps1 -Filename "page.png"

.EXAMPLE
./Take-Screenshot.ps1 -Ref e5 -Filename "element.png"

.EXAMPLE
./Take-Screenshot.ps1 -Format pdf -Filename "page.pdf"
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Filename,

    [Parameter()]
    [string]$Ref,

    [Parameter()]
    [ValidateSet('png', 'pdf')]
    [string]$Format = 'png',

    [Parameter()]
    [string]$Session
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Invoke-Capture {
    [OutputType([string])]
    param(
        [string]$Filename,
        [string]$Ref,
        [string]$Format,
        [string]$Session
    )

    $cliArgs = @()

    if ($Format -eq 'pdf') {
        $cliArgs += 'pdf'
    }
    else {
        $cliArgs += 'screenshot'
    }

    if ($Ref -and $Format -ne 'pdf') {
        $cliArgs += $Ref
    }

    if ($Filename) {
        $cliArgs += "--filename=$Filename"
    }

    return Invoke-PlaywrightCli -Arguments $cliArgs -Session $Session
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $label = if ($Format -eq 'pdf') { 'PDF' } else { 'Screenshot' }
        $target = if ($Ref) { "element $Ref" } else { 'full page' }
        Write-SkillOutput -Title 'Capture' -Message "Taking $label of $target..."

        $result = Invoke-Capture -Filename $Filename -Ref $Ref -Format $Format -Session $Session

        if ($result) {
            Write-Host $result
        }

        Write-SkillOutput -Title 'Capture' -Message "$label captured successfully."
        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Take-Screenshot failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
