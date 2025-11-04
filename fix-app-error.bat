@echo off
echo Killing all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Clearing Vite cache...
if exist "node_modules\.vite" rd /s /q "node_modules\.vite"

echo Starting dev server...
npm run dev
