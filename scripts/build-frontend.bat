@echo off
setlocal EnableExtensions

REM ============================================================================
REM build-frontend.bat
REM
REM Builds the frontend into the .\publish\static folder using Docker, so no
REM local Node.js install is required.
REM
REM Steps:
REM   1. Verifies Docker is running.
REM   2. Builds the frontend "build-stage" Docker image (runs vite build inside
REM      node:22) with the public base path set to /static/ so the assets
REM      resolve when the FastAPI backend serves the SPA under /static.
REM   3. Extracts the compiled static site from the image into .\publish\static.
REM   4. Cleans up the temporary extract container.
REM
REM This script lives in <project-root>\scripts and resolves all paths relative
REM to the project root, so it can be run from any working directory.
REM
REM Usage:  scripts\build-frontend.bat [base]      (default base: /static/)
REM Override TAG or OUTPUT_DIR via environment variables of the same name.
REM ============================================================================

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
if not defined OUTPUT_DIR set "OUTPUT_DIR=%PROJECT_ROOT%\publish\static"
if not defined TAG set "TAG=reportfe-build"
set "EXTRACT=reportfe-extract"
set "BASE=%~1"
if not defined BASE set "BASE=/static/"
if "%BASE%"=="" set "BASE=/static/"

echo ==^> Checking Docker...
docker version --format "{{.Server.Version}}" >nul
if errorlevel 1 ( echo ERROR: Docker is not available. Start Docker Desktop and try again. & exit /b 1 )

echo ==^> Building frontend image (vite build inside node:22, base '%BASE%')...
docker build --build-arg "VITE_BASE=%BASE%" --target build-stage -t "%TAG%" "%FRONTEND_DIR%"
if errorlevel 1 ( echo ERROR: Frontend build failed. & exit /b 1 )

REM Remove any leftover extract container from a previous interrupted run.
docker rm -f "%EXTRACT%" >nul 2>&1

echo ==^> Extracting build output...
docker create --name "%EXTRACT%" "%TAG%" >nul
if errorlevel 1 ( echo ERROR: Could not create extract container. & exit /b 1 )

if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

docker cp "%EXTRACT%:/app/dist/." "%OUTPUT_DIR%"
set "CP_ERR=%ERRORLEVEL%"
docker rm "%EXTRACT%" >nul 2>&1
if not "%CP_ERR%"=="0" ( echo ERROR: Could not copy build output from container. & exit /b 1 )

set "COUNT=0"
for /f %%C in ('dir /b /s /a-d "%OUTPUT_DIR%" 2^>nul ^| find /c /v ""') do set "COUNT=%%C"

echo.
echo ==^> Done. %COUNT% files written to %OUTPUT_DIR%
exit /b 0
