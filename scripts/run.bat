@echo off
setlocal EnableExtensions

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
set "PUBLISH_DIR=%PROJECT_ROOT%\publish"
set "VENV_DIR=%PUBLISH_DIR%\venv"

if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found at %VENV_DIR%
    echo        Run scripts\install-environment.bat first.
    exit /b 1
)

echo ==^> Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

echo ==^> Applying database migrations...
cd /d "%PUBLISH_DIR%"
alembic upgrade head
if errorlevel 1 ( echo ERROR: Alembic migration failed. & exit /b 1 )

echo ==^> Starting server on port 8080...
uvicorn app.main:app --host 0.0.0.0 --port 8080
