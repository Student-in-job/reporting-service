@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0.."
set "TMP_DIR=%ROOT%\tmp"

if not exist "%TMP_DIR%" mkdir "%TMP_DIR%"

for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "D=%%c-%%a-%%b"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "T=%%a%%b"
set "LOGFILE=%TMP_DIR%\%D%_scan_%T%.log"

echo ============================================ > "%LOGFILE%"
echo  Diff scan: original repos vs working folders >> "%LOGFILE%"
echo  Date: %date% %time% >> "%LOGFILE%"
echo ============================================ >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo -------------------------------------------- >> "%LOGFILE%"
echo  BACKEND: backend-company-repo vs backend >> "%LOGFILE%"
echo -------------------------------------------- >> "%LOGFILE%"

set "BACKEND_COUNT=0"
pushd "%ROOT%\backend-company-repo"
for /f "delims=" %%F in ('git ls-files') do (
    set "ORIG=%ROOT%\backend-company-repo\%%F"
    set "WORK=%ROOT%\backend\%%F"

    if not exist "!WORK!" (
        echo [MISSING in working] %%F >> "%LOGFILE%"
        set /a BACKEND_COUNT+=1
    ) else (
        for %%A in ("!ORIG!") do set "OSIZE=%%~zA"
        for %%A in ("!WORK!") do set "WSIZE=%%~zA"
        if not "!OSIZE!"=="!WSIZE!" (
            echo [SIZE DIFFERS]      %%F  ^(original: !OSIZE! bytes, working: !WSIZE! bytes^) >> "%LOGFILE%"
            set /a BACKEND_COUNT+=1
        )
    )
)
popd

echo. >> "%LOGFILE%"
echo Backend differences found: %BACKEND_COUNT% >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo -------------------------------------------- >> "%LOGFILE%"
echo  FRONTEND: frontend-company-repo vs frontend >> "%LOGFILE%"
echo -------------------------------------------- >> "%LOGFILE%"

set "FRONTEND_COUNT=0"
pushd "%ROOT%\frontend-company-repo"
for /f "delims=" %%F in ('git ls-files') do (
    set "ORIG=%ROOT%\frontend-company-repo\%%F"
    set "WORK=%ROOT%\frontend\%%F"

    if not exist "!WORK!" (
        echo [MISSING in working] %%F >> "%LOGFILE%"
        set /a FRONTEND_COUNT+=1
    ) else (
        for %%A in ("!ORIG!") do set "OSIZE=%%~zA"
        for %%A in ("!WORK!") do set "WSIZE=%%~zA"
        if not "!OSIZE!"=="!WSIZE!" (
            echo [SIZE DIFFERS]      %%F  ^(original: !OSIZE! bytes, working: !WSIZE! bytes^) >> "%LOGFILE%"
            set /a FRONTEND_COUNT+=1
        )
    )
)
popd

echo. >> "%LOGFILE%"
echo Frontend differences found: %FRONTEND_COUNT% >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo ============================================ >> "%LOGFILE%"
echo  TOTAL: %BACKEND_COUNT% backend + %FRONTEND_COUNT% frontend differences >> "%LOGFILE%"
echo ============================================ >> "%LOGFILE%"

echo Scan complete. Results saved to:
echo %LOGFILE%
echo.
echo Backend differences:  %BACKEND_COUNT%
echo Frontend differences: %FRONTEND_COUNT%
pause
