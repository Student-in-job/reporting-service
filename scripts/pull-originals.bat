@echo off
echo ========================================
echo  Pulling latest from original repos
echo ========================================

echo.
echo --- backend-company-repo ---
cd /d "%~dp0..\backend-company-repo"
git checkout main
git pull origin main

echo.
echo --- frontend-company-repo ---
cd /d "%~dp0..\frontend-company-repo"
git checkout main
git pull origin main

echo.
echo ========================================
echo  Done.
echo ========================================
pause
