const fs = require('fs');
const path = require('path');

/**
 * Fix column names from camelCase to snake_case in admin routes
 */

const adminRoutesPath = path.join(__dirname, '../server/routes/admin.ts');

console.log('🔧 Fixing column names in admin.ts...\n');

let content = fs.readFileSync(adminRoutesPath, 'utf-8');
const original = content;

// Replace camelCase with snake_case
const replacements = [
  [/createdAt/g, 'created_at'],
  [/updatedAt/g, 'updated_at'],
  [/userId/g, 'user_id'],
  [/packageId/g, 'package_id'],
  [/referralCode/g, 'referral_code'],
  [/sponsorId/g, 'sponsor_id'],
  [/placementId/g, 'placement_id'],
  [/kycStatus/g, 'kyc_status'],
  [/emailVerified/g, 'email_verified'],
  [/isActive/g, 'is_active'],
  [/transactionType/g, 'transaction_type'],
  [/fullName/g, 'full_name'],
  [/walletBalance/g, 'wallet_balance'],
  [/totalInvestment/g, 'total_investment'],
  [/totalEarnings/g, 'total_earnings'],
  [/currentRank/g, 'current_rank'],
  [/phoneNumber/g, 'phone_number'],
  [/leftVolume/g, 'left_volume'],
  [/rightVolume/g, 'right_volume'],
  [/directReferralsCount/g, 'direct_referrals_count']
];

let changesMade = 0;
replacements.forEach(([from, to]) => {
  const before = content;
  content = content.replace(from, to);
  if (before !== content) {
    const matches = (before.match(from) || []).length;
    console.log(`✓ Replaced ${matches}x: ${from.source} → ${to}`);
    changesMade += matches;
  }
});

if (changesMade > 0) {
  fs.writeFileSync(adminRoutesPath, content);
  console.log(`\n✅ Fixed ${changesMade} column name occurrences in admin.ts`);
} else {
  console.log('\n⚠️  No changes needed');
}
