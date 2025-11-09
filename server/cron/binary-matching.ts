/**
 * Binary Matching Cron Job
 * Runs daily to execute binary matching for all eligible users
 */

import cron from 'node-cron';
import { query } from '../db';
import {
  calculateBinaryMatch,
  BinaryMatchResult
} from '../services/binary-matching.service';

/**
 * Run binary matching for all users with unmatched volume
 */
async function runBinaryMatching(): Promise<void> {
  const startTime = Date.now();
  console.log('\n🎯 ===============================================');
  console.log('🎯 BINARY MATCHING CRON JOB STARTED');
  console.log('🎯 ===============================================');
  console.log(`⏰ Time: ${new Date().toISOString()}\n`);

  try {
    // Get all users with unmatched volumes
    const result = await query(
      `SELECT user_id, left_unmatched, right_unmatched
       FROM binary_tree
       WHERE left_unmatched > 0 AND right_unmatched > 0
       ORDER BY matched_to_date ASC`
    );

    const eligibleUsers = result.rows;
    console.log(`📊 Found ${eligibleUsers.length} users with unmatched volumes\n`);

    if (eligibleUsers.length === 0) {
      console.log('✅ No users eligible for matching. Exiting.\n');
      return;
    }

    let processed = 0;
    let matched = 0;
    let totalPayout = 0;

    for (const user of eligibleUsers) {
      const userId = user.user_id;
      const leftUnmatched = parseFloat(user.left_unmatched);
      const rightUnmatched = parseFloat(user.right_unmatched);

      console.log(`\n🔄 Processing user ${userId}`);
      console.log(`   Left unmatched: $${leftUnmatched.toFixed(2)}`);
      console.log(`   Right unmatched: $${rightUnmatched.toFixed(2)}`);

      // Execute matching
      const matchResult: BinaryMatchResult | null = await calculateBinaryMatch(userId);

      if (matchResult) {
        matched++;
        totalPayout += matchResult.payout_amount;

        console.log(`   ✅ MATCHED!`);
        console.log(`      Matched volume: $${matchResult.matched_volume.toFixed(2)}`);
        console.log(`      Payout: $${matchResult.payout_amount.toFixed(2)}`);
        console.log(`      Left after: $${matchResult.left_after.toFixed(2)}`);
        console.log(`      Right after: $${matchResult.right_after.toFixed(2)}`);
      } else {
        console.log(`   ⏭️  No match (below minimum or daily limit reached)`);
      }

      processed++;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🎯 ===============================================');
    console.log('🎯 BINARY MATCHING CRON JOB COMPLETED');
    console.log('🎯 ===============================================');
    console.log(`✅ Processed: ${processed} users`);
    console.log(`💰 Matched: ${matched} users`);
    console.log(`💵 Total Payout: $${totalPayout.toFixed(2)}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`⏰ Completed: ${new Date().toISOString()}\n`);

  } catch (error) {
    console.error('\n❌ Binary matching cron job error:', error);
    console.error(`⏰ Failed at: ${new Date().toISOString()}\n`);
  }
}

/**
 * Schedule binary matching to run daily at midnight
 */
export function scheduleBinaryMatching(): void {
  // Run daily at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    await runBinaryMatching();
  });

  console.log('⏰ Binary matching cron job scheduled (daily at midnight)');
}

/**
 * Run binary matching immediately (for testing/manual trigger)
 */
export async function runBinaryMatchingNow(): Promise<void> {
  await runBinaryMatching();
}

// Export for manual testing
export default {
  scheduleBinaryMatching,
  runBinaryMatchingNow
};
