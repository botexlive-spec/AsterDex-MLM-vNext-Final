# ROI Distribution System - Setup Guide

**Status:** ✅ Implemented (2025-11-01)
**Location:**
- Function: `app/services/mlm.service.ts:1248-1401`
- Script: `scripts/distribute-daily-roi.js`

---

## Overview

The ROI (Return on Investment) distribution system automatically distributes daily returns to users who have purchased active investment packages.

### How It Works:

1. **Daily Calculation:** Each active package earns `amount * (roi_percentage / 100)` per day
2. **Duration Tracking:** Packages run for a specified `duration_days` (e.g., 365 days)
3. **Max ROI Cap:** Packages are deactivated when total ROI reaches 300% of investment
4. **Automatic Maturity:** Packages are deactivated after `duration_days` completed
5. **Transaction Records:** All ROI distributions are recorded in `mlm_transactions`

---

## Setup Instructions

### Option 1: Linux/Mac Cron Job (Recommended)

**Step 1: Test the script manually**
```bash
cd /path/to/project
node scripts/distribute-daily-roi.js
```

**Step 2: Set up cron job**
```bash
# Edit crontab
crontab -e

# Add this line to run daily at 00:00 UTC
0 0 * * * cd /path/to/asterdex-8621-main && node scripts/distribute-daily-roi.js >> logs/roi-distribution.log 2>&1
```

**Step 3: Create logs directory**
```bash
mkdir -p /path/to/asterdex-8621-main/logs
```

**Step 4: Verify cron job**
```bash
# List all cron jobs
crontab -l

# Check logs after first run
tail -f /path/to/asterdex-8621-main/logs/roi-distribution.log
```

### Option 2: Windows Task Scheduler

**Step 1: Open Task Scheduler**
- Press `Win + R` and type `taskschd.msc`

**Step 2: Create New Task**
- Click "Create Task" (not "Create Basic Task")
- Name: "Finaster Daily ROI Distribution"
- Description: "Distributes daily ROI to active investment packages"

**Step 3: Configure Trigger**
- Go to "Triggers" tab → Click "New"
- Begin the task: "On a schedule"
- Settings: "Daily" at 00:00
- Repeat: None
- Enabled: ✓

**Step 4: Configure Action**
- Go to "Actions" tab → Click "New"
- Action: "Start a program"
- Program/script: `C:\Program Files\nodejs\node.exe`
- Add arguments: `C:\Projects\asterdex-8621-main\scripts\distribute-daily-roi.js`
- Start in: `C:\Projects\asterdex-8621-main`

**Step 5: Test the Task**
- Right-click the task → "Run"
- Check the "Last Run Result" column

### Option 3: PM2 (Production Server)

If you're using PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
```

**Create `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'roi-distribution',
    script: './scripts/distribute-daily-roi.js',
    instances: 1,
    exec_mode: 'fork',
    cron_restart: '0 0 * * *', // Daily at 00:00
    autorestart: false,
    watch: false
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs roi-distribution

# Check status
pm2 status
```

### Option 4: Supabase Edge Function (Future Enhancement)

For cloud-native deployment, consider implementing as a Supabase Edge Function with pg_cron:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily ROI distribution
SELECT cron.schedule(
  'daily-roi-distribution',
  '0 0 * * *', -- Daily at 00:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/distribute-roi',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )
  $$
);
```

---

## Environment Variables

Make sure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** The script uses `SUPABASE_SERVICE_ROLE_KEY` if available, otherwise falls back to `VITE_SUPABASE_ANON_KEY`.

---

## Monitoring

### Check Distribution Logs

```bash
# View today's distributions
tail -100 logs/roi-distribution.log

# Search for errors
grep "ERROR" logs/roi-distribution.log

# Count successful distributions
grep "✓ Package" logs/roi-distribution.log | wc -l
```

### Database Queries

**Check ROI transactions for today:**
```sql
SELECT
  user_id,
  amount,
  description,
  created_at
FROM mlm_transactions
WHERE transaction_type = 'roi_income'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

**Check total ROI distributed today:**
```sql
SELECT
  COUNT(*) as transaction_count,
  SUM(amount) as total_distributed
FROM mlm_transactions
WHERE transaction_type = 'roi_income'
  AND created_at >= CURRENT_DATE;
```

**Check matured packages:**
```sql
SELECT
  id,
  user_id,
  amount,
  roi_earned,
  purchased_at,
  maturity_date
FROM user_packages
WHERE is_active = FALSE
  AND maturity_date >= CURRENT_DATE
ORDER BY maturity_date DESC;
```

---

## Testing

### Manual Test

```bash
# Run distribution manually
cd /path/to/project
node scripts/distribute-daily-roi.js
```

**Expected Output:**
```
=====================================
Daily ROI Distribution Started: 2025-11-01T00:00:00.000Z
=====================================
Found 15 active packages
  ✓ Package abc123 (User user-1): $5.00 - Day 30/365
  ✓ Package def456 (User user-2): $10.00 - Day 45/365
  ...
  Package xyz789: MATURED (365/365 days) - Deactivating

=====================================
Distribution Summary:
  Processed: 13 packages
  Matured: 2 packages
  Errors: 0 packages
  Total Distributed: $125.50
=====================================
Daily ROI distribution completed successfully at 2025-11-01T00:00:05.123Z
```

### Unit Test (Future)

Create a test file `scripts/test-roi-distribution.js`:

```javascript
const { distributeDailyROI } = require('../app/services/mlm.service');

async function testROI() {
  const result = await distributeDailyROI();
  console.log('Test Result:', result);

  // Assertions
  assert(result.processed >= 0, 'Processed count should be non-negative');
  assert(result.total_amount >= 0, 'Total amount should be non-negative');
  assert(result.errors === 0, 'Should have no errors');
}

testROI();
```

---

## Troubleshooting

### Common Issues

**Issue 1: Script fails with "Missing Supabase credentials"**
- Solution: Ensure `.env` file exists and contains `VITE_SUPABASE_URL` and keys

**Issue 2: Cron job doesn't run**
```bash
# Check cron service is running
sudo service cron status

# Check cron logs
tail -f /var/log/syslog | grep CRON
```

**Issue 3: ROI amounts are zero**
- Check that packages have `roi_percentage` set correctly
- Verify formula: `amount * (roi_percentage / 100)`
- Example: $1000 package with 0.5% daily = $1000 * 0.005 = $5.00/day

**Issue 4: Packages not maturing**
- Check `duration_days` in packages table
- Verify date calculation logic
- Run query: `SELECT NOW(), purchased_at, EXTRACT(DAY FROM NOW() - purchased_at) as days_since FROM user_packages`

---

## Business Logic

### ROI Calculation
```typescript
const dailyRoiAmount = package.amount * (package.roi_percentage / 100);
```

### Maturity Conditions

A package is deactivated when:
1. **Duration Reached:** `days_since_purchase >= duration_days`
2. **Max ROI Reached:** `roi_earned >= (amount * 3)` (300% cap)

### Transaction Metadata

Each ROI distribution creates a transaction with:
```json
{
  "package_id": "pkg_123",
  "user_package_id": "up_456",
  "daily_roi_percentage": 0.5,
  "day_number": 30,
  "total_duration": 365
}
```

---

## Performance Considerations

- **Processing Time:** ~0.5 seconds per package
- **100 packages:** ~50 seconds
- **1000 packages:** ~8 minutes
- **10,000 packages:** ~1.5 hours

**Optimization Recommendations:**
1. Add database indexes on `user_packages.is_active` and `user_packages.purchased_at`
2. Use batch updates instead of individual updates
3. Consider database functions for better performance
4. Add parallel processing for large package counts

---

## Security

- Script uses **service role key** to bypass RLS policies
- Keep service role key secure (never commit to git)
- Add IP whitelisting for production cron server
- Monitor for unusual distribution amounts
- Set up alerts for failed distributions

---

## Next Steps

1. ✅ ROI distribution system implemented
2. ⏳ Set up cron job on production server
3. ⏳ Monitor first week of distributions
4. ⏳ Add email notifications for matured packages
5. ⏳ Create admin dashboard for ROI monitoring

---

**Documentation Last Updated:** 2025-11-01
**Implemented by:** Autonomous Operation - Claude Code
