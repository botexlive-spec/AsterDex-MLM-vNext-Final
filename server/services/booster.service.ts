/**
 * Booster Income Service
 * Manages 30-day booster countdown and direct referral tracking
 */

import { query } from '../db';
import { getBoosterIncomeConfig, isPlanActive } from './planSettings.service';

export interface Booster {
  id: string;
  user_id: string;
  start_date: Date;
  end_date: Date;
  direct_count: number;
  target_directs: number;
  bonus_roi_percentage: number;
  status: 'active' | 'achieved' | 'expired';
  days_remaining?: number;
}

/**
 * Initialize booster for user on first investment
 * NEW: Links to specific investment, uses activation_date as timer start
 */
export async function initializeBooster(userId: string, investmentId?: string, investmentAmount?: number): Promise<void> {
  try {
    // Check if booster plan is active
    const boosterActive = await isPlanActive('booster_income');
    if (!boosterActive) {
      console.log('Booster income plan is inactive');
      return;
    }

    // Check if user already has an active booster
    const existingBooster = await query(
      `SELECT * FROM boosters WHERE user_id = ? AND status IN ('active', 'achieved') LIMIT 1`,
      [userId]
    );

    if (existingBooster.rows.length > 0) {
      console.log('User already has an active booster');
      return;
    }

    // Get booster configuration
    const config = await getBoosterIncomeConfig();
    if (!config) {
      console.log('Booster configuration not found');
      return;
    }

    // Get investment details if not provided
    if (!investmentId || !investmentAmount) {
      const investmentResult = await query(
        `SELECT id, investment_amount, booster_activation_date
         FROM user_packages
         WHERE user_id = ? AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (investmentResult.rows.length > 0) {
        investmentId = investmentResult.rows[0].id;
        investmentAmount = parseFloat(investmentResult.rows[0].investment_amount);
      }
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // Booster runs for 30 days

    // ✅ Create booster record linked to investment (30-day window)
    await query(
      `INSERT INTO boosters (
        user_id, investment_id, investment_amount, start_date, end_date, qualified_directs,
        target_directs, bonus_roi_percentage, reward_credited, status
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0, 'active')`,
      [
        userId,
        investmentId || null,
        investmentAmount || 0,
        startDate,
        endDate,
        config.required_directs || 3,
        config.bonus_roi_percentage || 0.10
      ]
    );

    // Update first_investment_date in users table
    await query(
      'UPDATE users SET first_investment_date = ? WHERE id = ? AND first_investment_date IS NULL',
      [startDate, userId]
    );

    console.log(`✅ Booster initialized for user ${userId} (30-day timer, ${config.required_directs} directs required with ≥$${investmentAmount})`);
  } catch (error) {
    console.error('Error initializing booster:', error);
    throw error;
  }
}

/**
 * Update booster direct count when new referral is added or makes investment
 * NEW RULES:
 * - Must be within 30 days of sponsor's investment activation
 * - Counts only directs WITH active investments of equal or higher amount
 * - Credit reward ONCE when conditions met
 */
export async function updateBoosterDirectCount(sponsorId: string): Promise<void> {
  try {
    // Get active booster with investment details
    const boosterResult = await query(
      `SELECT b.*, up.investment_amount, up.booster_activation_date
       FROM boosters b
       LEFT JOIN user_packages up ON b.investment_id = up.id
       WHERE b.user_id = ? AND b.status = 'active'
       LIMIT 1`,
      [sponsorId]
    );

    if (boosterResult.rows.length === 0) {
      return;
    }

    const booster = boosterResult.rows[0];
    const sponsorInvestmentAmount = parseFloat(booster.investment_amount || 0);
    const boosterStartDate = new Date(booster.start_date);
    const now = new Date();

    // ✅ Calculate days remaining (30-day timer)
    const daysElapsed = Math.floor((now.getTime() - boosterStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 30 - daysElapsed);

    // Check if booster expired
    if (daysRemaining === 0) {
      await query(
        `UPDATE boosters SET status = 'expired', updated_at = NOW() WHERE id = ?`,
        [booster.id]
      );
      console.log(`⏰ Booster expired for ${sponsorId} (30 days elapsed)`);
      return;
    }

    // ✅ Count qualified directs: active investment >= sponsor's amount
    const qualifiedDirectsResult = await query(
      `SELECT COUNT(DISTINCT u.id) as qualified_count
       FROM users u
       INNER JOIN user_packages up ON u.id = up.user_id
       WHERE u.sponsor_id = ?
         AND u.is_active = TRUE
         AND up.status = 'active'
         AND up.investment_amount >= ?`,
      [sponsorId, sponsorInvestmentAmount]
    );

    const qualifiedDirects = parseInt(qualifiedDirectsResult.rows[0].qualified_count || 0);

    console.log(`📊 Booster check for ${sponsorId}: ${qualifiedDirects}/${booster.target_directs} qualified directs (≥$${sponsorInvestmentAmount}), ${daysRemaining} days remaining`);

    // Update booster counts
    await query(
      'UPDATE boosters SET qualified_directs = ?, updated_at = NOW() WHERE id = ?',
      [qualifiedDirects, booster.id]
    );

    // ✅ Check if target achieved (and not already rewarded)
    if (qualifiedDirects >= booster.target_directs && booster.status === 'active' && !booster.reward_credited) {
      // Calculate reward amount (typically a percentage of investment or fixed amount)
      const rewardAmount = sponsorInvestmentAmount * 0.10; // 10% of investment as reward

      // Get sponsor's current wallet balance
      const userResult = await query(
        'SELECT wallet_balance FROM users WHERE id = ? LIMIT 1',
        [sponsorId]
      );
      const currentBalance = parseFloat(userResult.rows[0].wallet_balance);
      const newBalance = currentBalance + rewardAmount;

      // Credit reward to wallet
      await query(
        `UPDATE users
         SET wallet_balance = wallet_balance + ?,
             total_earnings = total_earnings + ?,
             booster_earnings = booster_earnings + ?
         WHERE id = ?`,
        [rewardAmount, rewardAmount, rewardAmount, sponsorId]
      );

      // Create transaction record
      const txIdempotencyKey = `booster_reward_${booster.id}`;
      await query(
        `INSERT INTO mlm_transactions
         (user_id, transaction_type, amount, description, status,
          reference_type, reference_id, balance_before, balance_after,
          idempotency_key, created_at, updated_at)
         VALUES (?, 'booster_reward', ?, ?, 'completed', 'booster', ?, ?, ?, ?, NOW(), NOW())`,
        [
          sponsorId,
          rewardAmount,
          `Booster achievement reward - ${qualifiedDirects} qualified directs`,
          booster.id,
          currentBalance,
          newBalance,
          txIdempotencyKey
        ]
      );

      // Update booster status
      await query(
        `UPDATE boosters
         SET status = 'achieved',
             reward_credited = 1,
             reward_amount = ?,
             achieved_date = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [rewardAmount, booster.id]
      );

      console.log(`🎉 Booster achieved for ${sponsorId}: ${qualifiedDirects}/${booster.target_directs} qualified directs! Reward: $${rewardAmount.toFixed(2)}`);

      // Apply booster to active packages
      await query(
        `UPDATE user_packages
         SET has_booster = TRUE,
             booster_roi_percentage = ?,
             updated_at = NOW()
         WHERE user_id = ? AND status = 'active'`,
        [booster.bonus_roi_percentage, sponsorId]
      );
    }
  } catch (error) {
    console.error('Error updating booster direct count:', error);
    throw error;
  }
}

/**
 * Get booster status for user
 * Counts only directs WITH active investments
 */
export async function getBoosterStatus(userId: string): Promise<Booster | null> {
  try {
    const result = await query(
      `SELECT b.*,
       (SELECT COUNT(DISTINCT u.id)
        FROM users u
        INNER JOIN user_packages up ON u.id = up.user_id
        WHERE u.sponsor_id = ?
        AND u.is_active = TRUE
        AND up.status = 'active'
       ) as current_directs,
       DATEDIFF(b.end_date, NOW()) as days_remaining
       FROM boosters b
       WHERE b.user_id = ? AND b.status IN ('active', 'achieved')
       ORDER BY b.created_at DESC
       LIMIT 1`,
      [userId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      user_id: row.user_id,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
      direct_count: parseInt(row.current_directs),
      target_directs: row.target_directs,
      bonus_roi_percentage: parseFloat(row.bonus_roi_percentage),
      status: row.status,
      days_remaining: Math.max(0, row.days_remaining || 0)
    };
  } catch (error) {
    console.error('Error getting booster status:', error);
    return null;
  }
}

/**
 * Check and expire boosters
 * Should be run daily via cron
 */
export async function expireBoostersDaily(): Promise<number> {
  try {
    const result = await query(
      `UPDATE boosters
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'active'
       AND end_date < NOW()`
    );

    const expiredCount = result.affectedRows || 0;

    if (expiredCount > 0) {
      console.log(`⏰ Expired ${expiredCount} boosters`);

      // Remove booster from active packages
      await query(
        `UPDATE user_packages up
         INNER JOIN boosters b ON up.user_id = b.user_id
         SET up.has_booster = FALSE,
             up.booster_roi_percentage = 0,
             up.updated_at = NOW()
         WHERE b.status = 'expired'
         AND up.status = 'active'
         AND up.has_booster = TRUE`
      );
    }

    return expiredCount;
  } catch (error) {
    console.error('Error expiring boosters:', error);
    return 0;
  }
}

/**
 * Get all active boosters (for admin)
 */
export async function getAllActiveBoosters(): Promise<Booster[]> {
  try {
    const result = await query(
      `SELECT b.*,
       u.email, u.full_name,
       (SELECT COUNT(*) FROM users WHERE sponsor_id = b.user_id AND is_active = TRUE) as current_directs,
       DATEDIFF(b.end_date, NOW()) as days_remaining
       FROM boosters b
       JOIN users u ON b.user_id = u.id
       WHERE b.status IN ('active', 'achieved')
       ORDER BY b.end_date ASC`
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
      direct_count: parseInt(row.current_directs),
      target_directs: row.target_directs,
      bonus_roi_percentage: parseFloat(row.bonus_roi_percentage),
      status: row.status,
      days_remaining: Math.max(0, row.days_remaining || 0)
    }));
  } catch (error) {
    console.error('Error getting all active boosters:', error);
    return [];
  }
}
