# Windows Task Scheduler Setup for ROI Distribution
#
# This PowerShell script automatically creates a Windows Task Scheduler task
# for daily ROI distribution.
#
# Usage:
#   Run as Administrator:
#   PowerShell -ExecutionPolicy Bypass -File scripts\setup-roi-windows.ps1

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  ROI CRON JOB - WINDOWS TASK SCHEDULER" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Run this script again`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Running as Administrator" -ForegroundColor Green

# Get current directory (project root)
$projectRoot = $PSScriptRoot | Split-Path -Parent
Write-Host "[INFO] Project root: $projectRoot" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`n[STEP 1] Checking Node.js installation..." -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "`nPlease install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Find Node.js executable path
$nodePath = (Get-Command node).Path
Write-Host "[INFO] Node.js path: $nodePath" -ForegroundColor Cyan

# Check if script exists
Write-Host "`n[STEP 2] Checking ROI distribution script..." -ForegroundColor Cyan

$scriptPath = Join-Path $projectRoot "scripts\distribute-daily-roi.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERROR] Script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Script found: $scriptPath" -ForegroundColor Green

# Check .env file
Write-Host "`n[STEP 3] Checking environment variables..." -ForegroundColor Cyan

$envPath = Join-Path $projectRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "`nPlease create .env file with:" -ForegroundColor Yellow
    Write-Host "  VITE_SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor Yellow
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] .env file found" -ForegroundColor Green

# Create logs directory
Write-Host "`n[STEP 4] Creating logs directory..." -ForegroundColor Cyan

$logsPath = Join-Path $projectRoot "logs"
if (-not (Test-Path $logsPath)) {
    New-Item -ItemType Directory -Path $logsPath | Out-Null
    Write-Host "[OK] Logs directory created" -ForegroundColor Green
} else {
    Write-Host "[OK] Logs directory exists" -ForegroundColor Green
}

# Test the script
Write-Host "`n[STEP 5] Testing ROI distribution script..." -ForegroundColor Cyan
Write-Host "[INFO] This may take a few seconds..." -ForegroundColor Yellow

try {
    Push-Location $projectRoot
    $output = & node $scriptPath 2>&1
    Pop-Location

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Script test successful!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Script completed with warnings" -ForegroundColor Yellow
        Write-Host "Output: $output" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Script test failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nPlease fix the errors before creating the task" -ForegroundColor Yellow
    exit 1
}

# Create the scheduled task
Write-Host "`n[STEP 6] Creating Windows Task Scheduler task..." -ForegroundColor Cyan

$taskName = "Finaster ROI Distribution"

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "[INFO] Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create task action
$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "scripts\distribute-daily-roi.js" `
    -WorkingDirectory $projectRoot

# Create task trigger (daily at 2:00 AM)
$trigger = New-ScheduledTaskTrigger -Daily -At 2am

# Create task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 10)

# Create task principal (run with highest privileges)
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType S4U `
    -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Daily ROI distribution for Finaster MLM platform" | Out-Null

    Write-Host "[OK] Task created successfully!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create task!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Verify task creation
Write-Host "`n[STEP 7] Verifying task..." -ForegroundColor Cyan

$task = Get-ScheduledTask -TaskName $taskName
if ($task) {
    Write-Host "[OK] Task verified:" -ForegroundColor Green
    Write-Host "  Name: $($task.TaskName)" -ForegroundColor Gray
    Write-Host "  State: $($task.State)" -ForegroundColor Gray
    Write-Host "  Next Run: $((Get-ScheduledTaskInfo -TaskName $taskName).NextRunTime)" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Task verification failed!" -ForegroundColor Red
    exit 1
}

# Test run the task
Write-Host "`n[STEP 8] Running test execution..." -ForegroundColor Cyan

try {
    Start-ScheduledTask -TaskName $taskName
    Write-Host "[OK] Task started successfully" -ForegroundColor Green
    Write-Host "[INFO] Waiting for completion..." -ForegroundColor Yellow

    Start-Sleep -Seconds 5

    $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
    Write-Host "[INFO] Last Run Time: $($taskInfo.LastRunTime)" -ForegroundColor Cyan
    Write-Host "[INFO] Last Result: $($taskInfo.LastTaskResult)" -ForegroundColor Cyan

    if ($taskInfo.LastTaskResult -eq 0) {
        Write-Host "[OK] Task executed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Task completed with code: $($taskInfo.LastTaskResult)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Could not test task execution" -ForegroundColor Yellow
    Write-Host "You can test manually from Task Scheduler" -ForegroundColor Gray
}

# Final summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Your ROI distribution task is now active!`n" -ForegroundColor White

Write-Host "Schedule:" -ForegroundColor White
Write-Host "  Daily at 2:00 AM (local time)`n" -ForegroundColor Gray

Write-Host "Task Management:" -ForegroundColor White
Write-Host "  1. Open Task Scheduler (Win+R -> taskschd.msc)" -ForegroundColor Gray
Write-Host "  2. Find: $taskName" -ForegroundColor Gray
Write-Host "  3. Right-click for options (Run, Disable, etc.)`n" -ForegroundColor Gray

Write-Host "Log Files:" -ForegroundColor White
Write-Host "  logs\roi-distribution.log`n" -ForegroundColor Gray

Write-Host "Useful Commands:" -ForegroundColor White
Write-Host "  # View task status" -ForegroundColor Gray
Write-Host "  Get-ScheduledTask -TaskName '$taskName' | Get-ScheduledTaskInfo`n" -ForegroundColor Cyan
Write-Host "  # Run task manually" -ForegroundColor Gray
Write-Host "  Start-ScheduledTask -TaskName '$taskName'`n" -ForegroundColor Cyan
Write-Host "  # Disable task" -ForegroundColor Gray
Write-Host "  Disable-ScheduledTask -TaskName '$taskName'`n" -ForegroundColor Cyan
Write-Host "  # Remove task" -ForegroundColor Gray
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Monitor task runs in Task Scheduler" -ForegroundColor Gray
Write-Host "  2. Check logs after first run" -ForegroundColor Gray
Write-Host "  3. Verify database ROI transactions" -ForegroundColor Gray
Write-Host "  4. Check wallet balances updating`n" -ForegroundColor Gray

Write-Host "[SUCCESS] ROI automation is ready!" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host "`nFor detailed documentation, see: ROI_CRON_SETUP_COMPLETE.md`n" -ForegroundColor Cyan

# Keep window open
Write-Host "Press any key to close..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
