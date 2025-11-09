/**
 * Level Unlocks API Routes
 * Endpoints for generation plan level unlock status and progress
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { getGenerationPlanConfig } from '../services/planSettings.service';
import { getUserLevelUnlocks, updateUserLevelUnlocks } from '../services/generation-plan.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finaster_jwt_secret_key_change_in_production_2024';

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * GET /api/level-unlocks/status
 * Get current user's level unlock status (30 levels)
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get level unlock status using generation plan service
    const status = await getUserLevelUnlocks(userId);

    // Build array of level status
    const levels = [];
    for (let i = 1; i <= 30; i++) {
      levels.push({
        level: i,
        is_unlocked: status.levelStatus[i] || false
      });
    }

    res.json({
      success: true,
      level_unlocks: {
        direct_count: status.directCount,
        unlocked_levels: status.totalUnlocked,
        levels,
        next_milestone: status.nextMilestone
      }
    });
  } catch (error: any) {
    console.error('❌ Get level unlock status error:', error);
    res.status(500).json({ error: 'Failed to get level unlock status' });
  }
});

/**
 * GET /api/level-unlocks/progress
 * Get progress toward next level unlock (30 levels)
 */
router.get('/progress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get level unlock status using generation plan service
    const status = await getUserLevelUnlocks(userId);

    // Define all milestones (30 levels)
    const milestones = [
      { directs: 1, levels: [1] },
      { directs: 2, levels: [2] },
      { directs: 3, levels: [3] },
      { directs: 4, levels: [4] },
      { directs: 5, levels: [5] },
      { directs: 6, levels: [6] },
      { directs: 7, levels: [7] },
      { directs: 8, levels: [8] },
      { directs: 9, levels: [9, 10] },
      { directs: 10, levels: [11, 12, 13, 14, 15] },
      { directs: 15, levels: [16, 17, 18, 19, 20] },
      { directs: 20, levels: [21, 22, 23, 24, 25] },
      { directs: 25, levels: [26, 27, 28, 29, 30] }
    ];

    // Calculate progress
    let progress = 0;
    let directsNeeded = 0;
    let currentMilestone = null;

    if (status.nextMilestone) {
      // Find current milestone
      for (const m of milestones) {
        if (status.directCount >= m.directs) {
          currentMilestone = m;
        }
      }

      const prevDirects = currentMilestone ? currentMilestone.directs : 0;
      const totalNeeded = status.nextMilestone.threshold - prevDirects;
      const currentProgress = status.directCount - prevDirects;
      progress = totalNeeded > 0 ? (currentProgress / totalNeeded) * 100 : 0;
      directsNeeded = status.nextMilestone.directsNeeded;
    } else {
      // Max level achieved
      progress = 100;
      directsNeeded = 0;
    }

    res.json({
      success: true,
      progress: {
        current_directs: status.directCount,
        current_unlocked_levels: status.totalUnlocked,
        next_unlock_at_directs: status.nextMilestone?.threshold || null,
        next_unlock_levels: status.nextMilestone?.levelsToUnlock || null,
        directs_needed: directsNeeded,
        progress_percentage: Math.min(100, Math.max(0, progress)),
        is_max_level: !status.nextMilestone,
        milestones
      }
    });
  } catch (error: any) {
    console.error('❌ Get level unlock progress error:', error);
    res.status(500).json({ error: 'Failed to get level unlock progress' });
  }
});

/**
 * GET /api/level-unlocks/percentages
 * Get ROI-on-ROI percentages for each level
 */
router.get('/percentages', async (req: Request, res: Response) => {
  try {
    const config = await getGenerationPlanConfig();

    if (!config) {
      return res.status(404).json({ error: 'Generation plan configuration not found' });
    }

    const percentages = config.level_percentages.map((percentage, index) => ({
      level: index + 1,
      percentage
    }));

    res.json({
      success: true,
      percentages,
      total_percentage: config.level_percentages.reduce((sum, p) => sum + p, 0)
    });
  } catch (error: any) {
    console.error('❌ Get level percentages error:', error);
    res.status(500).json({ error: 'Failed to get level percentages' });
  }
});

/**
 * GET /api/level-unlocks/my-levels
 * Get detailed info about user's unlocked levels with percentages (30 levels)
 */
router.get('/my-levels', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get level unlock status using generation plan service
    const status = await getUserLevelUnlocks(userId);

    // Get level income configuration for percentages
    const configResult = await query(
      `SELECT payload FROM plan_settings
       WHERE feature_key = 'level_income_30' AND is_active = 1
       LIMIT 1`
    );

    let levelPercentages: number[] = [];
    if (configResult.rows.length > 0) {
      const config = configResult.rows[0].payload;
      levelPercentages = config.level_percentages || [];
    }

    // Build detailed level info for all 30 levels
    const levels = [];
    for (let i = 1; i <= 30; i++) {
      const isUnlocked = status.levelStatus[i] || false;
      levels.push({
        level: i,
        is_unlocked: isUnlocked,
        level_income_percentage: levelPercentages[i - 1] || 0,
        status: isUnlocked ? 'unlocked' : 'locked'
      });
    }

    // Calculate total earning potential
    const unlockedPercentage = levels
      .filter(l => l.is_unlocked)
      .reduce((sum, l) => sum + l.level_income_percentage, 0);

    res.json({
      success: true,
      levels,
      unlocked_count: status.totalUnlocked,
      total_earning_potential: unlockedPercentage,
      direct_count: status.directCount,
      next_milestone: status.nextMilestone
    });
  } catch (error: any) {
    console.error('❌ Get my levels error:', error);
    res.status(500).json({ error: 'Failed to get level details' });
  }
});

export default router;
