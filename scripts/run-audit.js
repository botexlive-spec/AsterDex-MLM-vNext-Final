/**
 * Run Database Audit and Display Results
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read DATABASE_URL from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
};

const DATABASE_URL = getEnvValue('DATABASE_URL');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file!');
  process.exit(1);
}

// Individual audit queries
const auditQueries = {
  orphanedUsers: `
    SELECT COUNT(*) as count
    FROM public.users u
    WHERE u.sponsor_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.users s WHERE s.id = u.sponsor_id)
  `,

  usersWithoutReferralCodes: `
    SELECT COUNT(*) as count
    FROM public.users u
    LEFT JOIN public.referral_codes rc ON u.id = rc.user_id
    WHERE rc.id IS NULL
  `,

  usersWithoutBinaryTree: `
    SELECT COUNT(*) as count
    FROM public.users u
    LEFT JOIN public.binary_tree bt ON u.id = bt.user_id
    WHERE bt.id IS NULL
  `,

  invalidBinaryTreeParents: `
    SELECT COUNT(*) as count
    FROM public.binary_tree bt
    WHERE bt.parent_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = bt.parent_id)
  `,

  duplicateBinaryPositions: `
    SELECT COUNT(*) as count
    FROM (
      SELECT parent_id, position, COUNT(*) as cnt
      FROM public.binary_tree
      WHERE parent_id IS NOT NULL
      GROUP BY parent_id, position
      HAVING COUNT(*) > 1
    ) AS dups
  `,

  negativeBinaryVolumes: `
    SELECT COUNT(*) as count
    FROM public.binary_tree
    WHERE left_volume < 0 OR right_volume < 0
  `,

  usersWithoutWallets: `
    SELECT COUNT(*) as count
    FROM public.users u
    LEFT JOIN public.wallets w ON u.id = w.user_id
    WHERE w.id IS NULL
  `,

  negativeWalletBalances: `
    SELECT COUNT(*) as count
    FROM public.wallets w
    WHERE w.available_balance < 0
       OR w.total_balance < 0
       OR w.locked_balance < 0
  `,

  walletBalanceInconsistencies: `
    SELECT COUNT(*) as count
    FROM public.wallets w
    WHERE ABS(w.total_balance - (w.available_balance + w.locked_balance)) > 0.01
  `,

  invalidUserPackages: `
    SELECT COUNT(*) as count
    FROM public.user_packages up
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = up.user_id)
  `,

  invalidPackageReferences: `
    SELECT COUNT(*) as count
    FROM public.user_packages up
    WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.id = up.package_id)
  `,

  packagesWithInvalidAmounts: `
    SELECT COUNT(*) as count
    FROM public.user_packages up
    JOIN public.packages p ON up.package_id = p.id
    WHERE up.amount < p.min_investment OR up.amount > p.max_investment
  `,

  invalidROIPercentages: `
    SELECT COUNT(*) as count
    FROM public.user_packages up
    WHERE up.roi_percentage < 0 OR up.roi_percentage > 100
  `,

  transactionsWithInvalidUsers: `
    SELECT COUNT(*) as count
    FROM public.mlm_transactions t
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = t.user_id)
  `,

  transactionsWithInvalidSourceUsers: `
    SELECT COUNT(*) as count
    FROM public.mlm_transactions t
    WHERE t.from_user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = t.from_user_id)
  `,

  invalidLevelIncomeRecords: `
    SELECT COUNT(*) as count
    FROM public.level_incomes li
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = li.user_id)
       OR NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = li.from_user_id)
  `,

  levelIncomesWithInvalidLevel: `
    SELECT COUNT(*) as count
    FROM public.level_incomes li
    WHERE li.level < 1 OR li.level > 30
  `,

  invalidMatchingBonusRecords: `
    SELECT COUNT(*) as count
    FROM public.matching_bonuses mb
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = mb.user_id)
  `,

  negativeTransactionAmounts: `
    SELECT COUNT(*) as count
    FROM public.mlm_transactions t
    WHERE t.amount < 0 AND t.transaction_type != 'withdrawal'
  `,

  invalidKYCDocuments: `
    SELECT COUNT(*) as count
    FROM public.kyc_documents kd
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = kd.user_id)
  `,

  kycWithInvalidReviewer: `
    SELECT COUNT(*) as count
    FROM public.kyc_documents kd
    WHERE kd.reviewed_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = kd.reviewed_by)
  `,

  invalidWithdrawalRecords: `
    SELECT COUNT(*) as count
    FROM public.withdrawals w
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = w.user_id)
  `,

  withdrawalsWithInvalidProcessor: `
    SELECT COUNT(*) as count
    FROM public.withdrawals w
    WHERE w.processed_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = w.processed_by)
  `,

  invalidDepositRecords: `
    SELECT COUNT(*) as count
    FROM public.deposits d
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = d.user_id)
  `,

  invalidRobotSubscriptions: `
    SELECT COUNT(*) as count
    FROM public.robot_subscriptions rs
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = rs.user_id)
  `,

  expiredRobotSubscriptionsStillActive: `
    SELECT COUNT(*) as count
    FROM public.robot_subscriptions rs
    WHERE rs.is_active = true AND rs.expires_at < NOW()
  `,

  invalidRankAchievements: `
    SELECT COUNT(*) as count
    FROM public.rank_achievements ra
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = ra.user_id)
  `,

  duplicateReferralCodes: `
    SELECT COUNT(*) as count
    FROM (
      SELECT code, COUNT(*) as cnt
      FROM public.referral_codes
      GROUP BY code
      HAVING COUNT(*) > 1
    ) AS dups
  `,
};

const summaryQuery = `
  SELECT
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
    ) as statistics
`;

async function runAudit() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           FINASTER MLM DATABASE INTEGRITY AUDIT               ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const results = {};
    let totalIssues = 0;

    // Run each audit query
    for (const [key, query] of Object.entries(auditQueries)) {
      const { rows } = await client.query(query);
      const count = parseInt(rows[0].count);
      results[key] = count;
      totalIssues += count;
    }

    // Display results
    console.log('📋 AUDIT RESULTS:\n');

    console.log('1️⃣  USER-SPONSOR RELATIONSHIPS');
    console.log(`   • Orphaned users: ${results.orphanedUsers} ${results.orphanedUsers > 0 ? '❌' : '✅'}`);
    console.log(`   • Users without referral codes: ${results.usersWithoutReferralCodes} ${results.usersWithoutReferralCodes > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('2️⃣  BINARY TREE STRUCTURE');
    console.log(`   • Users without binary tree entry: ${results.usersWithoutBinaryTree} ${results.usersWithoutBinaryTree > 0 ? '❌' : '✅'}`);
    console.log(`   • Invalid binary tree parents: ${results.invalidBinaryTreeParents} ${results.invalidBinaryTreeParents > 0 ? '❌' : '✅'}`);
    console.log(`   • Duplicate binary positions: ${results.duplicateBinaryPositions} ${results.duplicateBinaryPositions > 0 ? '❌' : '✅'}`);
    console.log(`   • Negative binary volumes: ${results.negativeBinaryVolumes} ${results.negativeBinaryVolumes > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('3️⃣  WALLET INTEGRITY');
    console.log(`   • Users without wallets: ${results.usersWithoutWallets} ${results.usersWithoutWallets > 0 ? '❌' : '✅'}`);
    console.log(`   • Negative wallet balances: ${results.negativeWalletBalances} ${results.negativeWalletBalances > 0 ? '❌' : '✅'}`);
    console.log(`   • Wallet balance inconsistencies: ${results.walletBalanceInconsistencies} ${results.walletBalanceInconsistencies > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('4️⃣  PACKAGES & INVESTMENTS');
    console.log(`   • Invalid user packages: ${results.invalidUserPackages} ${results.invalidUserPackages > 0 ? '❌' : '✅'}`);
    console.log(`   • Invalid package references: ${results.invalidPackageReferences} ${results.invalidPackageReferences > 0 ? '❌' : '✅'}`);
    console.log(`   • Packages with invalid amounts: ${results.packagesWithInvalidAmounts} ${results.packagesWithInvalidAmounts > 0 ? '❌' : '✅'}`);
    console.log(`   • Invalid ROI percentages: ${results.invalidROIPercentages} ${results.invalidROIPercentages > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('5️⃣  TRANSACTIONS & EARNINGS');
    console.log(`   • Transactions with invalid users: ${results.transactionsWithInvalidUsers} ${results.transactionsWithInvalidUsers > 0 ? '❌' : '✅'}`);
    console.log(`   • Transactions with invalid source users: ${results.transactionsWithInvalidSourceUsers} ${results.transactionsWithInvalidSourceUsers > 0 ? '❌' : '✅'}`);
    console.log(`   • Invalid level income records: ${results.invalidLevelIncomeRecords} ${results.invalidLevelIncomeRecords > 0 ? '❌' : '✅'}`);
    console.log(`   • Level incomes with invalid level: ${results.levelIncomesWithInvalidLevel} ${results.levelIncomesWithInvalidLevel > 0 ? '❌' : '✅'}`);
    console.log(`   • Invalid matching bonus records: ${results.invalidMatchingBonusRecords} ${results.invalidMatchingBonusRecords > 0 ? '❌' : '✅'}`);
    console.log(`   • Negative transaction amounts: ${results.negativeTransactionAmounts} ${results.negativeTransactionAmounts > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('6️⃣  KYC DOCUMENTS');
    console.log(`   • Invalid KYC documents: ${results.invalidKYCDocuments} ${results.invalidKYCDocuments > 0 ? '❌' : '✅'}`);
    console.log(`   • KYC with invalid reviewer: ${results.kycWithInvalidReviewer} ${results.kycWithInvalidReviewer > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('7️⃣  WITHDRAWALS & DEPOSITS');
    console.log(`   • Invalid withdrawal records: ${results.invalidWithdrawalRecords} ${results.invalidWithdrawalRecords > 0 ? '❌' : '✅'}`);
    console.log(`   • Withdrawals with invalid processor: ${results.withdrawalsWithInvalidProcessor} ${results.withdrawalsWithInvalidProcessor > 0 ? '❌' : '✅'}`);
    console.log(`   • Invalid deposit records: ${results.invalidDepositRecords} ${results.invalidDepositRecords > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('8️⃣  ROBOT SUBSCRIPTIONS');
    console.log(`   • Invalid robot subscriptions: ${results.invalidRobotSubscriptions} ${results.invalidRobotSubscriptions > 0 ? '❌' : '✅'}`);
    console.log(`   • Expired subscriptions still active: ${results.expiredRobotSubscriptionsStillActive} ${results.expiredRobotSubscriptionsStillActive > 0 ? '⚠️' : '✅'}`);
    console.log('');

    console.log('9️⃣  RANK ACHIEVEMENTS');
    console.log(`   • Invalid rank achievements: ${results.invalidRankAchievements} ${results.invalidRankAchievements > 0 ? '❌' : '✅'}`);
    console.log('');

    console.log('🔟 REFERRAL CODES');
    console.log(`   • Duplicate referral codes: ${results.duplicateReferralCodes} ${results.duplicateReferralCodes > 0 ? '❌' : '✅'}`);
    console.log('');

    // Summary statistics
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    DATABASE STATISTICS                        ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const { rows: summaryRows } = await client.query(summaryQuery);
    const stats = summaryRows[0].statistics;

    console.table(stats);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`                  TOTAL ISSUES FOUND: ${totalIssues}                  `);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (totalIssues === 0) {
      console.log('🎉 DATABASE INTEGRITY: PERFECT! No issues found.\n');
    } else {
      console.log('⚠️  DATABASE INTEGRITY: ISSUES DETECTED\n');
      console.log('Please run individual queries to see details of the issues.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runAudit();
