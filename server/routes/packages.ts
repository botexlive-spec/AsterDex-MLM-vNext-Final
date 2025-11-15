/**
 * Package Purchase API Routes
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { cache, CacheKeys } from '../services/cache.service';

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
 * GET /api/packages
 * Get the SINGLE global investment package (slider-based)
 * NEW ARCHITECTURE: One package with $100-$100K slider
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get the single global package (ID=1)
    const result = await query(
      'SELECT * FROM packages WHERE id = 1 AND is_active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Global package not found' });
    }

    const pkg = result.rows[0];

    // Return single package optimized for slider UI
    const packageData = {
      id: pkg.id,
      name: pkg.name,
      min_investment: parseFloat(pkg.min_investment), // $100
      max_investment: parseFloat(pkg.max_investment), // $100,000
      daily_roi_percentage: parseFloat(pkg.daily_roi_percentage), // 0.4%
      duration_days: pkg.duration_days, // 36500 (100 years / lifetime)
      level_income_percentages: pkg.level_income_percentages || [],
      levels: 15, // 15-level commission
      binary_enabled: false, // No binary
      is_active: pkg.is_active,
      // Slider configuration
      slider_min: 100,
      slider_max: 100000,
      slider_step: 100,
      // Display info
      commission_type: 'roi_on_roi', // ROI on ROI (not ROI on investment)
      booster_available: true,
      monthly_reward_available: true,
    };

    res.json({ package: packageData });
  } catch (error: any) {
    console.error('❌ Get package error:', error);
    res.status(500).json({ error: 'Failed to get package' });
  }
});

/**
 * POST /api/packages/purchase
 * Purchase a package - LIFETIME ROI SYSTEM
 * New rules:
 * - Minimum $100
 * - Only multiples of $100
 * - No expiry date (lifetime ROI)
 * - No ROI limit (infinite until user stops)
 */
router.post('/purchase', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { package_id, investment_amount, idempotency_key } = req.body;

    // Validate input
    if (!package_id || !investment_amount) {
      return res.status(400).json({ error: 'Package ID and investment amount are required' });
    }

    const amount = parseFloat(investment_amount);

    // ✅ IDEMPOTENCY: Check if this investment already exists
    if (idempotency_key) {
      const existingInvestment = await query(
        'SELECT id, status FROM user_packages WHERE user_id = ? AND idempotency_key = ? LIMIT 1',
        [userId, idempotency_key]
      );

      if (existingInvestment.rows.length > 0) {
        const existing = existingInvestment.rows[0];
        return res.status(200).json({
          success: true,
          message: 'Investment already created (idempotency check)',
          investment_id: existing.id,
          status: existing.status,
          duplicate_prevented: true
        });
      }
    }

    // ✅ SINGLE PACKAGE VALIDATION: $100 - $100,000 in $100 multiples
    if (amount < 100) {
      return res.status(400).json({
        error: 'Minimum investment is $100',
        validation: { min: 100, max: 100000, step: 100 }
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        error: 'Maximum investment is $100,000',
        validation: { min: 100, max: 100000, step: 100 }
      });
    }

    if (amount % 100 !== 0) {
      return res.status(400).json({
        error: 'Investment must be in multiples of $100',
        validation: { min: 100, max: 100000, step: 100 }
      });
    }

    // Get the single global package (should always be ID=1)
    const packageResult = await query(
      'SELECT * FROM packages WHERE id = 1 AND is_active = true LIMIT 1'
    );

    if (packageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Global investment package not found' });
    }

    const packageData = packageResult.rows[0];

    // Get user data
    const userResult = await query(
      'SELECT wallet_balance FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const walletBalance = parseFloat(user.wallet_balance);

    // Check if user has sufficient balance
    if (walletBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        current_balance: walletBalance,
        required: amount
      });
    }

    // Calculate daily ROI
    const dailyROI = (amount * parseFloat(packageData.daily_roi_percentage)) / 100;

    // ✅ NEW: Lifetime ROI - no expiry date, no ROI limit
    const activationDate = new Date();

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotency_key || `inv_${userId}_${package_id}_${Date.now()}`;

    // Insert user package with lifetime ROI fields
    const userPackageResult = await query(
      `INSERT INTO user_packages
       (user_id, package_id, investment_amount, daily_roi_amount, total_roi_earned,
        status, activation_date, booster_activation_date, idempotency_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 'active', ?, ?, ?, NOW(), NOW())`,
      [userId, package_id, amount, dailyROI, activationDate, activationDate, finalIdempotencyKey]
    );

    const userPackageId = userPackageResult.insertId;

    // Deduct from wallet
    await query(
      'UPDATE users SET wallet_balance = wallet_balance - ?, total_investment = total_investment + ? WHERE id = ?',
      [amount, amount, userId]
    );

    // Get current wallet balance for transaction tracking
    const currentBalance = parseFloat(user.wallet_balance);
    const newBalance = currentBalance - amount;

    // Create transaction record with balance tracking
    await query(
      `INSERT INTO mlm_transactions
       (user_id, transaction_type, amount, description, status,
        reference_type, reference_id, balance_before, balance_after,
        created_at, updated_at)
       VALUES (?, 'withdrawal', ?, ?, 'completed', 'investment', ?, ?, ?, NOW(), NOW())`,
      [userId, amount, `Investment Purchase - ${packageData.name} - $${amount}`,
       String(userPackageId), currentBalance, newBalance]
    );

    // Distribute 30-level income commissions with eligibility checks
    try {
      const { distribute30LevelIncome } = await import('../services/level-income.service');
      await distribute30LevelIncome(userId, amount, package_id, String(userPackageId));
    } catch (error) {
      console.error(`⚠️  30-level income distribution failed:`, error);
      // Don't fail the entire purchase if level income fails
    }

    // Update binary tree volume for binary matching
    try {
      const { updateBinaryVolume } = await import('../services/binary-matching.service');
      await updateBinaryVolume(userId, amount);
      console.log(`📊 Binary volume updated for user ${userId}`);
    } catch (error) {
      console.error(`⚠️  Binary volume update failed for user ${userId}:`, error);
      // Don't fail the entire purchase if binary update fails
    }

    // Initialize or update booster
    try {
      const { initializeBooster, updateBoosterDirectCount } = await import('../services/booster.service');

      // Check if this is user's first investment (initialize booster)
      const firstPackageCheck = await query(
        'SELECT COUNT(*) as count FROM user_packages WHERE user_id = ?',
        [userId]
      );

      if (parseInt(firstPackageCheck.rows[0].count) === 1) {
        // This is first investment, initialize booster with investment details
        await initializeBooster(userId, String(userPackageId), amount);
        console.log(`🚀 Booster initialized for user ${userId} (Investment: $${amount})`);
      }

      // Get user's sponsor and update their booster count if they have active booster
      const userSponsor = await query(
        'SELECT sponsor_id FROM users WHERE id = ? LIMIT 1',
        [userId]
      );

      if (userSponsor.rows.length > 0 && userSponsor.rows[0].sponsor_id) {
        await updateBoosterDirectCount(userSponsor.rows[0].sponsor_id);
      }
    } catch (error) {
      console.error(`⚠️  Booster processing failed:`, error);
      // Don't fail the entire purchase if booster fails
    }

    console.log(`✅ Package purchased: User ${userId}, Package ${package_id}, Amount $${amount}`);

    // Invalidate user's dashboard cache since investment and earnings changed
    cache.delete(CacheKeys.userDashboard(userId));

    // Also invalidate sponsor's dashboard cache since their team stats may have changed
    const userSponsorResult = await query(
      'SELECT sponsor_id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (userSponsorResult.rows.length > 0 && userSponsorResult.rows[0].sponsor_id) {
      const sponsorId = userSponsorResult.rows[0].sponsor_id;
      cache.delete(CacheKeys.userDashboard(sponsorId));
      cache.delete(CacheKeys.binaryStats(sponsorId));
      cache.deletePattern(`genealogy:${sponsorId}:.*`);
    }

    res.json({
      success: true,
      message: 'Lifetime ROI investment created successfully',
      investment: {
        id: String(userPackageId),
        package_name: packageData.name,
        investment_amount: amount,
        daily_roi: dailyROI,
        activation_date: activationDate,
        status: 'active',
        lifetime_roi: true, // No expiry, no limit
        note: 'Investment will generate daily ROI indefinitely until you choose to stop it'
      }
    });

  } catch (error: any) {
    console.error('❌ Package purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase package' });
  }
});

/**
 * GET /api/packages/my-packages
 * Get user's purchased packages - LIFETIME ROI SYSTEM
 */
router.get('/my-packages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await query(
      `SELECT up.*, p.name as package_name, p.daily_roi_percentage
       FROM user_packages up
       JOIN packages p ON up.package_id = p.id
       WHERE up.user_id = ?
       ORDER BY up.created_at DESC`,
      [userId]
    );

    const packages = result.rows.map((pkg: any) => {
      const activationDate = new Date(pkg.activation_date);
      const now = new Date();
      const daysActive = Math.floor((now.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate 30-day booster timer
      const boosterDaysRemaining = pkg.status === 'active' && pkg.booster_activation_date
        ? Math.max(0, 30 - Math.floor((now.getTime() - new Date(pkg.booster_activation_date).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        id: pkg.id,
        package_name: pkg.package_name,
        investment_amount: parseFloat(pkg.investment_amount),
        daily_roi_amount: parseFloat(pkg.daily_roi_amount),
        total_roi_earned: parseFloat(pkg.total_roi_earned || 0),
        status: pkg.status,
        activation_date: pkg.activation_date,
        days_active: daysActive,
        booster_days_remaining: boosterDaysRemaining,
        // Lifetime ROI fields
        is_lifetime: true,
        stop_date: pkg.stop_date,
        penalty_percentage: pkg.stop_penalty_percentage ? parseFloat(pkg.stop_penalty_percentage) : null,
        principal_remaining: pkg.principal_remaining ? parseFloat(pkg.principal_remaining) : null,
        withdrawal_date: pkg.withdrawal_date,
        can_stop: pkg.status === 'active',
        can_withdraw: pkg.status === 'stopped' && !pkg.withdrawal_date
      };
    });

    res.json({ investments: packages }); // Changed from 'packages' to 'investments'
  } catch (error: any) {
    console.error('❌ Get my investments error:', error);
    res.status(500).json({ error: 'Failed to get investments' });
  }
});

export default router;
