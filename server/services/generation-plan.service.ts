/**
 * Generation Plan Service
 * Manages level unlocks based on direct referral count
 */

import { query } from '../db';

/**
 * Level unlock rules based on direct referral count
 * These define which levels get unlocked at each direct_count milestone
 */
const LEVEL_UNLOCK_RULES: Record<number, number[]> = {
  1: [1],                          // 1 direct → unlock L1
  2: [2],                          // 2 directs → unlock L2
  3: [3],                          // 3 directs → unlock L3
  4: [4],                          // 4 directs → unlock L4
  5: [5],                          // 5 directs → unlock L5
  6: [6],                          // 6 directs → unlock L6
  7: [7],                          // 7 directs → unlock L7
  8: [8],                          // 8 directs → unlock L8
  9: [9, 10],                      // 9 directs → unlock L9-L10
  10: [11, 12, 13, 14, 15],        // 10 directs → unlock L11-L15
  15: [16, 17, 18, 19, 20],        // 15 directs → unlock L16-L20
  20: [21, 22, 23, 24, 25],        // 20 directs → unlock L21-L25
  25: [26, 27, 28, 29, 30],        // 25 directs → unlock L26-L30
};

/**
 * Calculate which levels should be unlocked based on direct count
 */
export function calculateUnlockedLevels(directCount: number): number[] {
  const unlocked: number[] = [];

  // Apply unlock rules
  for (const [threshold, levels] of Object.entries(LEVEL_UNLOCK_RULES)) {
    if (directCount >= parseInt(threshold)) {
      unlocked.push(...levels);
    }
  }

  return unlocked.sort((a, b) => a - b);
}

/**
 * Get next unlock milestone
 */
export function getNextUnlockMilestone(directCount: number): {
  nextThreshold: number;
  levelsToUnlock: number[];
  directsNeeded: number;
} | null {
  const thresholds = Object.keys(LEVEL_UNLOCK_RULES).map(Number).sort((a, b) => a - b);

  for (const threshold of thresholds) {
    if (directCount < threshold) {
      return {
        nextThreshold: threshold,
        levelsToUnlock: LEVEL_UNLOCK_RULES[threshold],
        directsNeeded: threshold - directCount
      };
    }
  }

  return null; // All levels unlocked
}

/**
 * Update user's level unlocks based on their current direct referral count
 */
export async function updateUserLevelUnlocks(userId: string): Promise<{
  success: boolean;
  directCount: number;
  unlockedLevels: number[];
  newUnlocks?: number[];
}> {
  try {
    console.log(`\n🔓 Updating level unlocks for user ${userId}...`);

    // Get current direct referral count
    const directCountResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE sponsor_id = ?',
      [userId]
    );
    const directCount = parseInt(directCountResult.rows[0].count);

    console.log(`   📊 Direct referral count: ${directCount}`);

    // Calculate which levels should be unlocked
    const shouldBeUnlocked = calculateUnlockedLevels(directCount);
    console.log(`   🎯 Levels to unlock: ${shouldBeUnlocked.join(', ')}`);

    // Get current unlocked levels from database
    const currentResult = await query(
      'SELECT * FROM level_unlocks WHERE user_id = ? LIMIT 1',
      [userId]
    );

    let currentUnlocked: number[] = [];
    if (currentResult.rows.length > 0) {
      const row = currentResult.rows[0];
      for (let i = 1; i <= 30; i++) {
        if (row[`level_${i}_unlocked`]) {
          currentUnlocked.push(i);
        }
      }
    }

    // Find new unlocks
    const newUnlocks = shouldBeUnlocked.filter(level => !currentUnlocked.includes(level));

    if (newUnlocks.length > 0) {
      console.log(`   ✨ New unlocks: L${newUnlocks.join(', L')}`);
    } else {
      console.log(`   ✅ No new unlocks (already at correct state)`);
    }

    // Build UPDATE query with all level flags
    const levelFlags: string[] = [];
    const values: any[] = [];

    for (let i = 1; i <= 30; i++) {
      levelFlags.push(`level_${i}_unlocked = ?`);
      values.push(shouldBeUnlocked.includes(i) ? 1 : 0);
    }

    // Add direct_count and unlocked_levels (total count)
    values.push(directCount, shouldBeUnlocked.length, userId);

    // Upsert into level_unlocks table
    if (currentResult.rows.length === 0) {
      // Insert new record
      await query(
        `INSERT INTO level_unlocks
         (user_id, direct_count, unlocked_levels, ${levelFlags.map((_, i) => `level_${i + 1}_unlocked`).join(', ')}, created_at, updated_at)
         VALUES (?, ?, ?, ${values.slice(0, 30).map(() => '?').join(', ')}, NOW(), NOW())`,
        [userId, directCount, shouldBeUnlocked.length, ...values.slice(0, 30)]
      );
      console.log(`   💾 Created new level_unlocks record`);
    } else {
      // Update existing record
      await query(
        `UPDATE level_unlocks SET
         ${levelFlags.join(', ')},
         direct_count = ?,
         unlocked_levels = ?,
         updated_at = NOW()
         WHERE user_id = ?`,
        values
      );
      console.log(`   💾 Updated level_unlocks record`);
    }

    console.log(`✅ Level unlocks updated successfully\n`);

    return {
      success: true,
      directCount,
      unlockedLevels: shouldBeUnlocked,
      newUnlocks: newUnlocks.length > 0 ? newUnlocks : undefined
    };

  } catch (error) {
    console.error(`❌ Error updating level unlocks for user ${userId}:`, error);
    return {
      success: false,
      directCount: 0,
      unlockedLevels: []
    };
  }
}

/**
 * Get user's level unlock status
 */
export async function getUserLevelUnlocks(userId: string): Promise<{
  directCount: number;
  unlockedLevels: number[];
  totalUnlocked: number;
  nextMilestone: {
    threshold: number;
    levelsToUnlock: number[];
    directsNeeded: number;
  } | null;
  levelStatus: Record<number, boolean>;
}> {
  try {
    // Get or create level unlocks record
    let result = await query(
      'SELECT * FROM level_unlocks WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create initial record
      await updateUserLevelUnlocks(userId);
      result = await query(
        'SELECT * FROM level_unlocks WHERE user_id = ? LIMIT 1',
        [userId]
      );
    }

    const row = result.rows[0];
    const directCount = row.direct_count || 0;
    const unlockedLevels: number[] = [];
    const levelStatus: Record<number, boolean> = {};

    for (let i = 1; i <= 30; i++) {
      const isUnlocked = row[`level_${i}_unlocked`] === 1;
      levelStatus[i] = isUnlocked;
      if (isUnlocked) {
        unlockedLevels.push(i);
      }
    }

    const nextMilestone = getNextUnlockMilestone(directCount);

    return {
      directCount,
      unlockedLevels,
      totalUnlocked: unlockedLevels.length,
      nextMilestone,
      levelStatus
    };

  } catch (error) {
    console.error(`❌ Error getting level unlocks for user ${userId}:`, error);
    return {
      directCount: 0,
      unlockedLevels: [],
      totalUnlocked: 0,
      nextMilestone: null,
      levelStatus: {}
    };
  }
}

/**
 * Initialize level unlocks for all existing users
 * Run this once to populate level_unlocks for all users
 */
export async function initializeLevelUnlocksForAllUsers(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  console.log('\n🔄 Initializing level unlocks for all users...\n');

  try {
    // Get all user IDs
    const usersResult = await query('SELECT id FROM users');
    const users = usersResult.rows;

    let processed = 0;
    let errors = 0;

    for (const user of users) {
      const result = await updateUserLevelUnlocks(user.id);
      if (result.success) {
        processed++;
      } else {
        errors++;
      }
    }

    console.log(`\n✅ Level unlocks initialization complete:`);
    console.log(`   Processed: ${processed} users`);
    console.log(`   Errors: ${errors}\n`);

    return { success: true, processed, errors };

  } catch (error) {
    console.error('❌ Error initializing level unlocks:', error);
    return { success: false, processed: 0, errors: 0 };
  }
}
