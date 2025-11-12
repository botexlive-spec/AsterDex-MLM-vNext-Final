@echo off
echo ===============================================
echo AsterDex MLM vNext - Automated Testing
echo ===============================================
echo.

cd /d "%~dp0"

echo Running automated tests...
node scripts/auto-test-fix.js

echo.
echo Press any key to exit...
pause > nul
