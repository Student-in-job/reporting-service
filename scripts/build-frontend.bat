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
REM   2. Builds the frontend "build-stage" Docker image (yarn install + vite
REM      build inside node:22). The Dockerfile is intentionally left unchanged
REM      so it can be reused as-is by CI/CD (which serves the SPA at root).
REM   3. Re-runs vite build --base /static/ inside that image and extracts the
REM      compiled static site into .\publish\static, so the assets resolve when
REM      the FastAPI backend serves the SPA under /static.
REM   4. Cleans up the temporary build/extract container.
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

echo ==^> Building frontend image (yarn install + vite build inside node:22)...
docker build --target build-stage -t "%TAG%" "%FRONTEND_DIR%"
if errorlevel 1 ( echo ERROR: Frontend build failed. & exit /b 1 )

REM Remove any leftover extract container from a previous interrupted run.
docker rm -f "%EXTRACT%" >nul 2>&1

REM Re-run the Vite build with the publish base path so the assets resolve when
REM the backend serves the SPA under %BASE%. Done here (not in the Dockerfile)
REM so the Dockerfile stays unchanged for CI/CD.
echo ==^> Building SPA with base '%BASE%'...
docker run --name "%EXTRACT%" "%TAG%" yarn vite build --base "%BASE%"
if errorlevel 1 ( echo ERROR: Frontend build ^(base override^) failed. & docker rm -f "%EXTRACT%" >nul 2>&1 & exit /b 1 )

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
