# ⏰ ROI CRON JOB - COMPLETE SETUP GUIDE

**Platform:** Finaster MLM
**Script:** `scripts/distribute-daily-roi.js`
**Schedule:** Daily at 2:00 AM UTC
**Estimated Setup Time:** 15-30 minutes

---

## 🎯 WHAT THIS DOES

The ROI distribution script:
- Runs automatically every day at 2:00 AM UTC
- Distributes daily ROI to all active user packages
- Calculates ROI based on package amount and daily rate
- Stops at 300% (3x) cap per package
- Logs all distributions to database
- Updates wallet balances
- Records transactions

---

## 📊 SETUP METHODS COMPARISON

| Method | Platform | Difficulty | Reliability | Best For |
|--------|----------|------------|-------------|----------|
| **PM2** | All | ⭐ Easy | ⭐⭐⭐ High | **RECOMMENDED** |
| **System Cron** | Linux/Mac | ⭐⭐ Medium | ⭐⭐⭐ High | Servers |
| **Task Scheduler** | Windows | ⭐⭐ Medium | ⭐⭐ Medium | Windows users |
| **Manual** | All | ⭐ Easy | ⭐ Low | Testing only |

---

## ⚡ METHOD 1: PM2 (RECOMMENDED FOR ALL PLATFORMS)

### Why PM2?
- ✅ Works on Windows, Linux, and Mac
- ✅ Automatic restart on failure
- ✅ Built-in logging
- ✅ Easy monitoring
- ✅ Survives system reboots
- ✅ Simple configuration

### Step 1: Install PM2

```bash
npm install -g pm2
```

**Verify installation:**
```bash
pm2 --version
```

### Step 2: Create Logs Directory

```bash
# Windows PowerShell
New-Item -ItemType Directory -Path "logs" -Force

# Linux/Mac
mkdir -p logs
```

### Step 3: Test the ROI Script

Before scheduling, test it manually:

```bash
node scripts/distribute-daily-roi.js
```

**Expected output:**
```
=====================================
Daily ROI Distribution Started: [timestamp]
=====================================
✓ Found X active packages
✓ Processing ROI distributions...
✓ Distributed ROI: $XXX to X users
✓ Updated X wallets
=====================================
Distribution completed successfully!
=====================================
```

### Step 4: Start with PM2

```bash
pm2 start ecosystem.config.cjs
```

**You should see:**
```
[PM2] Spawning PM2 daemon with pm2_home=...
[PM2] PM2 Successfully daemonized
[PM2] Starting ecosystem.config.cjs in fork mode
[PM2] Done.
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ status  │ restart │ uptime   │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ roi-distribution   │ online  │ 0       │ 0s       │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

### Step 5: Verify Cron Schedule

```bash
pm2 list
```

Look for `cron_restart: 0 2 * * *` in the output.

### Step 6: Save PM2 Configuration

```bash
pm2 save
```

This saves the current process list for automatic restoration.

### Step 7: Enable PM2 Startup (Survive Reboots)

**Windows:**
```bash
pm2 startup
```
Follow the displayed instructions.

**Linux:**
```bash
pm2 startup
# Run the command that PM2 outputs
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

**Mac:**
```bash
pm2 startup
# Run the command that PM2 outputs
```

### Step 8: Verify Everything Works

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs roi-distribution --lines 50

# Monitor in real-time
pm2 monit
```

### PM2 Management Commands

```bash
# View logs
pm2 logs roi-distribution

# View only errors
pm2 logs roi-distribution --err

# Clear logs
pm2 flush

# Stop the cron job
pm2 stop roi-distribution

# Start it again
pm2 start roi-distribution

# Restart
pm2 restart roi-distribution

# Delete from PM2
pm2 delete roi-distribution

# View process info
pm2 info roi-distribution

# Monitor processes
pm2 monit

# Save current state
pm2 save

# Resurrect saved processes
pm2 resurrect
```

---

## 🐧 METHOD 2: SYSTEM CRON (LINUX/MAC)

### Step 1: Open Crontab

```bash
crontab -e
```

### Step 2: Add Cron Job

Add this line (adjust path to your project):

```bash
# Daily at 2:00 AM UTC - Distribute ROI
0 2 * * * cd /path/to/asterdex-8621-main && node scripts/distribute-daily-roi.js >> logs/roi-distribution.log 2>&1
```

**Replace `/path/to/asterdex-8621-main`** with your actual project path.

**To get full path:**
```bash
pwd  # Run this in your project directory
```

### Step 3: Verify Cron Job

```bash
crontab -l
```

You should see your new cron entry.

### Step 4: Test the Cron Entry

```bash
# Run the exact command from cron
cd /path/to/asterdex-8621-main && node scripts/distribute-daily-roi.js >> logs/roi-distribution.log 2>&1

# Check the log
cat logs/roi-distribution.log
```

### Cron Schedule Examples

```bash
# Every day at midnight UTC
0 0 * * * cd /path/to/project && node scripts/distribute-daily-roi.js >> logs/roi.log 2>&1

# Every day at 3:00 AM
0 3 * * * cd /path/to/project && node scripts/distribute-daily-roi.js >> logs/roi.log 2>&1

# Every 6 hours
0 */6 * * * cd /path/to/project && node scripts/distribute-daily-roi.js >> logs/roi.log 2>&1

# Every day at 6 AM, 12 PM, and 6 PM
0 6,12,18 * * * cd /path/to/project && node scripts/distribute-daily-roi.js >> logs/roi.log 2>&1
```

### Cron Troubleshooting

**Cron not running?**
1. Check cron service: `sudo systemctl status cron`
2. Check logs: `grep CRON /var/log/syslog`
3. Verify PATH: Add `PATH=/usr/local/bin:/usr/bin:/bin` to crontab
4. Check permissions: Ensure script is executable

**Full crontab with PATH:**
```bash
PATH=/usr/local/bin:/usr/bin:/bin
SHELL=/bin/bash
0 2 * * * cd /path/to/asterdex-8621-main && node scripts/distribute-daily-roi.js >> logs/roi-distribution.log 2>&1
```

---

## 🪟 METHOD 3: WINDOWS TASK SCHEDULER

### Step 1: Open Task Scheduler

1. Press `Win + R`
2. Type `taskschd.msc`
3. Press Enter

### Step 2: Create New Task

1. Click **"Create Task"** (not "Create Basic Task")
2. Name: `Finaster ROI Distribution`
3. Description: `Daily ROI distribution for MLM platform`
4. Check **"Run whether user is logged on or not"**
5. Check **"Run with highest privileges"**

### Step 3: Set Trigger

1. Go to **"Triggers"** tab
2. Click **"New..."**
3. Begin the task: **"On a schedule"**
4. Settings: **"Daily"**
5. Start: **"2:00:00 AM"**
6. Recur every: **"1 days"**
7. Click **"OK"**

### Step 4: Set Action

1. Go to **"Actions"** tab
2. Click **"New..."**
3. Action: **"Start a program"**
4. Program/script: `C:\Program Files\nodejs\node.exe`
5. Add arguments: `scripts\distribute-daily-roi.js`
6. Start in: `C:\Projects\asterdex-8621-main` (your project path)
7. Click **"OK"**

### Step 5: Configure Settings

1. Go to **"Settings"** tab
2. Check **"Allow task to be run on demand"**
3. Check **"Run task as soon as possible after a scheduled start is missed"**
4. Check **"If the task fails, restart every"**: 10 minutes
5. **"Attempt to restart up to"**: 3 times
6. Click **"OK"**

### Step 6: Test the Task

1. Right-click the task
2. Click **"Run"**
3. Check logs: `logs/roi-distribution.log`

### PowerShell Alternative

Create a PowerShell script to set up the task:

```powershell
# Save as: setup-roi-task.ps1

$Action = New-ScheduledTaskAction -Execute "C:\Program Files\nodejs\node.exe" `
  -Argument "scripts\distribute-daily-roi.js" `
  -WorkingDirectory "C:\Projects\asterdex-8621-main"

$Trigger = New-ScheduledTaskTrigger -Daily -At 2am

$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 10)

Register-ScheduledTask `
  -TaskName "Finaster ROI Distribution" `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Daily ROI distribution for Finaster MLM platform" `
  -RunLevel Highest
```

Run as Administrator:
```powershell
PowerShell -ExecutionPolicy Bypass -File setup-roi-task.ps1
```

---

## 🧪 METHOD 4: MANUAL TESTING

For testing purposes only (not for production):

```bash
# Run once manually
node scripts/distribute-daily-roi.js

# Run with logging
node scripts/distribute-daily-roi.js >> logs/roi-test.log 2>&1
```

---

## ✅ VERIFICATION

After setting up the cron job:

### 1. Check Immediate Execution

**PM2:**
```bash
pm2 trigger roi-distribution 0  # Trigger cron manually
pm2 logs roi-distribution --lines 20
```

**System Cron:**
```bash
# Run manually to test
cd /path/to/project && node scripts/distribute-daily-roi.js
tail -n 50 logs/roi-distribution.log
```

**Windows:**
- Right-click task → Run
- Check `logs\roi-distribution.log`

### 2. Verify Database

Run this in Supabase SQL Editor:

```sql
-- Check recent ROI transactions
SELECT
  t.id,
  t.user_id,
  t.type,
  t.amount,
  t.description,
  t.created_at,
  u.email
FROM mlm_transactions t
LEFT JOIN users u ON u.id = t.user_id
WHERE t.type = 'roi_credit'
  AND t.created_at > NOW() - INTERVAL '24 hours'
ORDER BY t.created_at DESC
LIMIT 10;

-- Check total ROI distributed today
SELECT
  DATE(created_at) as date,
  COUNT(*) as transactions,
  SUM(amount) as total_roi
FROM mlm_transactions
WHERE type = 'roi_credit'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY DATE(created_at);
```

### 3. Check Logs

**PM2:**
```bash
pm2 logs roi-distribution --lines 100
```

**System Cron/Windows:**
```bash
# Windows
type logs\roi-distribution.log

# Linux/Mac
tail -f logs/roi-distribution.log
```

**Expected log output:**
```
=====================================
Daily ROI Distribution Started: 2025-11-01T02:00:00.000Z
=====================================
✓ Found 42 active packages
✓ Processing ROI distributions...
  - User abc123: Package $1000, Daily ROI: $10 (1%)
  - User def456: Package $500, Daily ROI: $5 (1%)
  ...
✓ Distributed ROI: $850.00 to 42 users
✓ Updated 42 wallets
✓ Created 42 transactions
=====================================
Distribution completed successfully!
Time taken: 2.5s
=====================================
```

---

## 📊 MONITORING

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 status

# Logs
pm2 logs roi-distribution

# Web monitoring (optional)
pm2 plus
```

### Log Rotation (Prevent large log files)

**PM2:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

**Linux logrotate:**
Create `/etc/logrotate.d/finaster-roi`:
```
/path/to/asterdex-8621-main/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 youruser yourgroup
}
```

---

## 🚨 TROUBLESHOOTING

### Issue: Script Not Running

**Check:**
1. Node.js installed: `node --version`
2. Dependencies installed: `npm install`
3. Environment variables set in `.env`
4. Script path is correct
5. Permissions (Linux/Mac): `chmod +x scripts/distribute-daily-roi.js`

**PM2:**
```bash
pm2 describe roi-distribution
pm2 logs roi-distribution --err
```

### Issue: "Missing Supabase credentials"

**Fix:** Add to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: Cron Not Triggering

**PM2:**
- Check cron_restart: `pm2 describe roi-distribution`
- Restart PM2: `pm2 restart roi-distribution`

**System Cron:**
- Check cron service: `sudo systemctl status cron`
- Check logs: `grep CRON /var/log/syslog`
- Verify syntax: Use https://crontab.guru

**Windows:**
- Check Task Scheduler history
- Run task manually to test
- Check "Last Run Result" (should be 0x0 for success)

### Issue: Database Connection Failed

**Check:**
1. Supabase project is active
2. SERVICE_ROLE_KEY is correct (not anon key)
3. Internet connection working
4. No firewall blocking

**Test connection:**
```bash
node -e "require('dotenv').config(); console.log(process.env.VITE_SUPABASE_URL)"
```

### Issue: No ROI Distributed

**Possible causes:**
1. No active packages in database
2. Packages already at 300% cap
3. Packages not approved/activated
4. User accounts inactive

**Check in database:**
```sql
SELECT COUNT(*) as active_packages
FROM user_packages
WHERE status = 'active'
  AND total_roi_distributed < (amount * 3);
```

---

## 📈 BEST PRACTICES

### 1. Regular Monitoring
- Check logs weekly: `pm2 logs roi-distribution`
- Monitor database growth
- Verify ROI calculations monthly

### 2. Backup Strategy
- Backup database before major changes
- Keep log files for at least 30 days
- Export transaction history monthly

### 3. Testing
- Test script manually before scheduling
- Test with 1-2 packages first
- Monitor first few automatic runs closely

### 4. Documentation
- Document any custom changes
- Keep track of schedule changes
- Record any issues and resolutions

### 5. Alerts (Optional)
Set up alerts for failures:
- Email notifications on errors
- Slack/Discord webhooks
- SMS for critical failures

---

## 🎯 RECOMMENDED SETUP

For most users, we recommend:

1. **Use PM2** (easiest, most reliable)
2. **Schedule at 2:00 AM UTC** (low traffic time)
3. **Enable log rotation** (prevent disk fill)
4. **Monitor first week daily** (ensure working correctly)
5. **Set up startup script** (survive reboots)

---

## 📋 SETUP CHECKLIST

Before going live:
- [ ] PM2 installed (or cron configured)
- [ ] Script tested manually
- [ ] Logs directory created
- [ ] Environment variables set
- [ ] Cron job scheduled
- [ ] Startup script enabled
- [ ] Logs verified
- [ ] Database verified
- [ ] First distribution successful
- [ ] Documentation reviewed

---

## 🔄 CHANGING THE SCHEDULE

### PM2:
Edit `ecosystem.config.cjs`:
```javascript
cron_restart: '0 3 * * *',  // 3:00 AM instead of 2:00 AM
```

Then:
```bash
pm2 reload ecosystem.config.cjs
pm2 save
```

### System Cron:
```bash
crontab -e
# Change the time: 0 3 * * * ...
```

### Windows:
- Open Task Scheduler
- Double-click the task
- Triggers tab → Edit
- Change time

---

## ✅ SUCCESS CRITERIA

Setup is successful when:

1. ✅ PM2/Cron shows process running
2. ✅ Manual test completes successfully
3. ✅ Logs show "Distribution completed successfully"
4. ✅ Database shows new ROI transactions
5. ✅ Wallet balances updated
6. ✅ Next scheduled run is set
7. ✅ Startup script enabled (survives reboot)

---

## 🎉 YOU'RE DONE!

Your ROI distribution is now automated! The script will run daily at 2:00 AM UTC and distribute ROI to all active packages.

**Next Steps:**
1. Monitor first few runs
2. Set up admin dashboard alerts
3. Configure user notifications
4. Test package lifecycle end-to-end

---

*ROI Cron Job Setup Guide - Finaster MLM Platform*
*Complete Automation Guide for All Platforms*
*Version: 1.0 Final | Last Updated: 2025-11-01*
