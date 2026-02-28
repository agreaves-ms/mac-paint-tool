# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0

<#
.SYNOPSIS
Installs Playwright CLI, API packages, and browser binaries.

.DESCRIPTION
Installs the Playwright ecosystem components based on the provided flags.
By default, installs the CLI globally and downloads browser binaries.

.PARAMETER InstallCli
Install @playwright/cli globally via npm. Defaults to true.

.PARAMETER InstallApi
Install playwright and @playwright/test as dev dependencies in the current project.

.PARAMETER InstallBrowsers
Download Playwright browser binaries. Defaults to true.

.EXAMPLE
./Install-Playwright.ps1
Installs the CLI globally and downloads browsers.

.EXAMPLE
./Install-Playwright.ps1 -InstallApi -InstallCli:$false
Installs API packages as dev dependencies and downloads browsers.

.EXAMPLE
./Install-Playwright.ps1 -InstallApi
Installs both CLI and API packages plus browsers.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter()]
    [bool]$InstallCli = $true,

    [Parameter()]
    [switch]$InstallApi,

    [Parameter()]
    [bool]$InstallBrowsers = $true
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'shared.psm1') -Force

function Install-PlaywrightCli {
    <#
.SYNOPSIS
Installs @playwright/cli globally.
.OUTPUTS
System.Void
#>
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
    <#
.SYNOPSIS
Installs playwright and @playwright/test as dev dependencies.
.OUTPUTS
System.Void
#>
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
    <#
.SYNOPSIS
Downloads Playwright browser binaries.
.OUTPUTS
System.Void
#>
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

        Write-SkillOutput -Title 'Install' -Message 'Playwright installation complete.'
        exit 0
    }
    catch {
        Write-Error -ErrorAction Continue "Install-Playwright failed: $($_.Exception.Message)"
        exit 1
    }
}
#endregion
