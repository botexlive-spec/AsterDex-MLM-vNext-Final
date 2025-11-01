# 🚀 Quick Reference Card

## Asterdex MLM + DEX System

---

## 📁 Key Files Locations

```
✅ Database Schemas
- database-schema.sql (Base)
- database-mlm-schema.sql (MLM Extensions)

✅ Services (Business Logic)
- app/services/mlm.service.ts (Core MLM)
- app/services/auth.service.ts (Authentication)
- app/services/admin.service.ts (Admin)
- app/services/referral.service.ts (Referrals)
- app/services/supabase.client.ts (DB Connection)

✅ Types (TypeScript)
- app/types/mlm.types.ts (MLM types + configs)
- app/types/auth.types.ts (Auth types)
- app/types/admin.types.ts (Admin types)
- app/types/referral.types.ts (Referral types)

✅ Components
- app/components/dex/DEXTerminal.tsx (DEX Integration)
- app/pages/user/Dashboard.tsx (Sample Dashboard)

✅ Documentation
- SETUP_GUIDE.md (Setup instructions)
- MLM_IMPLEMENTATION_GUIDE.md (Complete guide)
- PROJECT_SUMMARY.md (Overview)
- QUICK_REFERENCE.md (This file)
```

---

## 🎯 Quick Commands

### Database Setup

```bash
# Cloud Supabase (Recommended)
1. Go to: https://app.supabase.com
2. Create project → SQL Editor
3. Run: database-schema.sql
4. Run: database-mlm-schema.sql
5. Copy API keys to .env
```

### Environment Setup

```bash
# Copy template
cp .env.example .env

# Required variables
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_JWT_SECRET=random_32_char_string
```

---

## 💡 Core Functions Reference

### MLM Service (`mlm.service.ts`)

```typescript
// Check robot subscription
await hasActiveRobotSubscription(userId?)

// Purchase robot ($100)
await purchaseRobotSubscription()

// Get available packages
await getPackages()

// Purchase package
await purchasePackage({
  package_id: 'uuid',
  amount: 1000,
  payment_method: 'wallet'
})

// Get user dashboard data
await getUserDashboard()

// Get binary tree
await getBinaryTree(userId?, depth?)
```

### Auth Service (`auth.service.ts`)

```typescript
// Sign up
await signUp({
  email: 'user@example.com',
  password: 'password123',
  full_name: 'John Doe'
})

// Sign in
await signIn({
  email: 'user@example.com',
  password: 'password123'
})

// Get current user
await getCurrentUser()

// Update profile
await updateProfile({
  full_name: 'New Name',
  wallet_address: '0x...'
})
```

---

## 📊 Business Logic Quick Reference

### Level Income Amounts

| Level | Amount | Requirement |
|-------|--------|-------------|
| L1 | $20 | 1 direct |
| L2 | $10 | 2 directs |
| L3 | $5 | 3 directs |
| L4 | $3 | 4 directs |
| L5-10 | $2 | 1 per level |
| L11-20 | $1 | 11 directs (all) |
| L21-30 | $0.50 | 21 directs (all) |

### Matching Bonus Tiers (Key Ones)

- 25-25 = $125
- 50-50 = $300
- 100-100 = $600
- 1,000-1,000 = $6,000
- 10,000-10,000 = $60,000
- 1,200,000-1,200,000 = $10,000,000
- 2,500,000-2,500,000 = $21,000,000

### Package Tiers

- **Tier 1:** $100-$2,000 → 5-7% ROI
- **Tier 2:** $2,001-$5,000 → 7-9% ROI
- **Tier 3:** $5,000+ → 10-12% ROI

### Investment Distribution

- 60% → Investor's package
- 35% → Leaderboard pool
- 5% → Rewards/salary pool

---

## 🎨 Sample Component Usage

### DEX Terminal

```tsx
import DEXTerminal from '@/components/dex/DEXTerminal';

<DEXTerminal
  symbol="PERP_BTC_USDC"
  fullscreen={false}
  onTradeExecuted={(trade) => {
    console.log('Trade:', trade);
  }}
/>
```

### Dashboard Data Hook

```tsx
import { getUserDashboard } from '@/services/mlm.service';
import { useEffect, useState } from 'react';

const [data, setData] = useState(null);

useEffect(() => {
  getUserDashboard().then(setData);
}, []);
```

---

## 🔍 Database Query Examples

### Get User with MLM Data

```sql
SELECT
  u.*,
  COUNT(DISTINCT r.id) as total_referrals,
  SUM(up.amount) as total_invested,
  bt.left_volume,
  bt.right_volume
FROM users u
LEFT JOIN referrals r ON r.referrer_id = u.id
LEFT JOIN user_packages up ON up.user_id = u.id
LEFT JOIN binary_tree bt ON bt.user_id = u.id
WHERE u.id = 'user_id_here'
GROUP BY u.id, bt.left_volume, bt.right_volume;
```

### Get Level Income Report

```sql
SELECT
  li.level,
  COUNT(*) as transactions,
  SUM(li.amount) as total_earned
FROM level_incomes li
WHERE li.user_id = 'user_id_here'
GROUP BY li.level
ORDER BY li.level;
```

### Check Matching Bonus Eligibility

```sql
SELECT
  user_id,
  left_volume,
  right_volume,
  LEAST(left_volume, right_volume) as qualifying_volume
FROM binary_tree
WHERE user_id = 'user_id_here';
```

---

## 🚨 Common Issues & Solutions

### Issue: "Robot subscription required"
**Solution:** Call `purchaseRobotSubscription()` first

### Issue: "Insufficient balance"
**Solution:** Ensure user has wallet balance before operations

### Issue: "Level not unlocked"
**Solution:** User needs more directs to unlock levels

### Issue: "DEX terminal not loading"
**Solution:** Ensure http://localhost:5173 is running

---

## 📞 Need More Info?

- **Full Setup:** `SETUP_GUIDE.md`
- **Complete API Docs:** `MLM_IMPLEMENTATION_GUIDE.md`
- **Project Overview:** `PROJECT_SUMMARY.md`
- **Current Status:** `IMPLEMENTATION_STATUS.md`

---

## ⚡ Quick Start Checklist

- [ ] Set up Supabase database
- [ ] Configure .env file
- [ ] Test database connection
- [ ] Create auth pages
- [ ] Build user dashboard
- [ ] Integrate DEX
- [ ] Create admin panel
- [ ] Test & deploy

---

**🎉 You have everything you need to build a complete MLM + DEX platform!**
