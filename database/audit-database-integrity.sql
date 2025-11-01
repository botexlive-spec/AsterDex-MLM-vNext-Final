-- ═══════════════════════════════════════════════════════════════
-- FINASTER MLM DATABASE INTEGRITY AUDIT
-- Comprehensive validation of all relationships and data integrity
-- ═══════════════════════════════════════════════════════════════

-- 1. USER-SPONSOR RELATIONSHIPS
-- ────────────────────────────────────────────────────────────────

-- Check for orphaned users (sponsor_id points to non-existent user)
SELECT
    'ORPHANED USERS' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('user_id', u.id, 'email', u.email, 'sponsor_id', u.sponsor_id)) as details
FROM public.users u
WHERE u.sponsor_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users s WHERE s.id = u.sponsor_id);

-- Check for circular referrals (A sponsors B, B sponsors A)
WITH RECURSIVE referral_chain AS (
    SELECT id, sponsor_id, ARRAY[id] as chain, 1 as depth
    FROM public.users
    WHERE sponsor_id IS NOT NULL

    UNION ALL

    SELECT u.id, u.sponsor_id, rc.chain || u.sponsor_id, rc.depth + 1
    FROM public.users u
    INNER JOIN referral_chain rc ON u.sponsor_id = rc.id
    WHERE u.sponsor_id IS NOT NULL
      AND rc.depth < 31
      AND NOT (u.sponsor_id = ANY(rc.chain))
)
SELECT
    'CIRCULAR REFERRALS' as issue_type,
    COUNT(*) as count
FROM referral_chain
WHERE id = ANY(chain[2:array_length(chain, 1)]);

-- Check users without referral codes
SELECT
    'USERS WITHOUT REFERRAL CODES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('user_id', u.id, 'email', u.email)) FILTER (WHERE rc.id IS NULL) as details
FROM public.users u
LEFT JOIN public.referral_codes rc ON u.id = rc.user_id
WHERE rc.id IS NULL;

-- ────────────────────────────────────────────────────────────────
-- 2. BINARY TREE STRUCTURE
-- ────────────────────────────────────────────────────────────────

-- Check for users without binary tree entry
SELECT
    'USERS WITHOUT BINARY TREE ENTRY' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('user_id', u.id, 'email', u.email)) FILTER (WHERE bt.id IS NULL) as details
FROM public.users u
LEFT JOIN public.binary_tree bt ON u.id = bt.user_id
WHERE bt.id IS NULL;

-- Check for binary tree nodes with invalid parent_id
SELECT
    'INVALID BINARY TREE PARENTS' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('user_id', bt.user_id, 'parent_id', bt.parent_id)) as details
FROM public.binary_tree bt
WHERE bt.parent_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = bt.parent_id);

-- Check for duplicate left/right child assignments
WITH duplicate_positions AS (
    SELECT parent_id, position, COUNT(*) as cnt
    FROM public.binary_tree
    WHERE parent_id IS NOT NULL
    GROUP BY parent_id, position
    HAVING COUNT(*) > 1
)
SELECT
    'DUPLICATE BINARY POSITIONS' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('parent_id', parent_id, 'position', position, 'count', cnt)) as details
FROM duplicate_positions;

-- Check for negative volumes
SELECT
    'NEGATIVE BINARY VOLUMES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('user_id', user_id, 'left_volume', left_volume, 'right_volume', right_volume)) as details
FROM public.binary_tree
WHERE left_volume < 0 OR right_volume < 0;

-- ────────────────────────────────────────────────────────────────
-- 3. WALLET INTEGRITY
-- ────────────────────────────────────────────────────────────────

-- Check for users without wallets
SELECT
    'USERS WITHOUT WALLETS' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('user_id', u.id, 'email', u.email)) FILTER (WHERE w.id IS NULL) as details
FROM public.users u
LEFT JOIN public.wallets w ON u.id = w.user_id
WHERE w.id IS NULL;

-- Check for negative wallet balances
SELECT
    'NEGATIVE WALLET BALANCES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT(
        'user_id', w.user_id,
        'available_balance', w.available_balance,
        'total_balance', w.total_balance,
        'locked_balance', w.locked_balance
    )) as details
FROM public.wallets w
WHERE w.available_balance < 0
   OR w.total_balance < 0
   OR w.locked_balance < 0;

-- Check for balance inconsistencies (total != available + locked)
SELECT
    'WALLET BALANCE INCONSISTENCIES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT(
        'user_id', w.user_id,
        'total_balance', w.total_balance,
        'available_balance', w.available_balance,
        'locked_balance', w.locked_balance,
        'calculated_total', w.available_balance + w.locked_balance
    )) as details
FROM public.wallets w
WHERE ABS(w.total_balance - (w.available_balance + w.locked_balance)) > 0.01;

-- ────────────────────────────────────────────────────────────────
-- 4. PACKAGES & INVESTMENTS
-- ────────────────────────────────────────────────────────────────

-- Check for user_packages with invalid user_id
SELECT
    'INVALID USER PACKAGES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('package_id', up.id, 'user_id', up.user_id)) as details
FROM public.user_packages up
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = up.user_id);

-- Check for user_packages with invalid package_id
SELECT
    'INVALID PACKAGE REFERENCES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('user_package_id', up.id, 'package_id', up.package_id)) as details
FROM public.user_packages up
WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.id = up.package_id);

-- Check for packages with amounts outside tier limits
SELECT
    'PACKAGES WITH INVALID AMOUNTS' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT(
        'user_package_id', up.id,
        'amount', up.amount,
        'min_amount', p.min_investment,
        'max_amount', p.max_investment
    )) as details
FROM public.user_packages up
JOIN public.packages p ON up.package_id = p.id
WHERE up.amount < p.min_investment OR up.amount > p.max_investment;

-- Check for ROI percentages outside valid range
SELECT
    'INVALID ROI PERCENTAGES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT(
        'user_package_id', up.id,
        'roi_percentage', up.roi_percentage
    )) as details
FROM public.user_packages up
WHERE up.roi_percentage < 0 OR up.roi_percentage > 100;

-- ────────────────────────────────────────────────────────────────
-- 5. TRANSACTIONS & EARNINGS
-- ────────────────────────────────────────────────────────────────

-- Check for mlm_transactions with invalid user_id
SELECT
    'TRANSACTIONS WITH INVALID USERS' as issue_type,
    COUNT(*) as count
FROM public.mlm_transactions t
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = t.user_id);

-- Check for transactions with invalid from_user_id
SELECT
    'TRANSACTIONS WITH INVALID SOURCE USERS' as issue_type,
    COUNT(*) as count
FROM public.mlm_transactions t
WHERE t.from_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = t.from_user_id);

-- Check for level_incomes with invalid references
SELECT
    'INVALID LEVEL INCOME RECORDS' as issue_type,
    COUNT(*) as count
FROM public.level_incomes li
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = li.user_id)
   OR NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = li.from_user_id);

-- Check for level_incomes with invalid level (should be 1-30)
SELECT
    'LEVEL INCOMES WITH INVALID LEVEL' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('id', li.id, 'level', li.level)) as details
FROM public.level_incomes li
WHERE li.level < 1 OR li.level > 30;

-- Check for matching_bonuses with invalid user_id
SELECT
    'INVALID MATCHING BONUS RECORDS' as issue_type,
    COUNT(*) as count
FROM public.matching_bonuses mb
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = mb.user_id);

-- Check for negative amounts in transactions
SELECT
    'NEGATIVE TRANSACTION AMOUNTS (NOT WITHDRAWALS)' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('id', t.id, 'type', t.transaction_type, 'amount', t.amount)) as details
FROM public.mlm_transactions t
WHERE t.amount < 0
  AND t.transaction_type != 'withdrawal';

-- ────────────────────────────────────────────────────────────────
-- 6. KYC DOCUMENTS
-- ────────────────────────────────────────────────────────────────

-- Check for KYC documents with invalid user_id
SELECT
    'INVALID KYC DOCUMENTS' as issue_type,
    COUNT(*) as count
FROM public.kyc_documents kd
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = kd.user_id);

-- Check for KYC documents with invalid reviewer
SELECT
    'KYC WITH INVALID REVIEWER' as issue_type,
    COUNT(*) as count
FROM public.kyc_documents kd
WHERE kd.reviewed_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = kd.reviewed_by);

-- ────────────────────────────────────────────────────────────────
-- 7. WITHDRAWALS & DEPOSITS
-- ────────────────────────────────────────────────────────────────

-- Check for withdrawals with invalid user_id
SELECT
    'INVALID WITHDRAWAL RECORDS' as issue_type,
    COUNT(*) as count
FROM public.withdrawals w
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = w.user_id);

-- Check for withdrawals with invalid processor
SELECT
    'WITHDRAWALS WITH INVALID PROCESSOR' as issue_type,
    COUNT(*) as count
FROM public.withdrawals w
WHERE w.processed_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = w.processed_by);

-- Check for deposits with invalid user_id
SELECT
    'INVALID DEPOSIT RECORDS' as issue_type,
    COUNT(*) as count
FROM public.deposits d
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = d.user_id);

-- ────────────────────────────────────────────────────────────────
-- 8. ROBOT SUBSCRIPTIONS
-- ────────────────────────────────────────────────────────────────

-- Check for robot subscriptions with invalid user_id
SELECT
    'INVALID ROBOT SUBSCRIPTIONS' as issue_type,
    COUNT(*) as count
FROM public.robot_subscriptions rs
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = rs.user_id);

-- Check for active robot subscriptions with past expiry
SELECT
    'EXPIRED ROBOT SUBSCRIPTIONS STILL ACTIVE' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT(
        'subscription_id', rs.id,
        'user_id', rs.user_id,
        'expires_at', rs.expires_at,
        'is_active', rs.is_active
    )) as details
FROM public.robot_subscriptions rs
WHERE rs.is_active = true
  AND rs.expires_at < NOW();

-- ────────────────────────────────────────────────────────────────
-- 9. RANK ACHIEVEMENTS
-- ────────────────────────────────────────────────────────────────

-- Check for rank achievements with invalid user_id
SELECT
    'INVALID RANK ACHIEVEMENTS' as issue_type,
    COUNT(*) as count
FROM public.rank_achievements ra
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = ra.user_id);

-- ────────────────────────────────────────────────────────────────
-- 10. REFERRAL CODES
-- ────────────────────────────────────────────────────────────────

-- Check for duplicate referral codes
WITH duplicate_codes AS (
    SELECT code, COUNT(*) as cnt
    FROM public.referral_codes
    GROUP BY code
    HAVING COUNT(*) > 1
)
SELECT
    'DUPLICATE REFERRAL CODES' as issue_type,
    COUNT(*) as count,
    JSON_AGG(JSON_BUILD_OBJECT('code', code, 'count', cnt)) as details
FROM duplicate_codes;

-- ────────────────────────────────────────────────────────────────
-- 11. SUMMARY STATISTICS
-- ────────────────────────────────────────────────────────────────

SELECT
    'SUMMARY' as report_section,
    JSON_BUILD_OBJECT(
        'total_users', (SELECT COUNT(*) FROM public.users),
        'total_wallets', (SELECT COUNT(*) FROM public.wallets),
        'total_packages', (SELECT COUNT(*) FROM public.user_packages),
        'total_transactions', (SELECT COUNT(*) FROM public.mlm_transactions),
        'total_level_incomes', (SELECT COUNT(*) FROM public.level_incomes),
        'total_matching_bonuses', (SELECT COUNT(*) FROM public.matching_bonuses),
        'total_withdrawals', (SELECT COUNT(*) FROM public.withdrawals),
        'total_deposits', (SELECT COUNT(*) FROM public.deposits),
        'total_kyc_documents', (SELECT COUNT(*) FROM public.kyc_documents),
        'total_binary_tree_nodes', (SELECT COUNT(*) FROM public.binary_tree),
        'total_robot_subscriptions', (SELECT COUNT(*) FROM public.robot_subscriptions),
        'total_rank_achievements', (SELECT COUNT(*) FROM public.rank_achievements),
        'total_referral_codes', (SELECT COUNT(*) FROM public.referral_codes)
    ) as statistics;

-- ═══════════════════════════════════════════════════════════════
-- END OF DATABASE INTEGRITY AUDIT
-- ═══════════════════════════════════════════════════════════════
