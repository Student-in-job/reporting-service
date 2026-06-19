#Requires -Version 5.1

# =============================================================================
# install-environment.ps1
#
# Creates a Python virtual environment inside the project's ./publish folder
# and installs all backend Python dependencies (from backend/requirements.txt)
# into it.
#
# Steps:
#   1. Verifies a host Python 3 is available.
#   2. Creates the virtual environment at ./publish/venv (reused if it already
#      exists; pass -Recreate to rebuild it from scratch).
#   3. Upgrades pip inside the venv.
#   4. Installs the backend dependencies from backend/requirements.txt.
#
# This script lives in <project-root>/scripts and resolves all paths relative
# to the project root, so it can be run from any working directory.
# =============================================================================

<#
.SYNOPSIS
    Create a Python virtual environment in ./publish and install backend deps.

.PARAMETER VenvDir
    Location of the virtual environment. Defaults to <project-root>/publish/venv.

.PARAMETER Python
    Host Python executable used to bootstrap the venv. Defaults to 'python'.

.PARAMETER Recreate
    Delete an existing virtual environment and create a fresh one.

.EXAMPLE
    .\scripts\install-environment.ps1

.EXAMPLE
    .\scripts\install-environment.ps1 -Recreate
#>
[CmdletBinding()]
param(
    [string]$VenvDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'publish\venv'),
    [string]$Python = 'python',
    [switch]$Recreate
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$requirements = Join-Path $projectRoot 'backend\requirements.txt'

function Assert-LastExit([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

Write-Host '==> Checking Python...' -ForegroundColor Cyan
& $Python --version
Assert-LastExit "Python not found. Install Python 3, or pass -Python <path-to-python.exe>."

if (-not (Test-Path -LiteralPath $requirements)) {
    throw "Backend requirements file not found at: $requirements"
}

if ($Recreate -and (Test-Path -LiteralPath $VenvDir)) {
    Write-Host "==> Removing existing virtual environment at $VenvDir" -ForegroundColor Cyan
    Remove-Item -LiteralPath $VenvDir -Recurse -Force
}

$venvPython = Join-Path $VenvDir 'Scripts\python.exe'

if (Test-Path -LiteralPath $venvPython) {
    Write-Host "==> Reusing existing virtual environment at $VenvDir" -ForegroundColor Cyan
} else {
    Write-Host "==> Creating virtual environment at $VenvDir" -ForegroundColor Cyan
    & $Python -m venv $VenvDir
    Assert-LastExit 'Failed to create virtual environment.'
}

Write-Host '==> Upgrading pip...' -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip
Assert-LastExit 'Failed to upgrade pip.'

Write-Host "==> Installing backend dependencies from $requirements" -ForegroundColor Cyan
& $venvPython -m pip install -r $requirements
Assert-LastExit 'Failed to install backend dependencies.'

Write-Host ''
Write-Host "==> Done. Virtual environment ready at $VenvDir" -ForegroundColor Green
Write-Host "    Activate it with:  $VenvDir\Scripts\Activate.ps1"
