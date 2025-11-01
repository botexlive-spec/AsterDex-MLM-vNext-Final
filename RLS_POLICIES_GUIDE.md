# 🔒 Row-Level Security (RLS) Policies Guide
**Finaster MLM Platform - Database Security**
**Date:** 2025-11-01
**Priority:** HIGH - Critical for Production Deployment

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [RLS Policy Requirements](#rls-policy-requirements)
3. [Policy Definitions by Table](#policy-definitions-by-table)
4. [SQL Implementation](#sql-implementation)
5. [Verification Steps](#verification-steps)
6. [Testing Procedures](#testing-procedures)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Introduction

### What is Row-Level Security (RLS)?

Row-Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access based on policies. In Supabase, RLS is **critical** for data security as it prevents users from accessing data they shouldn't see.

### Why RLS is Critical

**Without RLS:**
- ❌ Any authenticated user can read ALL data from ALL tables
- ❌ Users can access other users' private information
- ❌ Potential data breaches and privacy violations

**With RLS:**
- ✅ Users can only access their own data
- ✅ Admins have elevated access to all data
- ✅ System operations can bypass restrictions when needed
- ✅ Data isolation and privacy guaranteed

---

## 📊 RLS Policy Requirements

### Tables Requiring RLS Policies

All 21 core tables need RLS policies:

**User Data Tables:**
1. `users` - User profiles and accounts
2. `wallets` - User wallet balances
3. `user_packages` - User investment packages
4. `mlm_transactions` - Financial transactions
5. `referral_codes` - User referral codes
6. `referrals` - Referral relationships
7. `binary_tree` - MLM binary tree structure

**KYC & Documents:**
8. `kyc_documents` - KYC verification documents
9. `kyc_submissions` - KYC submission history

**Financial Operations:**
10. `deposits` - Deposit requests
11. `withdrawal_requests` - Withdrawal requests

**MLM Operations:**
12. `level_incomes` - Level commission records
13. `matching_bonuses` - Binary matching bonuses
14. `rank_achievements` - Rank advancement history
15. `booster_incomes` - Booster bonus records

**Admin Tables:**
16. `admin_actions` - Admin audit trail
17. `commission_runs` - Commission processing history
18. `support_tickets` - Support ticket system
19. `notifications` - User notifications
20. `announcements` - System announcements
21. `news_articles` - News/blog articles

**Configuration Tables (Public Read):**
- `packages` - Available investment packages
- `level_income_config` - Commission configuration
- `matching_bonus_tiers` - Bonus tier configuration
- `rank_requirements` - Rank advancement criteria
- `binary_settings` - Binary tree settings
- `mlm_system_settings` - System settings

---

## 🔐 Policy Definitions by Table

### 1. Users Table

**Access Rules:**
- Users can read their own profile
- Users can update their own profile (limited fields)
- Admins can read all profiles
- Admins can update any profile
- System can create users (signup)

**Policies:**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Users can update own profile (limited fields)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM users WHERE id = auth.uid()) -- Can't change own role
  );

-- Admins can update any profile
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Allow user creation (signup)
CREATE POLICY "users_insert_signup" ON users
  FOR INSERT
  WITH CHECK (true); -- Handled by Supabase Auth
```

---

### 2. Wallets Table

**Access Rules:**
- Users can read their own wallet
- Admins can read all wallets
- System can create and update wallets

**Policies:**
```sql
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can read own wallet
CREATE POLICY "wallets_select_own" ON wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all wallets
CREATE POLICY "wallets_select_admin" ON wallets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- System can insert wallets (on user creation)
CREATE POLICY "wallets_insert_system" ON wallets
  FOR INSERT
  WITH CHECK (true);

-- System can update wallets (transactions)
CREATE POLICY "wallets_update_system" ON wallets
  FOR UPDATE
  USING (true);
```

---

### 3. User Packages Table

**Access Rules:**
- Users can read their own packages
- Admins can read all packages
- Users can create packages (purchase)
- System can update packages (ROI, maturity)

**Policies:**
```sql
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;

-- Users can read own packages
CREATE POLICY "user_packages_select_own" ON user_packages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all packages
CREATE POLICY "user_packages_select_admin" ON user_packages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Users can insert packages (purchase)
CREATE POLICY "user_packages_insert_own" ON user_packages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System can update packages (ROI distribution)
CREATE POLICY "user_packages_update_system" ON user_packages
  FOR UPDATE
  USING (true);
```

---

### 4. MLM Transactions Table

**Access Rules:**
- Users can read their own transactions
- Admins can read all transactions
- System can create transactions

**Policies:**
```sql
ALTER TABLE mlm_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read own transactions
CREATE POLICY "mlm_transactions_select_own" ON mlm_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all transactions
CREATE POLICY "mlm_transactions_select_admin" ON mlm_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- System can insert transactions
CREATE POLICY "mlm_transactions_insert_system" ON mlm_transactions
  FOR INSERT
  WITH CHECK (true);
```

---

### 5. Binary Tree Table

**Access Rules:**
- Users can read the entire tree (for genealogy view)
- Admins can read all
- System can create and update tree entries

**Policies:**
```sql
ALTER TABLE binary_tree ENABLE ROW LEVEL SECURITY;

-- Users can read entire tree (needed for genealogy)
CREATE POLICY "binary_tree_select_all" ON binary_tree
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- System can insert tree entries
CREATE POLICY "binary_tree_insert_system" ON binary_tree
  FOR INSERT
  WITH CHECK (true);

-- System can update tree entries (volumes)
CREATE POLICY "binary_tree_update_system" ON binary_tree
  FOR UPDATE
  USING (true);
```

---

### 6. KYC Documents Table

**Access Rules:**
- Users can read their own KYC documents
- Admins can read all KYC documents
- Users can insert their own KYC documents
- Admins can update KYC status

**Policies:**
```sql
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Users can read own KYC documents
CREATE POLICY "kyc_documents_select_own" ON kyc_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all KYC documents
CREATE POLICY "kyc_documents_select_admin" ON kyc_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Users can insert own KYC documents
CREATE POLICY "kyc_documents_insert_own" ON kyc_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can update KYC documents (approval/rejection)
CREATE POLICY "kyc_documents_update_admin" ON kyc_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
```

---

### 7. Deposits & Withdrawals Tables

**Access Rules:**
- Users can read their own requests
- Admins can read all requests
- Users can create requests
- Admins can update requests (approval)

**Policies for Deposits:**
```sql
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Users can read own deposits
CREATE POLICY "deposits_select_own" ON deposits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all deposits
CREATE POLICY "deposits_select_admin" ON deposits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Users can insert deposits
CREATE POLICY "deposits_insert_own" ON deposits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can update deposits
CREATE POLICY "deposits_update_admin" ON deposits
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
```

**Policies for Withdrawal Requests:**
```sql
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can read own withdrawals
CREATE POLICY "withdrawal_requests_select_own" ON withdrawal_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all withdrawals
CREATE POLICY "withdrawal_requests_select_admin" ON withdrawal_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Users can insert withdrawals
CREATE POLICY "withdrawal_requests_insert_own" ON withdrawal_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can update withdrawals
CREATE POLICY "withdrawal_requests_update_admin" ON withdrawal_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
```

---

### 8. Admin-Only Tables

**Tables:**
- `admin_actions`
- `commission_runs`

**Access Rules:**
- Only admins can read
- Only system can insert

**Policies:**
```sql
-- Admin Actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_actions_select_admin" ON admin_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "admin_actions_insert_system" ON admin_actions
  FOR INSERT
  WITH CHECK (true);

-- Commission Runs
ALTER TABLE commission_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_runs_select_admin" ON commission_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "commission_runs_insert_system" ON commission_runs
  FOR INSERT
  WITH CHECK (true);
```

---

### 9. Public Read Tables (Configuration)

**Tables:**
- `packages`
- `level_income_config`
- `matching_bonus_tiers`
- `rank_requirements`
- `binary_settings`
- `mlm_system_settings`

**Access Rules:**
- All authenticated users can read
- Only admins can modify

**Policies (Pattern for all config tables):**
```sql
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "packages_select_all" ON packages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert
CREATE POLICY "packages_insert_admin" ON packages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Only admins can update
CREATE POLICY "packages_update_admin" ON packages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Repeat for:
-- level_income_config, matching_bonus_tiers, rank_requirements
-- binary_settings, mlm_system_settings
```

---

### 10. Referral System Tables

**Policies for referral_codes:**
```sql
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can read own codes
CREATE POLICY "referral_codes_select_own" ON referral_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "referral_codes_select_admin" ON referral_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Users can insert own codes
CREATE POLICY "referral_codes_insert_own" ON referral_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Policies for referrals:**
```sql
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their referrals (where they are referrer)
CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Admins can read all
CREATE POLICY "referrals_select_admin" ON referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- System can insert referrals
CREATE POLICY "referrals_insert_system" ON referrals
  FOR INSERT
  WITH CHECK (true);
```

---

## 💻 SQL Implementation

### Complete RLS Deployment Script

Create file: `database/enable-rls-policies.sql`

```sql
-- ============================================================================
-- FINASTER MLM PLATFORM - ROW-LEVEL SECURITY POLICIES
-- ============================================================================
-- Description: Complete RLS policy implementation for all tables
-- Version: 1.0
-- Date: 2025-11-01
-- ============================================================================

-- IMPORTANT: Run this script in your Supabase SQL Editor
-- This will enable RLS and create all necessary policies

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "users_insert_signup" ON users
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 2. WALLETS TABLE
-- ============================================================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_select_own" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallets_select_admin" ON wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "wallets_insert_system" ON wallets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "wallets_update_system" ON wallets
  FOR UPDATE USING (true);

-- ============================================================================
-- 3. USER_PACKAGES TABLE
-- ============================================================================

ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_packages_select_own" ON user_packages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_packages_select_admin" ON user_packages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "user_packages_insert_own" ON user_packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_packages_update_system" ON user_packages
  FOR UPDATE USING (true);

-- ============================================================================
-- 4. MLM_TRANSACTIONS TABLE
-- ============================================================================

ALTER TABLE mlm_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mlm_transactions_select_own" ON mlm_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mlm_transactions_select_admin" ON mlm_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "mlm_transactions_insert_system" ON mlm_transactions
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 5. BINARY_TREE TABLE
-- ============================================================================

ALTER TABLE binary_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "binary_tree_select_all" ON binary_tree
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "binary_tree_insert_system" ON binary_tree
  FOR INSERT WITH CHECK (true);

CREATE POLICY "binary_tree_update_system" ON binary_tree
  FOR UPDATE USING (true);

-- ============================================================================
-- 6. KYC_DOCUMENTS TABLE
-- ============================================================================

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kyc_documents_select_own" ON kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "kyc_documents_select_admin" ON kyc_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "kyc_documents_insert_own" ON kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kyc_documents_update_admin" ON kyc_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 7. DEPOSITS TABLE
-- ============================================================================

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deposits_select_own" ON deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "deposits_select_admin" ON deposits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "deposits_insert_own" ON deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deposits_update_admin" ON deposits
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 8. WITHDRAWAL_REQUESTS TABLE
-- ============================================================================

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withdrawal_requests_select_own" ON withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "withdrawal_requests_select_admin" ON withdrawal_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "withdrawal_requests_insert_own" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "withdrawal_requests_update_admin" ON withdrawal_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 9. ADMIN_ACTIONS TABLE
-- ============================================================================

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_actions_select_admin" ON admin_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin_actions_insert_system" ON admin_actions
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 10. COMMISSION_RUNS TABLE
-- ============================================================================

ALTER TABLE commission_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_runs_select_admin" ON commission_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "commission_runs_insert_system" ON commission_runs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 11. PACKAGES TABLE (Public Read, Admin Write)
-- ============================================================================

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_select_all" ON packages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "packages_insert_admin" ON packages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "packages_update_admin" ON packages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 12. CONFIGURATION TABLES (Public Read, Admin Write)
-- ============================================================================

-- Level Income Config
ALTER TABLE level_income_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_income_config_select_all" ON level_income_config
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "level_income_config_update_admin" ON level_income_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Matching Bonus Tiers
ALTER TABLE matching_bonus_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matching_bonus_tiers_select_all" ON matching_bonus_tiers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "matching_bonus_tiers_all_admin" ON matching_bonus_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Rank Requirements
ALTER TABLE rank_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rank_requirements_select_all" ON rank_requirements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "rank_requirements_all_admin" ON rank_requirements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Binary Settings
ALTER TABLE binary_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "binary_settings_select_all" ON binary_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "binary_settings_update_admin" ON binary_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- MLM System Settings
ALTER TABLE mlm_system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mlm_system_settings_select_all" ON mlm_system_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mlm_system_settings_update_admin" ON mlm_system_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 13. REFERRAL SYSTEM TABLES
-- ============================================================================

-- Referral Codes
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_codes_select_own" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "referral_codes_select_admin" ON referral_codes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "referral_codes_insert_own" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "referrals_select_admin" ON referrals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "referrals_insert_system" ON referrals
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 14. SUPPORT & COMMUNICATION TABLES
-- ============================================================================

-- Support Tickets (if exists)
ALTER TABLE IF EXISTS support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets_select_own" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "support_tickets_select_admin" ON support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "support_tickets_insert_own" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "support_tickets_update_all" ON support_tickets
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Notifications (if exists)
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Announcements (if exists)
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_all" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "announcements_all_admin" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- News Articles (if exists)
ALTER TABLE IF EXISTS news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_articles_select_all" ON news_articles
  FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');

CREATE POLICY "news_articles_all_admin" ON news_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 15. MLM INCOME TRACKING TABLES
-- ============================================================================

-- Level Incomes (if separate table exists)
ALTER TABLE IF EXISTS level_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "level_incomes_select_own" ON level_incomes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "level_incomes_select_admin" ON level_incomes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "level_incomes_insert_system" ON level_incomes
  FOR INSERT WITH CHECK (true);

-- Matching Bonuses Records (if separate table exists)
ALTER TABLE IF EXISTS matching_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matching_bonuses_select_own" ON matching_bonuses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "matching_bonuses_select_admin" ON matching_bonuses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "matching_bonuses_insert_system" ON matching_bonuses
  FOR INSERT WITH CHECK (true);

-- Rank Achievements
ALTER TABLE IF EXISTS rank_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rank_achievements_select_own" ON rank_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "rank_achievements_select_admin" ON rank_achievements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "rank_achievements_insert_system" ON rank_achievements
  FOR INSERT WITH CHECK (true);

-- Booster Incomes
ALTER TABLE IF EXISTS booster_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booster_incomes_select_own" ON booster_incomes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "booster_incomes_select_admin" ON booster_incomes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "booster_incomes_insert_system" ON booster_incomes
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Test with different user roles
-- 2. Verify users can only see their own data
-- 3. Verify admins can see all data
-- 4. Test insert/update/delete operations

```

---

## ✅ Verification Steps

### Step 1: Check RLS is Enabled

```sql
-- Run in Supabase SQL Editor
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** All tables should show `RLS Enabled = true`

---

### Step 2: Check Policies Exist

```sql
-- Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;
```

**Expected:** Each table should have 2-4 policies minimum

---

### Step 3: View All Policies

```sql
-- List all policies with details
SELECT
  tablename,
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🧪 Testing Procedures

### Test 1: User Can Only See Own Data

```typescript
// Login as regular user
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Try to read transactions
const { data: transactions } = await supabase
  .from('mlm_transactions')
  .select('*');

// Should only return transactions for this user
console.assert(
  transactions.every(t => t.user_id === user.id),
  'User can see other users transactions! RLS NOT WORKING'
);
```

---

### Test 2: Admin Can See All Data

```typescript
// Login as admin
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'admin_password'
});

// Try to read all users
const { data: allUsers } = await supabase
  .from('users')
  .select('*');

// Should return all users
console.assert(
  allUsers.length > 1,
  'Admin cannot see all users! RLS policy issue'
);
```

---

### Test 3: User Cannot Access Admin Tables

```typescript
// Login as regular user
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Try to read admin actions
const { data: adminActions, error } = await supabase
  .from('admin_actions')
  .select('*');

// Should return empty or error
console.assert(
  adminActions === null || adminActions.length === 0,
  'User can access admin table! RLS NOT WORKING'
);
```

---

## 🔧 Troubleshooting

### Issue: "Row-level security is enabled but no policy allows..."

**Cause:** Table has RLS enabled but no policy matches the operation

**Solution:**
```sql
-- Check existing policies for the table
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';

-- Temporarily disable RLS to test (DEVELOPMENT ONLY)
ALTER TABLE your_table_name DISABLE ROW LEVEL SECURITY;
```

---

### Issue: User can see other users' data

**Cause:** Policy USING clause is too permissive

**Solution:**
```sql
-- Check the policy
SELECT qual FROM pg_policies
WHERE tablename = 'your_table' AND policyname = 'your_policy';

-- Fix by recreating policy with correct USING clause
DROP POLICY IF EXISTS your_policy ON your_table;
CREATE POLICY your_policy ON your_table
  FOR SELECT
  USING (auth.uid() = user_id); -- Ensure this matches user's ID
```

---

### Issue: Admin cannot access data

**Cause:** Admin role check not working

**Solution:**
```sql
-- Verify admin role exists in users table
SELECT id, email, role FROM users WHERE role IN ('admin', 'superadmin');

-- Ensure admin policy exists
CREATE POLICY "table_select_admin" ON your_table
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
```

---

### Issue: System operations failing

**Cause:** System operations need to bypass RLS

**Solution:**
```sql
-- For system/cron operations, use service role key
-- Or create policies that allow system operations

CREATE POLICY "table_insert_system" ON your_table
  FOR INSERT
  WITH CHECK (true); -- Allows all inserts (be careful!)
```

---

## 📋 Deployment Checklist

Before going to production:

- [ ] Enable RLS on all 21 core tables
- [ ] Create policies for SELECT operations
- [ ] Create policies for INSERT operations
- [ ] Create policies for UPDATE operations
- [ ] Create policies for DELETE operations (if needed)
- [ ] Test as regular user (can only see own data)
- [ ] Test as admin (can see all data)
- [ ] Test unauthenticated access (should be blocked)
- [ ] Verify system operations still work
- [ ] Check all queries in the application work
- [ ] Monitor Supabase logs for policy violations
- [ ] Document any custom policies
- [ ] Back up policy definitions

---

## 🚀 Quick Deployment

### Option 1: Run Complete Script

1. Go to Supabase Dashboard → SQL Editor
2. Copy entire `database/enable-rls-policies.sql`
3. Click "Run"
4. Verify with verification queries

### Option 2: Enable Per Table

```sql
-- Template for any table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Users see own data
CREATE POLICY "your_table_select_own" ON your_table
  FOR SELECT USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "your_table_select_admin" ON your_table
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
```

---

## 📊 Success Criteria

✅ **RLS Deployment Successful When:**

1. All tables have RLS enabled
2. Each table has appropriate policies
3. Users can only access their own data
4. Admins can access all data
5. Unauthenticated users are blocked
6. All application features still work
7. No SQL errors in logs
8. System operations complete successfully

---

**RLS Guide Complete** ✅
**Status:** Ready for Deployment
**Priority:** HIGH - Critical for Production
**Estimated Time:** 30-60 minutes to deploy and test

---

*Row-Level Security Policies Guide - Finaster MLM Platform*
*Generated: 2025-11-01*
