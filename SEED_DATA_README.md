# MLM Test Data Seed Script

## Overview
This seed script generates **100 realistic users** across **30 levels** in a binary tree structure, complete with packages, transactions, earnings, KYC submissions, and all necessary data to test every feature of the MLM platform.

## Quick Start

### 1. Run the Seed Script
```bash
cd /c/Projects/asterdex-8621-main
node seed-mlm-test-data.js
```

### 2. Expected Output
```
═══════════════════════════════════════════════════════════════
🌱 MLM TEST DATA SEED SCRIPT
═══════════════════════════════════════════════════════════════

📊 Generating 100 users across 30 levels...
✅ Generated 100 users
📦 Generating package purchases...
✅ Generated 200+ package purchases
💰 Generating transactions...
✅ Generated 500+ transactions
💵 Generating earnings records...
✅ Generated 1000+ earnings records
📄 Generating KYC submissions...
✅ Generated 75 KYC submissions

✅ SEED DATA INSERTED SUCCESSFULLY!
```

### 3. Test Credentials
```
Admin Account:
- Email: admin@finaster.com
- Password: password123
- Level: 1 (Root)
- Rank: Crown Diamond
- Balance: $100,000

Level 2 Users:
- Email: level2_1@finaster.com
- Email: level2_2@finaster.com
- Password: password123
- Rank: Diamond
- Balance: $50,000 each

Level 3 Users:
- Email: level3_1@finaster.com
- Email: level3_2@finaster.com
- Email: level3_3@finaster.com
- Email: level3_4@finaster.com
- Password: password123
- Ranks: Platinum/Gold
```

## Data Structure

### User Distribution by Level

| Level | Users | Avg Investment | Robot Active | KYC Approved | Rank Range |
|-------|-------|----------------|--------------|--------------|------------|
| 1 | 1 | $50,000 | 100% | 100% | Crown Diamond |
| 2 | 2 | $10,000 | 100% | 100% | Diamond |
| 3 | 4 | $5,000-10,000 | 75% | 75% | Platinum/Gold |
| 4-10 | 50+ | $100-5,000 | 70% | 50% | Gold/Silver/Bronze |
| 11-20 | 30+ | $100-1,000 | 60% | 40% | Silver/Bronze/Starter |
| 21-30 | 10+ | $100-500 | 50% | 20% | Bronze/Starter |

### Package Distribution

| Package | Price | Daily ROI | Level Depth | Count |
|---------|-------|-----------|-------------|-------|
| Starter | $100 | $1 | 5 levels | ~30 |
| Growth | $500 | $5 | 15 levels | ~80 |
| Premium | $1,000 | $15 | 30 levels | ~90 |
| **Total** | - | - | - | **200+** |

### Transaction Types Generated

| Type | Count | Status Distribution |
|------|-------|---------------------|
| Deposits | 150+ | 80% Completed, 20% Pending |
| Withdrawals | 100+ | 40% Completed, 40% Pending, 20% Rejected |
| Package Purchases | 200+ | 100% Completed |
| Robot Subscriptions | 70+ | 100% Completed |
| Commissions | 500+ | 100% Completed |
| **Total** | **1,000+** | - |

### Earnings Types Generated

| Earning Type | Description | Count |
|--------------|-------------|-------|
| Direct Referral | 10% of direct referral package | 200+ |
| Level Commission | 1-10% per level (30 levels) | 500+ |
| Binary Matching | 10% of weaker leg | 150+ |
| ROI Income | Daily ROI from packages | 300+ |
| Rank Reward | Achievement bonuses | 50+ |
| Booster Income | Extra earnings for active users | 100+ |
| **Total** | - | **1,300+** |

## Test Scenarios Enabled

### ✅ User Panel Testing

#### Dashboard
- [ ] Total balance displays correctly
- [ ] Active investment shown
- [ ] Total earnings calculated
- [ ] Team size (direct + downline) accurate
- [ ] Recent transactions displayed
- [ ] Quick actions work (deposit, withdraw, buy package)

#### Packages Page
- [ ] Available packages listed (Starter, Growth, Premium)
- [ ] Active packages shown with details
- [ ] Package history with status
- [ ] ROI earnings displayed
- [ ] Expiry dates shown
- [ ] Purchase button works (requires robot check)

#### Wallet
- [ ] Current balance accurate
- [ ] Transaction history with filters
- [ ] Deposit form works
- [ ] Withdrawal form works (KYC check for >$50)
- [ ] All transaction types visible

#### KYC Verification
- [ ] KYC status displayed (Approved/Pending/Rejected/Not Submitted)
- [ ] Document upload form
- [ ] Submission confirmation
- [ ] Admin review status

#### Team & Referrals
- [ ] Direct referrals listed
- [ ] Total team count (all 30 levels)
- [ ] Referral link displayed
- [ ] Commission from each referral

#### Genealogy (Binary Tree)
- [ ] Binary tree visualization
- [ ] Left leg volume
- [ ] Right leg volume
- [ ] Spillover indication
- [ ] Carry forward volume

#### Earnings
- [ ] Total earnings breakdown
- [ ] Earnings by type (6 types)
- [ ] Daily/weekly/monthly earnings
- [ ] Earnings history with dates
- [ ] Commission level breakdown (1-30)

#### Ranks
- [ ] Current rank displayed
- [ ] Progress to next rank
- [ ] Requirements checklist
- [ ] Rank benefits listed
- [ ] Achievement history

### ✅ Admin Panel Testing

#### User Management
- [ ] User list with search
- [ ] Filter by status (Active/Suspended/Blocked)
- [ ] Filter by KYC status
- [ ] Filter by rank
- [ ] User details view (all tabs work)
- [ ] Edit user balance
- [ ] Suspend/activate users
- [ ] View user binary tree
- [ ] View user team (30 levels)

#### KYC Management
- [ ] Pending KYC submissions (queue)
- [ ] Document viewer with zoom
- [ ] Approve/reject with notes
- [ ] Request resubmission
- [ ] KYC stats (pending/approved/rejected)
- [ ] History tab

#### Financial Management
- [ ] Pending deposits (with proof images)
- [ ] Approve/reject deposits
- [ ] Pending withdrawals
- [ ] Approve/reject withdrawals (with reason)
- [ ] Withdrawal limits check
- [ ] KYC verification check

#### Package Management
- [ ] Create new package
- [ ] Edit package (price, ROI, level depth)
- [ ] Activate/deactivate packages
- [ ] View package purchases
- [ ] Package analytics

#### Commission Management
- [ ] Configure 30-level commissions
- [ ] Binary matching settings
- [ ] ROI settings per package
- [ ] Rank reward configuration
- [ ] Booster income settings
- [ ] Process pending commissions
- [ ] Commission history

#### Rank Management
- [ ] View all rank achievements
- [ ] Configure rank requirements
- [ ] Distribute rank rewards
- [ ] Rank statistics

#### Binary Tree
- [ ] Global binary tree view
- [ ] User binary tree view
- [ ] Volume calculations
- [ ] Spillover tracking
- [ ] Matching bonus history

#### Reports
- [ ] User growth (daily/weekly/monthly)
- [ ] Revenue reports
- [ ] Commission payout reports
- [ ] Package sales reports
- [ ] KYC statistics
- [ ] Transaction reports

#### Audit Logs
- [ ] Admin actions logged
- [ ] User actions logged
- [ ] Filters by date/admin/action type
- [ ] Export to CSV/PDF

### ✅ Income Calculation Testing

#### Level Commission (30 Levels)
```sql
-- Test: User with 30 downline should earn from all levels
SELECT
  u.email,
  COUNT(DISTINCT t.id) as total_team,
  COUNT(DISTINCT CASE WHEN level <= 5 THEN t.id END) as within_5_levels,
  COUNT(DISTINCT CASE WHEN level > 5 THEN t.id END) as beyond_5_levels
FROM users u
LEFT JOIN user_tree t ON t.sponsor_id = u.id
WHERE u.robot_active = true
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT t.id) >= 30;
```

#### Binary Matching
```sql
-- Test: Users with left/right leg volume difference
SELECT
  u.email,
  u.left_leg_volume,
  u.right_leg_volume,
  LEAST(u.left_leg_volume, u.right_leg_volume) as matching_volume,
  ABS(u.left_leg_volume - u.right_leg_volume) as carry_forward,
  LEAST(u.left_leg_volume, u.right_leg_volume) * 0.10 as binary_bonus
FROM users u
WHERE u.left_leg_volume > 0 OR u.right_leg_volume > 0
ORDER BY matching_volume DESC
LIMIT 10;
```

#### ROI Calculation
```sql
-- Test: Active packages with daily ROI
SELECT
  u.email,
  COUNT(p.id) as active_packages,
  SUM(p.daily_roi) as total_daily_roi,
  SUM(p.total_earned) as total_earned_to_date,
  SUM(p.price * 2) as max_roi_cap
FROM users u
JOIN user_packages p ON p.user_id = u.id
WHERE p.status = 'active'
GROUP BY u.id, u.email
ORDER BY total_daily_roi DESC;
```

#### Rank Qualification
```sql
-- Test: Users eligible for rank upgrade
SELECT
  u.email,
  u.rank as current_rank,
  COUNT(DISTINCT r.id) as direct_referrals,
  SUM(p.price) as total_investment,
  u.left_leg_volume + u.right_leg_volume as team_volume
FROM users u
LEFT JOIN users r ON r.sponsor_id = u.id
LEFT JOIN user_packages p ON p.user_id = u.id
GROUP BY u.id, u.email, u.rank, u.left_leg_volume, u.right_leg_volume
HAVING COUNT(DISTINCT r.id) >= 5
ORDER BY team_volume DESC;
```

### ✅ Edge Cases & Scenarios

#### Scenario 1: User Without Robot (5-level limit)
```
User: user50@finaster.com
Robot: Inactive
Expected: Earns commission only from levels 1-5
Test: Verify no earnings from levels 6-30
```

#### Scenario 2: Expired Package
```
User: Has multiple packages, one expired
Expected: ROI only from active packages
Test: Verify expired package ROI = 0
```

#### Scenario 3: Withdrawal Without KYC
```
User: KYC not approved
Withdrawal: >$50
Expected: Withdrawal blocked
Test: Verify error message shown
```

#### Scenario 4: Binary Spillover
```
User: Left leg full
New referral: Should go to right leg or spillover
Expected: Automatic placement in available position
Test: Verify binary_position updated correctly
```

#### Scenario 5: Rank Achievement
```
User: Meets all requirements for next rank
Expected: Rank reward distributed automatically
Test: Verify transaction + balance update
```

#### Scenario 6: Carry Forward Volume
```
User: Left = 150,000, Right = 100,000
Matching: 100,000
Carry Forward: 50,000 (to next cycle)
Expected: Binary bonus = 10,000 (10% of 100,000)
Test: Verify carry forward saved
```

## Validation Queries

### 1. Verify User Count by Level
```sql
SELECT level, COUNT(*) as user_count
FROM users
GROUP BY level
ORDER BY level;
```

### 2. Verify Package Distribution
```sql
SELECT package_name, COUNT(*) as count, SUM(price) as total_value
FROM user_packages
GROUP BY package_name;
```

### 3. Verify Transaction Types
```sql
SELECT transaction_type, status, COUNT(*) as count, SUM(amount) as total
FROM mlm_transactions
GROUP BY transaction_type, status
ORDER BY transaction_type, status;
```

### 4. Verify KYC Status Distribution
```sql
SELECT kyc_status, COUNT(*) as count
FROM users
GROUP BY kyc_status
ORDER BY count DESC;
```

### 5. Verify Robot Subscription Rate
```sql
SELECT
  COUNT(CASE WHEN robot_active = true THEN 1 END) as with_robot,
  COUNT(CASE WHEN robot_active = false THEN 1 END) as without_robot,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN robot_active = true THEN 1 END)::numeric / COUNT(*) * 100, 2) as robot_percentage
FROM users;
```

### 6. Verify Earnings by Type
```sql
SELECT type, COUNT(*) as count, SUM(amount) as total_amount
FROM earnings
GROUP BY type
ORDER BY total_amount DESC;
```

### 7. Verify Binary Tree Balance
```sql
SELECT
  u.email,
  u.left_leg_volume,
  u.right_leg_volume,
  ABS(u.left_leg_volume - u.right_leg_volume) as imbalance,
  CASE
    WHEN u.left_leg_volume > u.right_leg_volume THEN 'Left Heavy'
    WHEN u.right_leg_volume > u.left_leg_volume THEN 'Right Heavy'
    ELSE 'Balanced'
  END as tree_balance
FROM users u
WHERE u.left_leg_volume > 0 OR u.right_leg_volume > 0
ORDER BY imbalance DESC
LIMIT 20;
```

### 8. Verify Wallet Balances
```sql
SELECT
  u.email,
  w.available_balance,
  w.total_balance,
  COUNT(p.id) as active_packages,
  COUNT(t.id) as total_transactions
FROM users u
LEFT JOIN wallets w ON w.user_id = u.id
LEFT JOIN user_packages p ON p.user_id = u.id AND p.status = 'active'
LEFT JOIN mlm_transactions t ON t.user_id = u.id
GROUP BY u.id, u.email, w.available_balance, w.total_balance
ORDER BY w.total_balance DESC
LIMIT 20;
```

## Data Cleanup (Reset)

If you need to reset and regenerate data:

```sql
-- WARNING: This will delete all test data!

-- Delete in reverse order to respect foreign keys
DELETE FROM earnings;
DELETE FROM mlm_transactions;
DELETE FROM kyc_documents;
DELETE FROM user_packages;
DELETE FROM wallets;
DELETE FROM users WHERE email LIKE '%@finaster.com';
DELETE FROM auth.users WHERE email LIKE '%@finaster.com';

-- Verify cleanup
SELECT 'users' as table_name, COUNT(*) as remaining FROM users
UNION ALL
SELECT 'packages', COUNT(*) FROM user_packages
UNION ALL
SELECT 'transactions', COUNT(*) FROM mlm_transactions
UNION ALL
SELECT 'earnings', COUNT(*) FROM earnings
UNION ALL
SELECT 'kyc_documents', COUNT(*) FROM kyc_documents;
```

Then run the seed script again:
```bash
node seed-mlm-test-data.js
```

## Test Checklist

### Core Features
- [ ] User registration with referral link
- [ ] User login/logout
- [ ] Dashboard displays correct data
- [ ] Package purchase (Robot check)
- [ ] Robot subscription purchase
- [ ] KYC document upload
- [ ] Deposit request
- [ ] Withdrawal request (KYC + balance check)
- [ ] Binary tree placement
- [ ] Commission calculations (all 6 types)

### Admin Features
- [ ] User management (view/edit/suspend)
- [ ] KYC approval/rejection
- [ ] Deposit approval
- [ ] Withdrawal approval/rejection
- [ ] Package management
- [ ] Commission configuration
- [ ] Rank configuration
- [ ] Binary tree view
- [ ] Reports generation
- [ ] Audit logs

### Edge Cases
- [ ] Robot inactive (5-level limit)
- [ ] KYC not approved (withdrawal block)
- [ ] Insufficient balance (transaction fail)
- [ ] Expired package (no ROI)
- [ ] Binary spillover
- [ ] Rank achievement
- [ ] Carry forward volume
- [ ] Multiple packages (ROI accumulation)

### Performance
- [ ] 30-level commission calculation speed
- [ ] Binary tree rendering (100+ users)
- [ ] Transaction history pagination
- [ ] Team view pagination
- [ ] Report generation time

## Support

For issues or questions:
1. Check console output for errors
2. Verify database connection
3. Check RLS policies are configured
4. Ensure is_admin() function exists
5. Verify all tables exist

## Notes

- All passwords are set to: `password123` (hashed)
- Binary tree structure is realistic but simplified
- Volumes are calculated but may need adjustment based on actual formula
- Earnings records are generated but actual commission calculation should be tested
- KYC documents use placeholder URLs (update for production testing)

## Next Steps

1. Run the seed script
2. Login as admin (admin@finaster.com)
3. Explore all admin features
4. Login as regular users (level2_1@finaster.com, etc.)
5. Test all user panel features
6. Verify calculations match expected results
7. Test edge cases from checklist

---

**Generated Test Data Summary:**
- 100 Users across 30 levels
- 200+ Package purchases
- 1,000+ Transactions (all types)
- 1,300+ Earnings records (6 types)
- 75 KYC submissions (various statuses)
- Binary tree with realistic volumes
- Wallet balances ranging from $100 to $100,000

**Ready for comprehensive testing!** 🚀
