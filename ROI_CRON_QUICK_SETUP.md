# ⚡ ROI CRON JOB - QUICK SETUP

**Choose your method and follow the steps below**

---

## 🚀 METHOD 1: AUTOMATED SETUP (PM2) - RECOMMENDED

**Time:** 5 minutes | **Platforms:** Windows, Linux, Mac

### Quick Steps:

```bash
# Install PM2 globally
npm install -g pm2

# Run automated setup script
node scripts/setup-roi-cron.cjs

# Done! ✅
```

The script will:
- ✅ Install PM2 if needed
- ✅ Test the ROI script
- ✅ Start the cron job
- ✅ Configure auto-startup
- ✅ Show you the status

---

## 🪟 METHOD 2: WINDOWS TASK SCHEDULER

**Time:** 3 minutes | **Platform:** Windows only

### Quick Steps:

```powershell
# Run as Administrator:
PowerShell -ExecutionPolicy Bypass -File scripts\setup-roi-windows.ps1

# Done! ✅
```

The script will:
- ✅ Create scheduled task
- ✅ Set daily 2 AM schedule
- ✅ Test the task
- ✅ Configure auto-restart

---

## 🐧 METHOD 3: LINUX/MAC CRON

**Time:** 2 minutes | **Platforms:** Linux, Mac

### Quick Steps:

```bash
# Open crontab
crontab -e

# Add this line (replace /path/to/project):
0 2 * * * cd /path/to/asterdex-8621-main && node scripts/distribute-daily-roi.js >> logs/roi.log 2>&1

# Save and exit
# Done! ✅
```

---

## ✅ VERIFICATION

After setup, verify it's working:

### PM2:
```bash
pm2 status
pm2 logs roi-distribution
```

### Windows:
```powershell
Get-ScheduledTask -TaskName "Finaster ROI Distribution" | Get-ScheduledTaskInfo
```

### Linux/Mac:
```bash
crontab -l
tail -f logs/roi.log
```

---

## 🎯 WHAT IT DOES

- **Runs:** Daily at 2:00 AM UTC
- **Distributes:** ROI to all active packages
- **Updates:** User wallet balances
- **Logs:** All transactions to database
- **Stops:** At 300% (3x) ROI cap

---

## 📊 MANUAL TEST

Before scheduling, test manually:

```bash
node scripts/distribute-daily-roi.js
```

**Expected output:**
```
=====================================
Daily ROI Distribution Started
=====================================
✓ Found X active packages
✓ Distributed ROI: $XXX to X users
✓ Updated X wallets
=====================================
```

---

## 🚨 TROUBLESHOOTING

### "Missing Supabase credentials"

Add to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### "PM2 not found"

Install globally:
```bash
npm install -g pm2
```

### "Task failed to run" (Windows)

- Check Task Scheduler History
- Run task manually to see errors
- Verify Node.js path is correct

### "Cron not running" (Linux/Mac)

- Check cron service: `sudo systemctl status cron`
- Verify PATH in crontab
- Check logs: `grep CRON /var/log/syslog`

---

## 📋 QUICK COMMANDS

### PM2 Commands:
```bash
pm2 status                    # View status
pm2 logs roi-distribution     # View logs
pm2 restart roi-distribution  # Restart
pm2 stop roi-distribution     # Stop
pm2 monit                     # Monitor
```

### Windows Commands:
```powershell
# View task status
Get-ScheduledTask "Finaster ROI Distribution"

# Run task manually
Start-ScheduledTask "Finaster ROI Distribution"

# Disable task
Disable-ScheduledTask "Finaster ROI Distribution"
```

### Linux/Mac Commands:
```bash
crontab -l      # List cron jobs
crontab -e      # Edit cron jobs
crontab -r      # Remove all cron jobs
```

---

## 🎉 SUCCESS CRITERIA

Setup is complete when:

1. ✅ Process is running/scheduled
2. ✅ Manual test completes successfully
3. ✅ Logs show "Distribution completed"
4. ✅ Database shows ROI transactions
5. ✅ Next run is scheduled

---

## 📚 FULL DOCUMENTATION

For detailed setup instructions:
- **Complete Guide:** `ROI_CRON_SETUP_COMPLETE.md`
- **Original Guide:** `ROI_DISTRIBUTION_SETUP.md`

---

## ⏱️ SCHEDULE TIMES

Default schedule: **2:00 AM UTC daily**

To change the time:

**PM2:** Edit `ecosystem.config.cjs`:
```javascript
cron_restart: '0 3 * * *',  // 3:00 AM
```

**Windows:** Task Scheduler → Edit Trigger

**Linux/Mac:** Edit crontab:
```bash
0 3 * * * cd /path/... # 3:00 AM
```

---

## 🔄 CHANGING SCHEDULE

Common schedules:

```bash
# Every 6 hours
0 */6 * * *

# Every 12 hours (midnight & noon)
0 0,12 * * *

# Every day at 3:00 AM
0 3 * * *

# Multiple times (6 AM, 12 PM, 6 PM)
0 6,12,18 * * *
```

Use https://crontab.guru to create custom schedules.

---

## 🎯 RECOMMENDED PATH

1. **Start with METHOD 1** (Automated PM2 setup)
   - Easiest for everyone
   - Works on all platforms
   - Best monitoring tools

2. **Use METHOD 2** if on Windows only
   - Native Windows integration
   - Good for Windows servers

3. **Use METHOD 3** if experienced with cron
   - Traditional approach
   - Simple and reliable

---

## 🚀 NEXT STEPS

After ROI cron is set up:

1. ✅ Monitor first run (check logs)
2. ✅ Verify database transactions
3. ✅ Check wallet balances
4. ✅ Set up admin notifications
5. ✅ Test complete user journey

---

**🎉 Choose your method and get started!**

**Estimated setup time:** 2-5 minutes depending on method

---

*ROI Cron Quick Setup - Finaster MLM Platform*
*Version: 1.0 Final | Last Updated: 2025-11-01*
