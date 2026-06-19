#Requires -Version 5.1

# =============================================================================
# build-backend.ps1
#
# Copies the backend FastAPI project into the project's ./publish folder so it
# can be run locally with uvicorn. The frontend build (publish/static) and the
# Python virtual environment (publish/venv) are left untouched.
#
# What gets copied (everything required to run the API):
#   - app/            application package
#   - alembic/        database migrations
#   - alembic.ini     migration config
#   - requirements.txt
#   - entrypoint.sh   (container start helper; harmless locally)
#   - .env / .env.example  (the published .env has its DATABASE_URL host
#                     rewritten to localhost so a local uvicorn run reaches the
#                     host's Postgres; backend/.env keeps host.docker.internal
#                     for Docker. Use -DatabaseUrl to set an explicit URL.)
#   - static/         the backend's own static assets are merged into
#                     publish/static (the frontend build). The backend's
#                     index.html is the API reference page, so it is copied as
#                     api-reference.html to avoid overwriting the frontend's
#                     index.html. Any other backend static files are copied as-is.
#
# What is intentionally NOT copied:
#   - __pycache__/, *.pyc, .git/, docs, Docker files
#
# This script lives in <project-root>/scripts and resolves all paths relative
# to the project root, so it can be run from any working directory.
# =============================================================================

<#
.SYNOPSIS
    Copy the backend project into ./publish for local uvicorn runs (backend
    static is merged into publish/static; its index.html -> api-reference.html).

.PARAMETER PublishDir
    Target folder. Defaults to <project-root>/publish.

.PARAMETER DatabaseUrl
    Full DATABASE_URL to write into publish/.env. If omitted, the copied .env's
    DATABASE_URL host is rewritten to localhost (suitable for local uvicorn runs).

.EXAMPLE
    .\scripts\build-backend.ps1

.EXAMPLE
    .\scripts\build-backend.ps1 -DatabaseUrl 'postgresql+asyncpg://report:report@localhost:5432/report_service'
#>
[CmdletBinding()]
param(
    [string]$PublishDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'publish'),
    [string]$DatabaseUrl
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot 'backend'

$dirsToCopy  = @('app', 'alembic')
$filesToCopy = @('alembic.ini', 'requirements.txt', 'entrypoint.sh', '.env', '.env.example')

# robocopy uses exit codes 0-7 for success (8+ = failure); translate that here.
function Invoke-Robocopy {
    param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$RoboArgs)
    robocopy @RoboArgs | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "robocopy failed (exit $LASTEXITCODE): $($RoboArgs -join ' ')"
    }
}

if (-not (Test-Path -LiteralPath $backendDir)) {
    throw "Backend folder not found at: $backendDir"
}

Write-Host "==> Publishing backend into $PublishDir" -ForegroundColor Cyan
[System.IO.Directory]::CreateDirectory($PublishDir) | Out-Null

# Mirror each source directory into publish/<dir>, dropping Python caches.
# /MIR keeps the target in sync with the source on repeated runs. Each call
# targets only publish/<dir>, so publish/static and publish/venv are never touched.
foreach ($dir in $dirsToCopy) {
    $src = Join-Path $backendDir $dir
    if (Test-Path -LiteralPath $src) {
        Write-Host "    - $dir/" -ForegroundColor DarkGray
        Invoke-Robocopy $src (Join-Path $PublishDir $dir) '/MIR' '/XD' '__pycache__' '/XF' '*.pyc' '/NFL' '/NDL' '/NJH' '/NJS' '/NP'
    }
}

# Copy individual files.
foreach ($file in $filesToCopy) {
    if (Test-Path -LiteralPath (Join-Path $backendDir $file)) {
        Write-Host "    - $file" -ForegroundColor DarkGray
        Invoke-Robocopy $backendDir $PublishDir $file '/NFL' '/NDL' '/NJH' '/NJS' '/NP'
    }
}

# Merge the backend's static assets into publish/static (the frontend build).
# Everything except index.html is copied as-is (NO /MIR, so the frontend files
# are preserved); the backend's index.html is the API reference page and is
# copied separately as api-reference.html so it doesn't overwrite the SPA entry.
$backendStatic = Join-Path $backendDir 'static'
$publishStatic = Join-Path $PublishDir 'static'
if (Test-Path -LiteralPath $backendStatic) {
    Write-Host '    - static/ (merged; index.html -> api-reference.html)' -ForegroundColor DarkGray
    [System.IO.Directory]::CreateDirectory($publishStatic) | Out-Null
    Invoke-Robocopy $backendStatic $publishStatic '/E' '/XF' 'index.html' '/XD' '__pycache__' '/NFL' '/NDL' '/NJH' '/NJS' '/NP'

    $apiRefSrc = Join-Path $backendStatic 'index.html'
    if (Test-Path -LiteralPath $apiRefSrc) {
        [System.IO.File]::Copy($apiRefSrc, (Join-Path $publishStatic 'api-reference.html'), $true)
    }
}

# Adjust the published .env for local (non-Docker) runs. The Dockerized backend
# reaches the host's Postgres via host.docker.internal, but a plain local uvicorn
# run must use localhost. Rewrite the DATABASE_URL host (or set -DatabaseUrl).
$publishEnv = Join-Path $PublishDir '.env'
if (Test-Path -LiteralPath $publishEnv) {
    $lines = Get-Content -LiteralPath $publishEnv -Encoding UTF8
    if ($DatabaseUrl) {
        $lines = $lines | ForEach-Object {
            if ($_ -match '^DATABASE_URL=') { "DATABASE_URL=$DatabaseUrl" } else { $_ }
        }
        Write-Host '    - .env: DATABASE_URL set to provided value' -ForegroundColor DarkGray
    } else {
        $lines = $lines -replace '^(DATABASE_URL=[^:]+://[^@]*@)[^:/]+(.*)$', '${1}localhost${2}'
        Write-Host '    - .env: DATABASE_URL host -> localhost' -ForegroundColor DarkGray
    }
    # WriteAllLines uses UTF-8 without BOM (a BOM would corrupt the first .env key).
    [System.IO.File]::WriteAllLines($publishEnv, [string[]]$lines)
}

# robocopy leaves a non-zero (but successful) $LASTEXITCODE; normalize it.
cmd /c "exit 0" | Out-Null

Write-Host ''
Write-Host "==> Done. Backend published to $PublishDir" -ForegroundColor Green
Write-Host '    Run locally (from the publish folder) with:' -ForegroundColor Gray
Write-Host '        .\venv\Scripts\Activate.ps1' -ForegroundColor Gray
Write-Host '        uvicorn app.main:app --host 0.0.0.0 --port 8000' -ForegroundColor Gray
