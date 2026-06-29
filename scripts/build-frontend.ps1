#Requires -Version 5.1

# =============================================================================
# build-frontend.ps1
#
# Builds the frontend into the ./publish/static folder using Docker, so no
# local Node.js install is required.
#
# Steps:
#   1. Verifies Docker is running.
#   2. Builds the frontend "build-stage" Docker image (yarn install + vite build
#      inside node:22). The Dockerfile is intentionally left unchanged so it can
#      be reused as-is by CI/CD (which serves the SPA at root).
#   3. Re-runs `vite build --base /static/` inside that image and extracts the
#      compiled static site (index.html + hashed css/js + assets) into the
#      ./publish/static folder, so the assets resolve when the FastAPI backend
#      serves the SPA under /static.
#   4. Cleans up the temporary build/extract container.
#
# This script lives in <project-root>/scripts and resolves all paths relative
# to the project root, so it can be run from any working directory.
# =============================================================================

<#
.SYNOPSIS
    Build the frontend into ./publish/static using Docker (no local Node required).

.PARAMETER OutputDir
    Destination folder for the static build. Defaults to <project-root>/publish/static.

.PARAMETER Tag
    Docker image tag used for the build stage. Defaults to 'reportfe-build'.

.PARAMETER Base
    Public base path the built assets are served from. Defaults to '/static/'.

.EXAMPLE
    .\scripts\build-frontend.ps1

.EXAMPLE
    .\scripts\build-frontend.ps1 -OutputDir 'C:\inetpub\wwwroot' -Base '/'
#>
[CmdletBinding()]
param(
    [string]$OutputDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'publish\static'),
    [string]$Tag = 'reportfe-build',
    [string]$Base = '/static/'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$extractContainer = 'reportfe-extract'
$frontendDir = Join-Path $projectRoot 'frontend'

function Assert-LastExit([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

Write-Host '==> Checking Docker...' -ForegroundColor Cyan
docker version --format '{{.Server.Version}}' | Out-Null
Assert-LastExit 'Docker is not available. Start Docker Desktop and try again.'

Write-Host '==> Building frontend image (yarn install + vite build inside node:22)...' -ForegroundColor Cyan
docker build --target build-stage -t $Tag $frontendDir
Assert-LastExit 'Frontend build failed.'

# Remove any leftover extract container from a previous interrupted run.
$leftover = docker ps -aq --filter "name=^$extractContainer$"
if ($leftover) { docker rm -f $extractContainer | Out-Null }

# Re-run the Vite build inside the image with the publish base path so the
# generated assets resolve when the backend serves the SPA under $Base. Done
# here (not in the Dockerfile) so the Dockerfile stays unchanged for CI/CD.
Write-Host "==> Building SPA with base '$Base'..." -ForegroundColor Cyan
docker run --name $extractContainer $Tag yarn vite build --base $Base
Assert-LastExit 'Frontend build (base override) failed.'

try {
    if (Test-Path -LiteralPath $OutputDir) {
        Remove-Item -LiteralPath $OutputDir -Recurse -Force
    }
    [System.IO.Directory]::CreateDirectory($OutputDir) | Out-Null

    docker cp "$($extractContainer):/app/dist/." $OutputDir
    Assert-LastExit 'Could not copy build output from container.'
}
finally {
    docker rm $extractContainer | Out-Null
}

$fileCount = (Get-ChildItem -LiteralPath $OutputDir -Recurse -File).Count
Write-Host ''
Write-Host "==> Done. $fileCount files written to $OutputDir" -ForegroundColor Green
