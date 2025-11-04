@echo off
echo ====================================
echo  Quick Fix - Clear Cache & Restart
echo ====================================
echo.

REM Kill all Node processes
echo [1/4] Killing Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Clear Vite cache
echo [2/4] Clearing Vite cache...
if exist "node_modules\.vite" rd /s /q "node_modules\.vite"
if exist ".vite" rd /s /q ".vite"

REM Clear dist
echo [3/4] Clearing build artifacts...
if exist "dist" rd /s /q "dist"
if exist "build" rd /s /q "build"

REM Start dev server
echo [4/4] Starting dev server...
echo.
echo ====================================
echo  Server Starting...
echo ====================================
echo.

cd /d C:\Projects\asterdex-8621-main
npm run dev
