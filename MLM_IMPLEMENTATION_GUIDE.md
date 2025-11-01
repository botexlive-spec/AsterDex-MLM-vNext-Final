# 🚀 Asterdex DEX - Complete MLM Implementation Guide

## Multi-Level Marketing System with DEX Integration

**Version:** 1.0.0
**Date:** 2025-10-30
**Status:** Backend Complete | UI Pending

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Business Logic Mapping](#business-logic-mapping)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [User Dashboard Menus](#user-dashboard-menus)
6. [Admin Panel Menus](#admin-panel-menus)
7. [DEX Integration](#dex-integration)
8. [Income Calculations](#income-calculations)
9. [Implementation Checklist](#implementation-checklist)

---

## 1. System Overview

### Core Features

✅ **Multi-Level Marketing System**
- 30-level deep referral system
- Binary tree structure for matching bonuses
- Robot subscription ($100/month mandatory)
- 3-tier package system ($100-$2000+)
- Multiple income streams (7 types)

✅ **DEX Integration**
- Embedded DEX trading (http://localhost:5173/perp/PERP_BTC_USDC)
- All financial operations through DEX
- Real-time trade tracking
- Automated commission distribution

✅ **User Management**
- Dual role system (User/Admin)
- KYC/AML compliance
- Wallet management
- Transaction history

✅ **Admin Control Panel**
- Complete user oversight
- Financial management
- MLM tree explorer
- System configuration

---

## 2. Business Logic Mapping

### 2.1 Robot Subscription

**Business Requirement:**
> Mandatory $100 subscription for every account before any MLM earnings

**Implementation:**
- **Database:** `robot_subscriptions` table
- **Function:** `purchaseRobotSubscription()`
- **Validation:** `hasActiveRobotSubscription()`
- **Auto-renewal:** Optional, configurable per user
- **Expiry:** 30 days from purchase
- **Renewal Alert:** 7 days before expiry

**Code Location:** `app/services/mlm.service.ts:17-82`

**Logic Flow:**
```typescript
1. Check user wallet balance >= $100
2. Calculate expiry date (current + 30 days)
3. Deduct $100 from wallet
4. Create robot_subscription record
5. Update user.robot_subscription_active = true
6. Create transaction record
7. Send notification
```

---

### 2.2 Package Investment Tiers

**Business Requirement:**
> Three investment tiers with varying ROI percentages

**Implementation:**

| Tier | Amount Range | ROI Range | Code Reference |
|------|-------------|-----------|----------------|
| Tier 1 | $100-$2,000 | 5-7% | `packages` table row 1 |
| Tier 2 | $2,001-$5,000 | 7-9% | `packages` table row 2 |
| Tier 3 | $5,000+ | 10-12% | `packages` table row 3 |

**ROI Calculation Logic:**
```typescript
// Dynamic ROI based on exact investment amount
roiPercentage = minROI + (
  (maxROI - minROI) *
  (investmentAmount - minAmount) /
  (maxAmount - minAmount)
)
```

**Code Location:** `app/services/mlm.service.ts:122-273`

**Process Flow:**
```
1. Validate robot subscription active
2. Check package tier and amount
3. Calculate dynamic ROI percentage
4. Deduct from wallet
5. Create user_package record
6. Update user.total_investment
7. Trigger processLevelIncome()
8. Update binary tree volumes
9. Check matching bonuses
10. Create transaction record
```

---

### 2.3 Level Income Distribution

**Business Requirement:**
> Direct income across 30 levels with specific amounts per level

**Implementation:**

#### Level Income Structure:

| Levels | Amount | Unlock Requirement |
|--------|--------|-------------------|
| L1 | $20 | 1 direct referral |
| L2 | $10 | 2 direct referrals |
| L3 | $5 | 3 direct referrals |
| L4 | $3 | 4 direct referrals |
| L5-L10 | $2 each | 1 direct per level |
| L11-L20 | $1 each | 11 direct referrals unlock all |
| L21-L30 | $0.50 each | 21 direct referrals unlock all |

**Level Unlocking Logic:**
```typescript
function unlockLevels(directCount: number): number {
  if (directCount >= 1 && directCount <= 4) return directCount;
  if (directCount >= 5 && directCount <= 7) return 4 + (directCount - 4);
  if (directCount >= 8 && directCount <= 10) return 7 + (directCount - 7);
  if (directCount >= 11 && directCount <= 20) return 20;
  if (directCount >= 21) return 30;
  return 0;
}
```

**Code Location:**
- Config: `app/types/mlm.types.ts:207-238`
- Logic: `app/services/mlm.service.ts:280-365`

**Income Distribution Process:**
```
1. User purchases package ($X)
2. System traverses upline (sponsor_id chain)
3. For each level (1-30):
   a. Check if upline has level unlocked
   b. If yes, credit fixed amount (per table above)
   c. Update wallet_balance
   d. Create level_income record
   e. Create mlm_transaction
4. Continue until level 30 or no more upline
```

---

### 2.4 Binary Tree & Matching Bonuses

**Business Requirement:**
> Bot match rewards for achieving X-X structure on both legs

**Implementation:**

#### Binary Tree Structure:
- Each user can have max 2 direct placements (left/right)
- All additional referrals spillover down the tree
- Volume tracked separately for each leg
- Matching triggered when both legs reach threshold

#### Matching Bonus Tiers:

| Left Volume | Right Volume | Bonus Amount |
|-------------|--------------|--------------|
| 25 | 25 | $125 |
| 50 | 50 | $300 |
| 100 | 100 | $600 |
| 150 | 150 | $900 |
| 300 | 300 | $1,800 |
| 500 | 500 | $3,000 |
| 1,000 | 1,000 | $6,000 |
| 2,500 | 2,500 | $15,000 |
| 5,000 | 5,000 | $30,000 |
| 10,000 | 10,000 | $60,000 |
| 25,000 | 25,000 | $150,000 |
| 50,000 | 50,000 | $300,000 |
| 100,000 | 100,000 | $600,000 |
| 250,000 | 250,000 | $1,500,000 |
| 500,000 | 500,000 | $3,000,000 |
| 1,000,000 | 1,000,000 | $6,000,000 |
| 1,200,000 | 1,200,000 | $10,000,000 |
| 2,500,000 | 2,500,000 | $21,000,000 |

**Code Location:**
- Config: `app/types/mlm.types.ts:287-306`
- Logic: `app/services/mlm.service.ts:405-484`

**Matching Bonus Process:**
```
1. Investment triggers volume update
2. System updates left_volume and right_volume up the tree
3. For each node:
   a. Calculate min(left_volume, right_volume)
   b. Check against MATCHING_BONUS_TIERS
   c. Find highest qualifying tier not yet awarded
   d. Credit bonus amount
   e. Create matching_bonuses record
   f. Create mlm_transaction
4. One-time bonus per tier (no repetition)
```

---

### 2.5 Booster Income (30-Day)

**Business Requirement:**
> Special payout for 2 direct referrals of same or higher package in 30 days

**Implementation:**

**Logic:**
```typescript
// Check every new direct referral
if (user.directsInLast30Days === 2) {
  const direct1Package = getPackageAmount(direct1);
  const direct2Package = getPackageAmount(direct2);
  const userPackage = getUserPackageAmount(user);

  if (direct1Package >= userPackage && direct2Package >= userPackage) {
    awardBoosterIncome(user, calculateBooster(direct1Package, direct2Package));
  }
}
```

**Calculation:**
```
Booster Amount = 5% of (Direct1 Package + Direct2 Package)
```

**Code Location:** `booster_incomes` table

---

### 2.6 ROI on ROI (Referral ROI)

**Business Requirement:**
> Earn percentage of downline's ROI earnings across 30 levels

**Implementation:**

| Level | ROI Percentage | Unlock Requirement |
|-------|----------------|-------------------|
| L1 | 10% | Active package + level unlocked |
| L2 | 5% | Active package + level unlocked |
| L3 | 4% | Active package + level unlocked |
| L4 | 3% | Active package + level unlocked |
| L5-L10 | 1% each | Active package + level unlocked |
| L11-L20 | 0.5% each | Active package + level unlocked |
| L21-L30 | 0.2% each | Active package + level unlocked |

**Code Location:** `app/types/mlm.types.ts:342-373`

**Process:**
```
1. Daily ROI credited to package holders
2. For each ROI credit:
   a. Traverse upline 30 levels
   b. For each level, if unlocked:
      - Calculate ROI percentage
      - Credit ROI-on-ROI amount
      - Create level_income record (type: roi_income)
   c. Create mlm_transaction
```

---

### 2.7 Rank Rewards

**Business Requirement:**
> Achieve ranks based on total volume, earn one-time rewards
> 50% volume must come from weaker leg, 50% from power leg

**Implementation:**

#### Rank Structure:

| Rank | Min Volume | Reward | Qualification |
|------|-----------|--------|---------------|
| Starter | $0 | $0 | Entry level |
| Bronze | $25,000 | $125 | 50/50 leg split |
| Silver | $50,000 | $250 | 50/50 leg split |
| Gold | $100,000 | $500 | 50/50 leg split |
| Platinum | $250,000 | $1,250 | 50/50 leg split |
| Diamond | $500,000 | $2,500 | 50/50 leg split |
| Double Diamond | $1,000,000 | $5,000 | 50/50 leg split |
| Triple Diamond | $2,500,000 | $12,500 | 50/50 leg split |
| Crown | $5,000,000 | $25,000 | 50/50 leg split |
| Crown Ambassador | $10,000,000 | $50,000 | 50/50 leg split |

**Qualification Logic:**
```typescript
function qualifiesForRank(user: User, rank: Rank): boolean {
  const totalVolume = user.left_volume + user.right_volume;
  const weakerLeg = Math.min(user.left_volume, user.right_volume);
  const powerLeg = Math.max(user.left_volume, user.right_volume);

  // Check total volume
  if (totalVolume < rank.min_volume) return false;

  // Check 50/50 split requirement
  const weakerPercentage = (weakerLeg / totalVolume) * 100;
  if (weakerPercentage < 50) return false;

  return true;
}
```

**Code Location:** `app/types/mlm.types.ts:312-339`

---

## 3. Database Schema

### Complete Table Structure

#### Core Tables (18 total):

1. **users** - Extended with MLM fields
2. **packages** - Investment package definitions
3. **user_packages** - User's purchased packages
4. **robot_subscriptions** - Mandatory robot subscriptions
5. **mlm_transactions** - All financial transactions
6. **binary_tree** - Binary placement structure
7. **level_incomes** - Level-by-level income tracking
8. **matching_bonuses** - Binary matching bonuses
9. **rank_achievements** - Rank progression
10. **booster_incomes** - 30-day booster rewards
11. **kyc_documents** - KYC verification
12. **withdrawals** - Withdrawal requests
13. **deposits** - Deposit tracking
14. **dex_trades** - DEX trade history
15. **notifications** - System notifications
16. **system_settings** - Configuration
17. **referrals** - From base schema
18. **referral_codes** - From base schema

### Key Relationships:

```
users (1) ─────> (N) user_packages
users (1) ─────> (N) robot_subscriptions
users (1) ─────> (N) mlm_transactions
users (1) ─────> (1) binary_tree (self-referencing)
users (1) ─────> (N) level_incomes
users (sponsor_id) ─────> (N) users (downline)
```

### Database File Location:
`C:/Projects/asterdex-8621-main/database-mlm-schema.sql`

---

## 4. API Endpoints

### 4.1 Authentication APIs

**Base:** `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/me` | Get current user | Yes |
| PUT | `/profile` | Update profile | Yes |
| POST | `/change-password` | Change password | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |

**Service:** `app/services/auth.service.ts`

---

### 4.2 MLM Core APIs

**Base:** `/api/mlm`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Get complete dashboard data | Yes |
| GET | `/packages` | List available packages | Yes |
| POST | `/packages/purchase` | Purchase investment package | Yes |
| GET | `/packages/my` | Get user's packages | Yes |
| GET | `/robot/status` | Check robot subscription | Yes |
| POST | `/robot/purchase` | Purchase robot subscription | Yes |
| GET | `/tree` | Get binary tree | Yes |
| GET | `/tree/:userId` | Get specific user tree | Yes (Admin) |
| GET | `/income/levels` | Get level income history | Yes |
| GET | `/income/matching` | Get matching bonuses | Yes |
| GET | `/income/booster` | Get booster income | Yes |
| GET | `/transactions` | Get transaction history | Yes |

**Service:** `app/services/mlm.service.ts`

---

### 4.3 Financial APIs

**Base:** `/api/financial`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/withdraw` | Request withdrawal | Yes (KYC) |
| GET | `/withdraw/history` | Get withdrawal history | Yes |
| POST | `/deposit` | Initiate deposit | Yes |
| GET | `/deposit/history` | Get deposit history | Yes |
| GET | `/balance` | Get wallet balance | Yes |
| GET | `/transactions` | All financial transactions | Yes |

---

### 4.4 KYC APIs

**Base:** `/api/kyc`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/submit` | Submit KYC documents | Yes |
| GET | `/status` | Get KYC status | Yes |
| GET | `/document/:id` | Get document details | Yes (Admin) |
| PUT | `/approve/:id` | Approve KYC | Yes (Admin) |
| PUT | `/reject/:id` | Reject KYC | Yes (Admin) |

---

### 4.5 DEX Integration APIs

**Base:** `/api/dex`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/embed-url` | Get DEX embed URL | Yes |
| POST | `/trade` | Execute trade | Yes |
| GET | `/trades` | Get trade history | Yes |
| GET | `/markets` | Get available markets | Yes |
| GET | `/portfolio` | Get DEX portfolio | Yes |

---

### 4.6 Admin APIs

**Base:** `/api/admin`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Admin dashboard stats | Yes (Admin) |
| GET | `/users` | List all users | Yes (Admin) |
| GET | `/users/:id` | Get user details | Yes (Admin) |
| PUT | `/users/:id` | Update user | Yes (Admin) |
| DELETE | `/users/:id` | Delete user | Yes (Admin) |
| GET | `/kyc/pending` | Pending KYC reviews | Yes (Admin) |
| GET | `/withdrawals/pending` | Pending withdrawals | Yes (Admin) |
| PUT | `/withdrawals/:id/approve` | Approve withdrawal | Yes (Admin) |
| PUT | `/withdrawals/:id/reject` | Reject withdrawal | Yes (Admin) |
| GET | `/transactions` | All transactions | Yes (Admin) |
| GET | `/tree/:userId` | View any user's tree | Yes (Admin) |
| PUT | `/settings` | Update system settings | Yes (Admin) |
| GET | `/reports/revenue` | Revenue reports | Yes (Admin) |
| GET | `/reports/users` | User reports | Yes (Admin) |

---

## 5. User Dashboard Menus

### Main Navigation Structure

```
📊 DASHBOARD (default home)
├─ Overview Stats
├─ Quick Actions
├─ Recent Activity
└─ Notifications

💼 MY BUSINESS
├─ Team Overview
│  ├─ Direct Referrals
│  ├─ Total Team Size
│  └─ Team Performance
├─ Binary Tree
│  ├─ Tree Visualization
│  ├─ Left Leg Stats
│  └─ Right Leg Stats
├─ Referral Tools
│  ├─ My Referral Link
│  ├─ Referral Codes
│  └─ Share Tools
└─ Income Reports
   ├─ Level Income
   ├─ Matching Bonuses
   ├─ Booster Income
   ├─ ROI Income
   └─ Rank Rewards

💰 INVESTMENTS
├─ Active Packages
│  ├─ Package Details
│  ├─ ROI Tracker
│  └─ Performance
├─ Purchase Package
│  ├─ Available Packages
│  ├─ Package Comparison
│  └─ Checkout
└─ Investment History
   ├─ All Investments
   └─ ROI Earnings

🤖 ROBOT SUBSCRIPTION
├─ Current Status
│  ├─ Expiry Date
│  ├─ Auto-Renewal
│  └─ Benefits
├─ Renew Subscription
└─ Subscription History

💳 WALLET
├─ Balance Overview
│  ├─ Available Balance
│  ├─ Locked Balance
│  └─ Total Earnings
├─ Deposit
│  ├─ Deposit Methods
│  ├─ Deposit History
│  └─ Pending Deposits
├─ Withdraw
│  ├─ Withdrawal Form
│  ├─ Withdrawal History
│  └─ Pending Withdrawals
└─ Transaction History
   ├─ All Transactions
   ├─ Filter & Search
   └─ Export

📈 DEX TRADING
├─ Trading Terminal
│  ├─ Live Charts
│  ├─ Order Book
│  ├─ Place Orders
│  └─ Open Positions
├─ Portfolio
│  ├─ Assets
│  ├─ Performance
│  └─ P&L
├─ Markets
│  ├─ Market Overview
│  ├─ Watchlist
│  └─ Price Alerts
└─ Trade History
   ├─ Completed Trades
   ├─ Trade Analytics
   └─ Export

🏆 RANKS & REWARDS
├─ Current Rank
│  ├─ Rank Details
│  ├─ Benefits
│  └─ Achievement Date
├─ Next Rank
│  ├─ Requirements
│  ├─ Progress Bar
│  └─ Volume Needed
├─ Rank History
└─ Rewards Claimed

📄 KYC / VERIFICATION
├─ Verification Status
├─ Submit Documents
│  ├─ ID Proof
│  ├─ Address Proof
│  └─ Selfie
├─ Verification History
└─ KYC Requirements

👤 PROFILE
├─ Personal Info
│  ├─ Edit Profile
│  ├─ Contact Details
│  └─ Avatar
├─ Security
│  ├─ Change Password
│  ├─ 2FA Settings
│  └─ Login History
└─ Preferences
   ├─ Notifications
   ├─ Language
   └─ Theme (Dark/Light)

📞 SUPPORT
├─ Help Center
│  ├─ FAQs
│  ├─ Tutorials
│  └─ Video Guides
├─ Submit Ticket
│  ├─ New Ticket
│  └─ My Tickets
└─ Live Chat
   └─ Chat Widget
```

---

## 6. Admin Panel Menus

### Admin Navigation Structure

```
🎛️ ADMIN DASHBOARD
├─ System Overview
│  ├─ Total Users
│  ├─ Active Users
│  ├─ Total Investment
│  ├─ Total Payouts
│  └─ System Health
├─ Recent Activity
├─ Pending Actions
│  ├─ KYC Reviews (count)
│  ├─ Withdrawals (count)
│  └─ Support Tickets (count)
└─ Quick Stats

👥 USER MANAGEMENT
├─ All Users
│  ├─ User List (paginated)
│  ├─ Search & Filter
│  ├─ Sort Options
│  └─ Export
├─ User Details
│  ├─ Profile Info
│  ├─ Investment Summary
│  ├─ Team Structure
│  ├─ Earnings Breakdown
│  └─ Transaction History
├─ Edit User
│  ├─ Update Profile
│  ├─ Change Role
│  ├─ Activate/Deactivate
│  └─ Reset Password
├─ User Tree
│  ├─ Binary Tree View
│  ├─ Referral Tree View
│  └─ Export Tree
└─ Bulk Actions
   ├─ Bulk Update
   ├─ Bulk Delete
   └─ Bulk Export

📦 PACKAGE MANAGEMENT
├─ All Packages
│  ├─ Package List
│  ├─ Active/Inactive
│  └─ Package Stats
├─ Create Package
│  ├─ Package Form
│  ├─ Tier Selection
│  ├─ ROI Setup
│  └─ Benefits
├─ Edit Package
└─ Package Analytics
   ├─ Popular Packages
   ├─ Revenue by Package
   └─ Conversion Rates

💰 FINANCIAL MANAGEMENT
├─ Transactions
│  ├─ All Transactions
│  ├─ Filter by Type
│  ├─ Date Range
│  └─ Export
├─ Withdrawals
│  ├─ Pending Withdrawals
│  ├─ Approve/Reject
│  ├─ Processing
│  └─ Completed
├─ Deposits
│  ├─ Pending Deposits
│  ├─ Confirm Deposit
│  └─ Deposit History
├─ Wallet Management
│  ├─ User Balances
│  ├─ Manual Adjustment
│  └─ Balance Audit
└─ Payouts
   ├─ Scheduled Payouts
   ├─ Payout History
   └─ Payout Reports

🔐 KYC MANAGEMENT
├─ Pending Reviews
│  ├─ New Submissions
│  ├─ Document Preview
│  ├─ Approve/Reject
│  └─ Add Notes
├─ Approved KYC
├─ Rejected KYC
│  ├─ Rejection Reasons
│  └─ Resubmissions
└─ KYC Reports
   ├─ Approval Rate
   ├─ Processing Time
   └─ Export

🌳 MLM TREE EXPLORER
├─ Search User
├─ Tree Visualization
│  ├─ Binary Tree
│  ├─ Referral Tree
│  ├─ 3D View
│  └─ Zoom/Pan
├─ Tree Analytics
│  ├─ Depth Analysis
│  ├─ Volume Distribution
│  └─ Growth Rate
└─ Tree Operations
   ├─ Export Tree Data
   └─ Tree Reports

📊 REPORTS & ANALYTICS
├─ Revenue Reports
│  ├─ Daily Revenue
│  ├─ Monthly Revenue
│  ├─ Revenue by Source
│  └─ Revenue Forecast
├─ User Reports
│  ├─ Signup Trends
│  ├─ User Activity
│  ├─ User Retention
│  └─ Churn Analysis
├─ MLM Reports
│  ├─ Income Distribution
│  ├─ Level Income Report
│  ├─ Matching Bonus Report
│  ├─ Rank Achievement Report
│  └─ Commission Summary
├─ DEX Reports
│  ├─ Trading Volume
│  ├─ Top Traders
│  ├─ Trade Fees
│  └─ Market Performance
└─ Export Options
   ├─ PDF Export
   ├─ Excel Export
   └─ CSV Export

⚙️ SYSTEM SETTINGS
├─ General Settings
│  ├─ Site Name
│  ├─ Logo
│  ├─ Contact Info
│  └─ Social Links
├─ MLM Configuration
│  ├─ Level Income Rates
│  ├─ Matching Bonus Tiers
│  ├─ ROI Rates
│  ├─ Rank Requirements
│  └─ Booster Settings
├─ Financial Settings
│  ├─ Withdrawal Limits
│  ├─ Withdrawal Fees
│  ├─ Deposit Methods
│  └─ Currency Settings
├─ Robot Subscription
│  ├─ Subscription Price
│  ├─ Duration
│  └─ Benefits
├─ DEX Settings
│  ├─ DEX URL
│  ├─ API Keys
│  ├─ Trading Pairs
│  └─ Fee Structure
├─ Email Settings
│  ├─ SMTP Config
│  ├─ Email Templates
│  └─ Notification Rules
└─ Security Settings
   ├─ Password Policy
   ├─ 2FA Settings
   ├─ IP Whitelist
   └─ Session Timeout

🔔 NOTIFICATIONS
├─ Send Notification
│  ├─ Recipient Selection
│  ├─ Message Compose
│  └─ Schedule Send
├─ Notification Templates
│  ├─ Create Template
│  └─ Edit Templates
└─ Notification History
   ├─ Sent Notifications
   └─ Delivery Status

📞 SUPPORT MANAGEMENT
├─ Support Tickets
│  ├─ Open Tickets
│  ├─ Assigned to Me
│  ├─ Closed Tickets
│  └─ Ticket Details
├─ Live Chat
│  ├─ Active Chats
│  ├─ Chat History
│  └─ Chat Settings
└─ FAQ Management
   ├─ Add FAQ
   ├─ Edit FAQ
   └─ Categories

👨‍💼 ADMIN MANAGEMENT
├─ Admin Users
│  ├─ Admin List
│  ├─ Add Admin
│  ├─ Edit Admin
│  └─ Permissions
├─ Roles & Permissions
│  ├─ Create Role
│  ├─ Edit Role
│  └─ Assign Permissions
└─ Activity Logs
   ├─ Admin Actions
   ├─ Login History
   └─ System Changes

🔍 AUDIT LOGS
├─ User Actions
├─ Financial Actions
├─ System Changes
└─ Export Logs
```

---

## 7. DEX Integration

### Integration Strategy

**Current DEX:** http://localhost:5173/perp/PERP_BTC_USDC

### Method 1: Iframe Embed (Recommended)

```typescript
// Component: DEXTradingTerminal.tsx
<iframe
  src="http://localhost:5173/perp/PERP_BTC_USDC"
  width="100%"
  height="800px"
  frameBorder="0"
  allow="clipboard-read; clipboard-write"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
/>
```

### Method 2: PostMessage Communication

```typescript
// Parent window (your app)
const dexWindow = window.open('http://localhost:5173/perp/PERP_BTC_USDC');

// Send trade command
dexWindow.postMessage({
  action: 'executeTrade',
  data: {
    symbol: 'PERP_BTC_USDC',
    type: 'market',
    side: 'buy',
    amount: 0.1
  }
}, 'http://localhost:5173');

// Listen for trade confirmations
window.addEventListener('message', (event) => {
  if (event.origin === 'http://localhost:5173') {
    if (event.data.type === 'tradeExecuted') {
      recordTradeInDatabase(event.data.trade);
    }
  }
});
```

### Method 3: Direct API Integration

If DEX provides API:

```typescript
// services/dex-api.service.ts
export const executeDEXTrade = async (tradeData: any) => {
  const response = await fetch('http://localhost:5173/api/trades', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(tradeData)
  });

  const trade = await response.json();

  // Record in MLM database
  await recordDEXTrade(trade);

  return trade;
};
```

### DEX Trade Recording

**Every DEX trade must be recorded:**

```typescript
// After successful trade
await supabase.from('dex_trades').insert({
  user_id: userId,
  trade_type: 'buy',
  symbol: 'PERP_BTC_USDC',
  amount: 0.1,
  price: 45000,
  total_value: 4500,
  fee: 13.5,
  status: 'completed',
  trade_data: tradeResponse
});

// Update wallet balance if needed
await supabase.from('users').update({
  wallet_balance: newBalance
}).eq('id', userId);
```

---

## 8. Income Calculations

### 8.1 Direct Income Formula

```typescript
// For each package purchase by downline
function calculateDirectIncome(
  level: number,
  amount: number,
  uplineUnlocked: number
): number {
  if (level > uplineUnlocked) return 0;

  const rates = {
    1: 20, 2: 10, 3: 5, 4: 3,
    '5-10': 2,
    '11-20': 1,
    '21-30': 0.5
  };

  if (level <= 4) return rates[level];
  if (level <= 10) return rates['5-10'];
  if (level <= 20) return rates['11-20'];
  if (level <= 30) return rates['21-30'];

  return 0;
}
```

### 8.2 ROI Calculation

```typescript
// Daily ROI credit
function calculateDailyROI(
  packageAmount: number,
  roiPercentage: number,
  daysActive: number
): number {
  const totalROI = (packageAmount * roiPercentage) / 100;
  const dailyROI = totalROI / 365;

  return dailyROI;
}

// Cap: ROI stops when total_roi_earned >= package_amount
```

### 8.3 Matching Bonus Calculation

```typescript
function calculateMatchingBonus(
  leftVolume: number,
  rightVolume: number
): number {
  const minVolume = Math.min(leftVolume, rightVolume);

  // Find highest qualifying tier
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const tier = TIERS[i];
    if (minVolume >= tier.matches) {
      // Check if already awarded
      if (!hasReceivedBonus(tier)) {
        return tier.bonusAmount;
      }
    }
  }

  return 0;
}
```

### 8.4 Rank Reward Calculation

```typescript
function calculateRankReward(user: User): number {
  const totalVolume = user.left_volume + user.right_volume;
  const weakerLeg = Math.min(user.left_volume, user.right_volume);

  // Check 50/50 rule
  if ((weakerLeg / totalVolume) < 0.5) {
    return 0; // Doesn't qualify
  }

  // Find qualifying rank
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const rank = RANKS[i];
    if (totalVolume >= rank.min_volume && !hasAchievedRank(rank)) {
      return rank.reward_amount;
    }
  }

  return 0;
}
```

### 8.5 Investment Distribution

```typescript
// On package purchase
function distributeInvestment(amount: number) {
  const splits = {
    investor: amount * 0.60,        // 60% to user's package
    leaderboard: amount * 0.35,     // 35% to top performers pool
    rewards: amount * 0.05          // 5% to rewards/salary pool
  };

  return splits;
}
```

---

## 9. Implementation Checklist

### Phase 1: Database Setup ✅

- [x] Run `database-schema.sql` (base auth/referral)
- [x] Run `database-mlm-schema.sql` (MLM extensions)
- [ ] Insert default packages
- [ ] Insert system settings
- [ ] Create indexes
- [ ] Test database functions

### Phase 2: Backend Services ✅

- [x] Auth service (`auth.service.ts`)
- [x] MLM service (`mlm.service.ts`)
- [x] Admin service (`admin.service.ts`)
- [x] Referral service (`referral.service.ts`)
- [ ] Withdrawal service
- [ ] KYC service
- [ ] DEX integration service
- [ ] Notification service

### Phase 3: User Dashboard UI

- [ ] Dashboard overview page
- [ ] Business section (team, tree, income)
- [ ] Investment section (packages, ROI)
- [ ] Robot subscription page
- [ ] Wallet section (deposit, withdraw)
- [ ] DEX trading terminal
- [ ] Ranks & rewards page
- [ ] KYC submission page
- [ ] Profile & settings

### Phase 4: Admin Panel UI

- [ ] Admin dashboard
- [ ] User management
- [ ] Package management
- [ ] Financial management
- [ ] KYC review system
- [ ] Tree explorer
- [ ] Reports & analytics
- [ ] System settings
- [ ] Support management

### Phase 5: DEX Integration

- [ ] Iframe embed implementation
- [ ] PostMessage communication
- [ ] Trade recording system
- [ ] Balance synchronization
- [ ] Fee calculation
- [ ] Trade history display

### Phase 6: Testing

- [ ] Unit tests for business logic
- [ ] Integration tests for APIs
- [ ] E2E tests for user flows
- [ ] Load testing
- [ ] Security testing

### Phase 7: Deployment

- [ ] Environment configuration
- [ ] Database migration
- [ ] API deployment
- [ ] Frontend deployment
- [ ] Monitoring setup
- [ ] Backup system

---

## 📝 Next Steps

1. **Set up Supabase database**
   - Follow `SETUP_GUIDE.md`
   - Run both SQL schema files

2. **Create remaining services**
   - Withdrawal/deposit service
   - KYC service
   - DEX integration service

3. **Build user dashboard**
   - Start with overview page
   - Add business section
   - Integrate DEX terminal

4. **Build admin panel**
   - Dashboard with stats
   - User management
   - Financial controls

5. **Test end-to-end**
   - Register → Robot → Package → Referral → Income flow
   - Admin approval flows
   - DEX trading integration

---

## 📚 Documentation Files

- `SETUP_GUIDE.md` - Backend setup instructions
- `DATABASE_COMPARISON.md` - Database selection rationale
- `FEATURE_DEVELOPMENT_PLAN.md` - Original feature plan
- `IMPLEMENTATION_STATUS.md` - Current progress
- `MLM_IMPLEMENTATION_GUIDE.md` - This document

---

**Status:** Backend infrastructure complete, ready for UI implementation.

**Estimated completion time for full UI:** 40-60 hours

**Priority:** User Dashboard → DEX Integration → Admin Panel → Testing
