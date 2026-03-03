# PowerShell 5.1+ compatible — no #Requires -Version 7.0

<#
.SYNOPSIS
Installs Playwright CLI, API packages, and initializes Edge workspace.

.DESCRIPTION
Installs the Playwright ecosystem components based on the provided flags.
By default, installs the CLI globally and initializes the workspace to
discover Microsoft Edge. Browser binaries are NOT downloaded by default
since Edge is already installed on Windows.

.PARAMETER InstallCli
Install @playwright/cli globally via npm. Defaults to true.

.PARAMETER InstallApi
Install playwright and @playwright/test as dev dependencies in the current project.

.PARAMETER InstallBrowsers
Download Playwright browser binaries. Defaults to false (Edge is used directly).

.PARAMETER InitializeCliWorkspace
Run workspace initialization to discover installed browsers (Edge).
Defaults to true.

.EXAMPLE
./Install-Playwright.ps1
Installs the CLI globally and initializes Edge workspace.

.EXAMPLE
./Install-Playwright.ps1 -InstallApi -InstallCli:$false
Installs API packages as dev dependencies.

.EXAMPLE
./Install-Playwright.ps1 -InstallApi -InstallBrowsers:$true
Installs both CLI and API packages plus downloads browser binaries.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter()]
    [bool]$InstallCli = $true,

    [Parameter()]
    [switch]$InstallApi,

    [Parameter()]
    [bool]$InstallBrowsers = $false,

    [Parameter()]
    [bool]$InitializeCliWorkspace = $true
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Install-PlaywrightCli {
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([void])]
    param()

    if ($PSCmdlet.ShouldProcess('@playwright/cli', 'Install globally via npm')) {
        Write-SkillOutput -Title 'Install' -Message 'Installing @playwright/cli globally...'
        & npm install -g '@playwright/cli@latest'
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install @playwright/cli globally."
        }
        Write-SkillOutput -Title 'Install' -Message '@playwright/cli installed successfully.'
    }
}

function Install-PlaywrightApi {
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([void])]
    param()

    if ($PSCmdlet.ShouldProcess('playwright @playwright/test', 'Install as dev dependencies')) {
        Write-SkillOutput -Title 'Install' -Message 'Installing playwright and @playwright/test...'
        & npm install -D playwright '@playwright/test'
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install playwright packages."
        }
        Write-SkillOutput -Title 'Install' -Message 'Playwright API packages installed successfully.'
    }
}

function Install-PlaywrightBrowsers {
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([void])]
    param()

    if ($PSCmdlet.ShouldProcess('Playwright browsers', 'Download browser binaries')) {
        Write-SkillOutput -Title 'Install' -Message 'Downloading browser binaries...'
        & npx playwright install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to download Playwright browser binaries."
        }
        Write-SkillOutput -Title 'Install' -Message 'Browser binaries downloaded successfully.'
    }
}

function Initialize-PlaywrightCliWorkspace {
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([void])]
    param()

    if ($PSCmdlet.ShouldProcess('playwright-cli workspace', 'Initialize via npx playwright-cli install')) {
        Write-SkillOutput -Title 'Install' -Message 'Initializing playwright-cli workspace (discovering Edge)...'

        # Use npx to avoid execution policy issues with global .ps1 shims
        & npx playwright-cli install
        if ($LASTEXITCODE -ne 0) {
            throw 'Failed to initialize playwright-cli workspace.'
        }
        Write-SkillOutput -Title 'Install' -Message 'playwright-cli workspace initialized. Edge discovered.'
    }
}

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        if (-not (Test-CommandAvailable 'npm')) {
            throw "npm is required but was not found on PATH. Install Node.js from https://nodejs.org"
        }

        if ($InstallCli) {
            Install-PlaywrightCli
        }

        if ($InstallApi) {
            Install-PlaywrightApi
        }

        if ($InstallBrowsers) {
            Install-PlaywrightBrowsers
        }

        if ($InitializeCliWorkspace) {
            Initialize-PlaywrightCliWorkspace
        }

        Write-SkillOutput -Title 'Install' -Message 'Playwright installation complete (Edge ready).'
        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Install-Playwright failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
