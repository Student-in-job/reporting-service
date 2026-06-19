@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================================
REM build-backend.bat
REM
REM Copies the backend FastAPI project into the project's .\publish folder so it
REM can be run locally with uvicorn. The frontend build (publish\static) and the
REM Python virtual environment (publish\venv) are left untouched.
REM
REM What gets copied (everything required to run the API):
REM   - app\            application package
REM   - alembic\        database migrations
REM   - alembic.ini     migration config
REM   - requirements.txt
REM   - entrypoint.sh   (container start helper; harmless locally)
REM   - .env / .env.example  (the published .env has its DATABASE_URL host
REM                     rewritten to localhost so a local uvicorn run reaches the
REM                     host's Postgres; backend\.env keeps host.docker.internal
REM                     for Docker. Pass a full URL as the first argument to set
REM                     it explicitly.)
REM   - static\         merged into publish\static; the backend's index.html is
REM                     the API reference page, copied as api-reference.html so
REM                     it does not overwrite the frontend's index.html.
REM
REM What is intentionally NOT copied:
REM   - __pycache__\, *.pyc, .git\, docs, Docker files
REM
REM This script lives in <project-root>\scripts and resolves all paths relative
REM to the project root, so it can be run from any working directory.
REM
REM Usage:  scripts\build-backend.bat [databaseUrl]
REM ============================================================================

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
if not defined PUBLISH_DIR set "PUBLISH_DIR=%PROJECT_ROOT%\publish"
set "DATABASE_URL_ARG=%~1"

if not exist "%BACKEND_DIR%" ( echo ERROR: Backend folder not found at: %BACKEND_DIR% & exit /b 1 )

echo ==^> Publishing backend into %PUBLISH_DIR%
if not exist "%PUBLISH_DIR%" mkdir "%PUBLISH_DIR%"

REM --- Mirror source directories (drop Python caches). robocopy exit >=8 fails. ---
for %%D in (app alembic) do (
    if exist "%BACKEND_DIR%\%%D" (
        echo     - %%D\
        robocopy "%BACKEND_DIR%\%%D" "%PUBLISH_DIR%\%%D" /MIR /XD __pycache__ /XF *.pyc /NFL /NDL /NJH /NJS /NP >nul
        if !ERRORLEVEL! GEQ 8 ( echo ERROR: robocopy failed for %%D & exit /b 1 )
    )
)

REM --- Copy individual files ---
for %%F in (alembic.ini requirements.txt entrypoint.sh .env .env.example) do (
    if exist "%BACKEND_DIR%\%%F" (
        echo     - %%F
        robocopy "%BACKEND_DIR%" "%PUBLISH_DIR%" "%%F" /NFL /NDL /NJH /NJS /NP >nul
        if !ERRORLEVEL! GEQ 8 ( echo ERROR: robocopy failed for %%F & exit /b 1 )
    )
)

REM --- Merge backend static into publish\static (index.html -> api-reference.html) ---
if exist "%BACKEND_DIR%\static" (
    echo     - static\ ^(merged; index.html -^> api-reference.html^)
    if not exist "%PUBLISH_DIR%\static" mkdir "%PUBLISH_DIR%\static"
    robocopy "%BACKEND_DIR%\static" "%PUBLISH_DIR%\static" /E /XF index.html /XD __pycache__ /NFL /NDL /NJH /NJS /NP >nul
    if !ERRORLEVEL! GEQ 8 ( echo ERROR: robocopy failed for static & exit /b 1 )
    if exist "%BACKEND_DIR%\static\index.html" copy /y "%BACKEND_DIR%\static\index.html" "%PUBLISH_DIR%\static\api-reference.html" >nul
)

REM --- Adjust the published .env for local (non-Docker) runs. The Dockerized
REM     backend uses host.docker.internal; a local uvicorn run must use localhost.
REM     UTF-8 codepage keeps non-ASCII comments intact; blank lines are preserved
REM     via the findstr /n trick. ---
set "PUBLISH_ENV=%PUBLISH_DIR%\.env"
if exist "%PUBLISH_ENV%" (
    chcp 65001 >nul
    > "%PUBLISH_ENV%.tmp" (
        for /f "usebackq delims=" %%L in (`findstr /n "^" "%PUBLISH_ENV%"`) do (
            set "line=%%L"
            set "line=!line:*:=!"
            if "!line:~0,13!"=="DATABASE_URL=" (
                if defined DATABASE_URL_ARG (
                    echo DATABASE_URL=!DATABASE_URL_ARG!
                ) else (
                    set "newline=!line:host.docker.internal=localhost!"
                    echo(!newline!
                )
            ) else (
                echo(!line!
            )
        )
    )
    move /y "%PUBLISH_ENV%.tmp" "%PUBLISH_ENV%" >nul
    if defined DATABASE_URL_ARG (
        echo     - .env: DATABASE_URL set to provided value
    ) else (
        echo     - .env: DATABASE_URL host -^> localhost
    )
)

echo.
echo ==^> Done. Backend published to %PUBLISH_DIR%
echo     Run locally (from the publish folder) with:
echo         venv\Scripts\activate.bat
echo         uvicorn app.main:app --host 0.0.0.0 --port 8000
exit /b 0
