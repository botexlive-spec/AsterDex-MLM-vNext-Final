@echo off
echo ====================================
echo  Fixing Routing and Module Errors
echo ====================================
echo.

REM Step 1: Kill all Node processes
echo [1/7] Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Step 2: Clear Vite cache
echo [2/7] Clearing Vite cache...
if exist "node_modules\.vite" rd /s /q "node_modules\.vite"

REM Step 3: Clear pnpm cache
echo [3/7] Clearing pnpm cache...
pnpm store prune 2>nul

REM Step 4: Remove node_modules and lock files
echo [4/7] Removing node_modules...
if exist "node_modules" rd /s /q "node_modules"
if exist "pnpm-lock.yaml" del /f /q "pnpm-lock.yaml"

REM Step 5: Fresh install
echo [5/7] Installing dependencies with pnpm...
pnpm install --force

REM Step 6: Clear build cache
echo [6/7] Clearing any build artifacts...
if exist "dist" rd /s /q "dist"
if exist ".vite" rd /s /q ".vite"

REM Step 7: Start dev server
echo [7/7] Starting dev server...
echo.
echo ====================================
echo  Setup Complete! Starting Server...
echo ====================================
echo.

pnpm run dev
