/**
 * Simple Wallet API Routes - Rebuilt from scratch
 * Returns clean JSON data with proper number types
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { submitWithdrawalRequest, getUserWithdrawals } from '../services/withdrawal.service';

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
 * Get withdrawal configuration - NO DEDUCTION for regular withdrawals
 */
router.get('/withdrawal/limits', async (req: Request, res: Response) => {
  try {
    // Regular withdrawals have NO deduction (0%)
    // Deduction only applies to stop-investment logic
    res.json({
      minimum_withdrawal: 10,           // Minimum $10
      deduction_percentage: 0,          // NO deduction for regular withdrawals
      networks: ['TRC20', 'BEP20', 'ERC20']
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
 * Get withdrawal history - USES PRODUCTION-READY SERVICE
 */
router.get('/withdrawals', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Use production-ready withdrawal service
    const withdrawals = await getUserWithdrawals(userId, undefined, 50);

    // Convert to clean format
    const formattedWithdrawals = withdrawals.map((w: any) => ({
      id: String(w.id),
      requested_amount: parseFloat(String(w.requested_amount || '0')),
      deduction_percentage: parseFloat(String(w.deduction_percentage || '0')),
      deduction_amount: parseFloat(String(w.deduction_amount || '0')),
      final_amount: parseFloat(String(w.final_amount || '0')),
      status: String(w.status || 'pending'),
      wallet_address: w.wallet_address,
      rejection_reason: w.rejection_reason ? String(w.rejection_reason) : null,
      created_at: w.created_at
    }));

    res.json(formattedWithdrawals);
  } catch (error: any) {
    console.error('❌ Withdrawals error:', error.message);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

/**
 * POST /api/wallet-simple/withdrawal
 * Submit withdrawal request - NO DEDUCTION (crypto withdrawal)
 */
router.post('/withdrawal', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, wallet_address, network } = req.body;

    // Validate inputs
    const numAmount = parseFloat(String(amount || '0'));
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!wallet_address || !wallet_address.trim()) {
      return res.status(400).json({ success: false, message: 'Wallet address required' });
    }

    // Validate network
    const validNetworks = ['TRC20', 'BEP20', 'ERC20'];
    const selectedNetwork = network || 'TRC20';
    if (!validNetworks.includes(selectedNetwork)) {
      return res.status(400).json({ success: false, message: 'Invalid network selected' });
    }

    // Use production-ready withdrawal service (NO DEDUCTION)
    const result = await submitWithdrawalRequest(
      userId,
      numAmount,
      wallet_address,
      'crypto',
      selectedNetwork
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: result.message,
      withdrawal_id: result.data?.withdrawal_id,
      requested_amount: result.data?.requested_amount,
      final_amount: result.data?.final_amount,
      network: selectedNetwork
    });
  } catch (error: any) {
    console.error('❌ Withdrawal submission error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit withdrawal' });
  }
});

export default router;
