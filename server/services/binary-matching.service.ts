/**
 * Binary Matching Engine Service
 * Handles binary tree volume calculation and matching payouts
 */

import { query } from '../db';
import { isPlanActive } from './planSettings.service';
import * as fs from 'fs';
import * as path from 'path';

// Logging
const LOG_DIR = path.join(process.cwd(), 'logs');
const BINARY_LOG_FILE = path.join(LOG_DIR, 'binary-matching.log');

function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function logBinary(message: string) {
  console.log(message);
  ensureLogDirectory();
  const timestamp = new Date().toISOString();
  fs.appendFileSync(BINARY_LOG_FILE, `[${timestamp}] ${message}\n`);
}

export interface BinaryMatchingConfig {
  payout_percentage: number;
  min_match_amount: number;
  max_daily_match: number;
  matching_ratio: string;
  cycle_payout: boolean;
}

export interface BinaryMatchResult {
  user_id: string;
  matched_volume: number;
  payout_amount: number;
  left_before: number;
  right_before: number;
  left_after: number;
  right_after: number;
}

/**
 * Get binary matching configuration from plan_settings
 */
async function getBinaryConfig(): Promise<BinaryMatchingConfig | null> {
  try {
    const result = await query(
      `SELECT payload FROM plan_settings WHERE feature_key = 'binary_matching' AND is_active = TRUE LIMIT 1`
    );

    if (result.rows.length === 0) {
      return null;
    }

    const payload = typeof result.rows[0].payload === 'string'
      ? JSON.parse(result.rows[0].payload)
      : result.rows[0].payload;

    return payload as BinaryMatchingConfig;
  } catch (error) {
    console.error('❌ Error getting binary config:', error);
    return null;
  }
}

/**
 * Update volume for a user and all ancestors in the binary tree
 * Called when a new investment is made
 */
export async function updateBinaryVolume(
  userId: string,
  investmentAmount: number
): Promise<void> {
  try {
    logBinary(`\n🔄 Updating binary volume for user ${userId}, amount: $${investmentAmount.toFixed(2)}`);

    // Check if binary plan is active
    const binaryActive = await isPlanActive('binary_plan');
    if (!binaryActive) {
      logBinary(`   ⚠️  Binary plan is inactive, skipping volume update`);
      return;
    }

    // Get user's binary tree node
    const nodeResult = await query(
      `SELECT id, parent_id, position FROM binary_tree WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (nodeResult.rows.length === 0) {
      logBinary(`   ⚠️  No binary tree node found for user ${userId}`);
      return;
    }

    const userNode = nodeResult.rows[0];
    let currentParentId = userNode.parent_id;
    let childPosition = userNode.position;
    let level = 1;

    // Traverse up the tree and update volumes
    while (currentParentId) {
      // Update parent's volume based on child position
      if (childPosition === 'left') {
        await query(
          `UPDATE binary_tree
           SET left_volume = left_volume + ?,
               left_unmatched = left_unmatched + ?,
               updated_at = NOW()
           WHERE id = ?`,
          [investmentAmount, investmentAmount, currentParentId]
        );
        logBinary(`   📈 Level ${level}: Updated LEFT volume by $${investmentAmount.toFixed(2)}`);
      } else if (childPosition === 'right') {
        await query(
          `UPDATE binary_tree
           SET right_volume = right_volume + ?,
               right_unmatched = right_unmatched + ?,
               updated_at = NOW()
           WHERE id = ?`,
          [investmentAmount, investmentAmount, currentParentId]
        );
        logBinary(`   📈 Level ${level}: Updated RIGHT volume by $${investmentAmount.toFixed(2)}`);
      }

      // Get next parent
      const parentResult = await query(
        `SELECT parent_id, position FROM binary_tree WHERE id = ? LIMIT 1`,
        [currentParentId]
      );

      if (parentResult.rows.length === 0) {
        break;
      }

      currentParentId = parentResult.rows[0].parent_id;
      childPosition = parentResult.rows[0].position;
      level++;
    }

    logBinary(`✅ Binary volume updated successfully through ${level} levels`);

  } catch (error) {
    const errorMsg = `❌ Binary volume update error for user ${userId}: ${error}`;
    console.error(errorMsg);
    ensureLogDirectory();
    fs.appendFileSync(BINARY_LOG_FILE, `[${new Date().toISOString()}] ${errorMsg}\n`);
  }
}

/**
 * Calculate and execute binary matching for a single user
 */
export async function calculateBinaryMatch(userId: string): Promise<BinaryMatchResult | null> {
  try {
    // Get binary config
    const config = await getBinaryConfig();
    if (!config) {
      return null;
    }

    // Get user's binary tree node with current volumes
    const nodeResult = await query(
      `SELECT user_id, left_volume, right_volume, left_unmatched, right_unmatched, matched_to_date
       FROM binary_tree
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (nodeResult.rows.length === 0) {
      return null;
    }

    const node = nodeResult.rows[0];
    const leftUnmatched = parseFloat(node.left_unmatched);
    const rightUnmatched = parseFloat(node.right_unmatched);

    // Calculate matched volume (minimum of left and right unmatched)
    const matchedVolume = Math.min(leftUnmatched, rightUnmatched);

    // Check minimum match amount
    if (matchedVolume < config.min_match_amount) {
      return null; // Not enough volume to match
    }

    // Calculate payout
    const payoutAmount = (matchedVolume * config.payout_percentage) / 100;

    // Check daily match limit
    const today = new Date().toISOString().split('T')[0];
    const dailyMatchResult = await query(
      `SELECT COALESCE(SUM(matched_volume), 0) as today_matched
       FROM binary_matches
       WHERE user_id = ? AND DATE(created_at) = ?`,
      [userId, today]
    );

    const todayMatched = parseFloat(dailyMatchResult.rows[0].today_matched);
    if (todayMatched + matchedVolume > config.max_daily_match) {
      logBinary(`   ⚠️  Daily match limit exceeded for user ${userId}`);
      return null;
    }

    // Update unmatched volumes
    const newLeftUnmatched = leftUnmatched - matchedVolume;
    const newRightUnmatched = rightUnmatched - matchedVolume;
    const newMatchedToDate = parseFloat(node.matched_to_date) + matchedVolume;

    await query(
      `UPDATE binary_tree
       SET left_unmatched = ?,
           right_unmatched = ?,
           matched_to_date = ?,
           last_matched_at = NOW(),
           updated_at = NOW()
       WHERE user_id = ?`,
      [newLeftUnmatched, newRightUnmatched, newMatchedToDate, userId]
    );

    // Record match history
    await query(
      `INSERT INTO binary_matches
       (user_id, matched_volume, left_volume_before, right_volume_before,
        left_volume_after, right_volume_after, payout_amount, payout_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        matchedVolume,
        leftUnmatched,
        rightUnmatched,
        newLeftUnmatched,
        newRightUnmatched,
        payoutAmount,
        config.payout_percentage
      ]
    );

    // Credit payout to user wallet
    await query(
      `UPDATE users
       SET wallet_balance = wallet_balance + ?,
           total_earnings = total_earnings + ?
       WHERE id = ?`,
      [payoutAmount, payoutAmount, userId]
    );

    // Record in payouts table
    await query(
      `INSERT INTO payouts (user_id, payout_type, amount, description, status)
       VALUES (?, 'binary_bonus', ?, ?, 'completed')`,
      [userId, payoutAmount, `Binary matching: ${matchedVolume.toFixed(2)} volume matched`]
    );

    // Record transaction
    await query(
      `INSERT INTO mlm_transactions
       (user_id, transaction_type, amount, description, status)
       VALUES (?, 'binary_bonus', ?, ?, 'completed')`,
      [userId, payoutAmount, `Binary match payout: ${matchedVolume.toFixed(2)} volume`]
    );

    logBinary(`   💰 Binary match executed: ${matchedVolume.toFixed(2)} volume → $${payoutAmount.toFixed(2)} payout`);

    return {
      user_id: userId,
      matched_volume: matchedVolume,
      payout_amount: payoutAmount,
      left_before: leftUnmatched,
      right_before: rightUnmatched,
      left_after: newLeftUnmatched,
      right_after: newRightUnmatched
    };

  } catch (error) {
    console.error('❌ Binary match calculation error:', error);
    return null;
  }
}

/**
 * Run binary matching for all users with sufficient volume
 * Can be called as a cron job or manually
 */
export async function runBinaryMatchingForAll(): Promise<{
  processed: number;
  matched: number;
  totalPayout: number;
}> {
  try {
    logBinary(`\n🔄 Starting binary matching run for all users...`);

    const config = await getBinaryConfig();
    if (!config) {
      logBinary(`   ⚠️  Binary matching not configured or inactive`);
      return { processed: 0, matched: 0, totalPayout: 0 };
    }

    // Get all users with unmatched volume above minimum
    const usersResult = await query(
      `SELECT user_id, left_unmatched, right_unmatched
       FROM binary_tree
       WHERE LEAST(left_unmatched, right_unmatched) >= ?
       ORDER BY matched_to_date ASC`,
      [config.min_match_amount]
    );

    let processed = 0;
    let matched = 0;
    let totalPayout = 0;

    for (const user of usersResult.rows) {
      processed++;
      const result = await calculateBinaryMatch(user.user_id);

      if (result) {
        matched++;
        totalPayout += result.payout_amount;
        logBinary(`   ✅ User ${user.user_id}: Matched ${result.matched_volume.toFixed(2)}, Payout $${result.payout_amount.toFixed(2)}`);
      }
    }

    logBinary(`\n📊 Binary matching summary: ${matched}/${processed} users matched, Total payout: $${totalPayout.toFixed(2)}\n`);

    return { processed, matched, totalPayout };

  } catch (error) {
    const errorMsg = `❌ Binary matching run error: ${error}`;
    console.error(errorMsg);
    ensureLogDirectory();
    fs.appendFileSync(BINARY_LOG_FILE, `[${new Date().toISOString()}] ${errorMsg}\n`);
    return { processed: 0, matched: 0, totalPayout: 0 };
  }
}

/**
 * Get binary matching stats for a user
 */
export async function getUserBinaryStats(userId: string) {
  try {
    const nodeResult = await query(
      `SELECT left_volume, right_volume, left_unmatched, right_unmatched, matched_to_date, last_matched_at
       FROM binary_tree
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (nodeResult.rows.length === 0) {
      return null;
    }

    const node = nodeResult.rows[0];
    const config = await getBinaryConfig();

    const matchableVolume = Math.min(
      parseFloat(node.left_unmatched),
      parseFloat(node.right_unmatched)
    );

    const potentialPayout = config
      ? (matchableVolume * config.payout_percentage) / 100
      : 0;

    return {
      left_volume: parseFloat(node.left_volume),
      right_volume: parseFloat(node.right_volume),
      left_unmatched: parseFloat(node.left_unmatched),
      right_unmatched: parseFloat(node.right_unmatched),
      matched_to_date: parseFloat(node.matched_to_date),
      matchable_volume: matchableVolume,
      potential_payout: potentialPayout,
      last_matched_at: node.last_matched_at
    };
  } catch (error) {
    console.error('❌ Error getting binary stats:', error);
    return null;
  }
}
