#Requires -Version 5.1

# =============================================================================
# build-clean.ps1
#
# Removes everything from the project's ./publish folder EXCEPT the Python
# virtual environment (publish/venv). Use it to clear out the published
# frontend build and backend files before a fresh publish, while keeping the
# (slow-to-recreate) venv in place.
#
# Steps:
#   1. Resolves the publish folder (and the venv folder name to preserve).
#   2. Deletes every top-level entry in publish, including hidden files such as
#      .env, except the venv folder.
#
# This script lives in <project-root>/scripts and resolves all paths relative
# to the project root, so it can be run from any working directory.
# =============================================================================

<#
.SYNOPSIS
    Empty ./publish except the Python virtual environment (publish/venv).

.PARAMETER PublishDir
    Folder to clean. Defaults to <project-root>/publish.

.PARAMETER KeepVenvName
    Name of the virtual-environment folder to preserve. Defaults to 'venv'.

.EXAMPLE
    .\scripts\build-clean.ps1
#>
[CmdletBinding()]
param(
    [string]$PublishDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'publish'),
    [string]$KeepVenvName = 'venv'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $PublishDir)) {
    Write-Host "==> Nothing to clean; $PublishDir does not exist." -ForegroundColor Yellow
    return
}

Write-Host "==> Cleaning $PublishDir (keeping '$KeepVenvName')" -ForegroundColor Cyan

# -Force so hidden/system entries (e.g. .env) are included in the listing.
$entries = Get-ChildItem -LiteralPath $PublishDir -Force |
    Where-Object { $_.Name -ne $KeepVenvName }

$removed = 0
foreach ($entry in $entries) {
    Write-Host "    - removing $($entry.Name)" -ForegroundColor DarkGray
    Remove-Item -LiteralPath $entry.FullName -Recurse -Force
    $removed++
}

Write-Host ''
if ($removed -eq 0) {
    Write-Host "==> Done. Nothing to remove (publish already clean)." -ForegroundColor Green
} else {
    Write-Host "==> Done. Removed $removed item(s); '$KeepVenvName' preserved." -ForegroundColor Green
}
