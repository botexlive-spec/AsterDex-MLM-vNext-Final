/**
 * Simple Wallet API Routes - Rebuilt from scratch
 * Returns clean JSON data with proper number types
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finaster_mlm_jwt_secret_key_change_in_production_2024';

// Authentication middleware
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

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/wallet-simple/balance
 * Get wallet balance - returns clean numbers
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get wallet balance from users table
    const result = await query(
      'SELECT wallet_balance FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.json({
        total: 0,
        available: 0,
        locked: 0,
        pending: 0
      });
    }

    // Convert to plain number
    const balance = parseFloat(String(result.rows[0].wallet_balance || '0'));

    res.json({
      total: balance,
      available: balance,
      locked: 0,
      pending: 0
    });
  } catch (error: any) {
    console.error('❌ Wallet balance error:', error.message);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

/**
 * GET /api/wallet-simple/withdrawal/limits
 * Get withdrawal configuration
 */
router.get('/withdrawal/limits', async (req: Request, res: Response) => {
  try {
    // Get withdrawal configuration from plan_settings
    const result = await query(
      'SELECT payload FROM plan_settings WHERE feature_key = ? LIMIT 1',
      ['principal_withdrawal']
    );

    if (result.rows.length === 0) {
      // Return defaults
      return res.json({
        minimum_withdrawal: 50,
        deduction_before_30_days: 15,
        deduction_after_30_days: 5
      });
    }

    const payload = typeof result.rows[0].payload === 'string'
      ? JSON.parse(result.rows[0].payload)
      : result.rows[0].payload;

    // Return as plain numbers
    res.json({
      minimum_withdrawal: parseFloat(String(payload.minimum_withdrawal || '50')),
      deduction_before_30_days: parseFloat(String(payload.deduction_before_30_days || '15')),
      deduction_after_30_days: parseFloat(String(payload.deduction_after_30_days || '5'))
    });
  } catch (error: any) {
    console.error('❌ Withdrawal limits error:', error.message);
    res.status(500).json({ error: 'Failed to get withdrawal limits' });
  }
});

/**
 * GET /api/wallet-simple/transactions/pending
 * Get pending transactions
 */
router.get('/transactions/pending', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await query(
      `SELECT
        id,
        transaction_type,
        amount,
        status,
        created_at
       FROM mlm_transactions
       WHERE user_id = ?
       AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    // Convert amounts to plain numbers
    const transactions = (result.rows || []).map((tx: any) => ({
      id: String(tx.id),
      transaction_type: String(tx.transaction_type),
      amount: parseFloat(String(tx.amount || '0')),
      status: String(tx.status),
      created_at: tx.created_at
    }));

    res.json(transactions);
  } catch (error: any) {
    console.error('❌ Pending transactions error:', error.message);
    res.status(500).json({ error: 'Failed to get pending transactions' });
  }
});

/**
 * GET /api/wallet-simple/transactions
 * Get recent transactions
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10), 1), 100);

    const result = await query(
      `SELECT
        id,
        transaction_type,
        amount,
        status,
        description,
        created_at
       FROM mlm_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      [userId]
    );

    // Convert amounts to plain numbers
    const transactions = (result.rows || []).map((tx: any) => ({
      id: String(tx.id),
      transaction_type: String(tx.transaction_type),
      amount: parseFloat(String(tx.amount || '0')),
      status: String(tx.status),
      description: String(tx.description || ''),
      created_at: tx.created_at
    }));

    res.json(transactions);
  } catch (error: any) {
    console.error('❌ Transactions error:', error.message);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * GET /api/wallet-simple/withdrawals
 * Get withdrawal history
 */
router.get('/withdrawals', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await query(
      `SELECT
        id,
        withdrawal_type,
        requested_amount,
        deduction_percentage,
        deduction_amount,
        final_amount,
        status,
        rejection_reason,
        days_held,
        created_at
       FROM withdrawal_requests
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    // Convert amounts to plain numbers
    const withdrawals = (result.rows || []).map((w: any) => ({
      id: String(w.id),
      withdrawal_type: String(w.withdrawal_type || 'roi'),
      requested_amount: parseFloat(String(w.requested_amount || '0')),
      deduction_percentage: parseFloat(String(w.deduction_percentage || '0')),
      deduction_amount: parseFloat(String(w.deduction_amount || '0')),
      final_amount: parseFloat(String(w.final_amount || '0')),
      status: String(w.status || 'pending'),
      rejection_reason: w.rejection_reason ? String(w.rejection_reason) : null,
      days_held: w.days_held ? parseFloat(String(w.days_held)) : null,
      created_at: w.created_at
    }));

    res.json(withdrawals);
  } catch (error: any) {
    console.error('❌ Withdrawals error:', error.message);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

/**
 * POST /api/wallet-simple/withdrawal
 * Submit withdrawal request
 */
router.post('/withdrawal', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, withdrawal_type, wallet_address } = req.body;

    // Validate inputs
    const numAmount = parseFloat(String(amount || '0'));
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!wallet_address || !wallet_address.trim()) {
      return res.status(400).json({ success: false, message: 'Wallet address required' });
    }

    // Get user balance
    const userResult = await query(
      'SELECT wallet_balance FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const balance = parseFloat(String(userResult.rows[0].wallet_balance || '0'));

    // Check sufficient balance
    if (numAmount > balance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${balance.toFixed(2)}`
      });
    }

    // Get withdrawal limits
    const limitsResult = await query(
      'SELECT payload FROM plan_settings WHERE feature_key = ? LIMIT 1',
      ['principal_withdrawal']
    );

    let minimumWithdrawal = 50;
    let deductionBefore30 = 15;
    let deductionAfter30 = 5;

    if (limitsResult.rows.length > 0) {
      const payload = typeof limitsResult.rows[0].payload === 'string'
        ? JSON.parse(limitsResult.rows[0].payload)
        : limitsResult.rows[0].payload;

      minimumWithdrawal = parseFloat(String(payload.minimum_withdrawal || '50'));
      deductionBefore30 = parseFloat(String(payload.deduction_before_30_days || '15'));
      deductionAfter30 = parseFloat(String(payload.deduction_after_30_days || '5'));
    }

    // Check minimum withdrawal
    if (numAmount < minimumWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is $${minimumWithdrawal.toFixed(2)}`
      });
    }

    // Calculate deduction (for principal only)
    let deductionPercentage = 0;
    let deductionAmount = 0;
    let finalAmount = numAmount;

    if (withdrawal_type === 'principal') {
      // For now, use higher deduction (would check days_held in production)
      deductionPercentage = deductionBefore30;
      deductionAmount = (numAmount * deductionPercentage) / 100;
      finalAmount = numAmount - deductionAmount;
    }

    // Insert withdrawal request
    const insertResult = await query(
      `INSERT INTO withdrawal_requests (
        user_id,
        withdrawal_type,
        requested_amount,
        deduction_percentage,
        deduction_amount,
        final_amount,
        wallet_address,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        userId,
        withdrawal_type || 'roi',
        numAmount,
        deductionPercentage,
        deductionAmount,
        finalAmount,
        wallet_address
      ]
    );

    // Lock the amount in user balance (deduct from available balance)
    await query(
      'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
      [numAmount, userId]
    );

    // Create transaction record
    await query(
      `INSERT INTO mlm_transactions (
        user_id,
        transaction_type,
        amount,
        status,
        description,
        created_at
      ) VALUES (?, 'withdrawal', ?, 'pending', ?, NOW())`,
      [
        userId,
        -numAmount,
        `Withdrawal request - ${withdrawal_type || 'roi'} - ${wallet_address.substring(0, 10)}...`
      ]
    );

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal_id: String(insertResult.insertId)
    });
  } catch (error: any) {
    console.error('❌ Withdrawal submission error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit withdrawal' });
  }
});

export default router;
