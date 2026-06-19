@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================================
REM build-clean.bat
REM
REM Removes everything from the project's .\publish folder EXCEPT the Python
REM virtual environment (publish\venv). Use it to clear out the published
REM frontend build and backend files before a fresh publish, while keeping the
REM (slow-to-recreate) venv in place.
REM
REM This script lives in <project-root>\scripts and resolves all paths relative
REM to the project root, so it can be run from any working directory.
REM
REM Usage:  scripts\build-clean.bat [keepFolderName]   (default: venv)
REM ============================================================================

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
if not defined PUBLISH_DIR set "PUBLISH_DIR=%PROJECT_ROOT%\publish"
set "KEEP=%~1"
if not defined KEEP set "KEEP=venv"
if "%KEEP%"=="" set "KEEP=venv"

if not exist "%PUBLISH_DIR%" (
    echo ==^> Nothing to clean; %PUBLISH_DIR% does not exist.
    exit /b 0
)

echo ==^> Cleaning %PUBLISH_DIR% (keeping '%KEEP%')
set /a REMOVED=0
for /f "delims=" %%E in ('dir /b /a "%PUBLISH_DIR%" 2^>nul') do (
    if /i not "%%E"=="%KEEP%" (
        echo     - removing %%E
        if exist "%PUBLISH_DIR%\%%E\" (
            rmdir /s /q "%PUBLISH_DIR%\%%E"
        ) else (
            del /f /q "%PUBLISH_DIR%\%%E" >nul
        )
        set /a REMOVED+=1
    )
)

echo.
if !REMOVED!==0 (
    echo ==^> Done. Nothing to remove ^(publish already clean^).
) else (
    echo ==^> Done. Removed !REMOVED! item^(s^); '%KEEP%' preserved.
)
exit /b 0
