@echo off
setlocal EnableExtensions

REM ============================================================================
REM install-environment.bat
REM
REM Creates a Python virtual environment inside the project's .\publish folder
REM and installs all backend Python dependencies (from backend\requirements.txt).
REM
REM Steps:
REM   1. Verifies a host Python 3 is available.
REM   2. Creates the venv at .\publish\venv (reused if it already exists; pass
REM      "recreate" as the first argument to rebuild it from scratch).
REM   3. Upgrades pip inside the venv.
REM   4. Installs the backend dependencies from backend\requirements.txt.
REM
REM This script lives in <project-root>\scripts and resolves all paths relative
REM to the project root, so it can be run from any working directory.
REM
REM Usage:  scripts\install-environment.bat [recreate]
REM Override the host Python by setting the PYTHON environment variable.
REM ============================================================================

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
set "VENV_DIR=%PROJECT_ROOT%\publish\venv"
set "REQUIREMENTS=%PROJECT_ROOT%\backend\requirements.txt"
if not defined PYTHON set "PYTHON=python"

set "RECREATE="
if /i "%~1"=="recreate" set "RECREATE=1"

echo ==^> Checking Python...
"%PYTHON%" --version
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3, or set PYTHON=^<path-to-python.exe^>.
    exit /b 1
)

if not exist "%REQUIREMENTS%" (
    echo ERROR: Backend requirements file not found at: %REQUIREMENTS%
    exit /b 1
)

if defined RECREATE if exist "%VENV_DIR%" (
    echo ==^> Removing existing virtual environment at %VENV_DIR%
    rmdir /s /q "%VENV_DIR%"
)

if exist "%VENV_DIR%\Scripts\python.exe" (
    echo ==^> Reusing existing virtual environment at %VENV_DIR%
) else (
    echo ==^> Creating virtual environment at %VENV_DIR%
    "%PYTHON%" -m venv "%VENV_DIR%"
    if errorlevel 1 ( echo ERROR: Failed to create virtual environment. & exit /b 1 )
)

echo ==^> Upgrading pip...
"%VENV_DIR%\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 ( echo ERROR: Failed to upgrade pip. & exit /b 1 )

echo ==^> Installing backend dependencies from %REQUIREMENTS%
"%VENV_DIR%\Scripts\python.exe" -m pip install -r "%REQUIREMENTS%"
if errorlevel 1 ( echo ERROR: Failed to install backend dependencies. & exit /b 1 )

echo.
echo ==^> Done. Virtual environment ready at %VENV_DIR%
echo     Activate it with:  %VENV_DIR%\Scripts\activate.bat
exit /b 0
