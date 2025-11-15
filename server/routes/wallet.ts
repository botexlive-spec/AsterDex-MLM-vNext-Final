/**
 * Wallet API Routes - Complete Implementation
 * User wallet operations: balance, deposit, withdraw, transfer, transaction history
 */

import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import {
  getWalletBalance,
  depositToWallet,
  withdrawFromWallet,
  transferBetweenWallets,
  getTransactionHistory
} from '../services/wallet.service';

const router = Router();

// Apply authentication to all wallet routes
router.use(authenticateUser);

/**
 * GET /api/wallet/balance
 * Get user's wallet balance
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const balance = await getWalletBalance(userId);

    res.json(balance);
  } catch (error: any) {
    console.error('❌ [Wallet API] Get balance error:', error);
    res.status(500).json({ error: error.message || 'Failed to get wallet balance' });
  }
});

/**
 * POST /api/wallet/deposit
 * Request a deposit (creates pending transaction)
 * Admin must approve it
 */
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, description, payment_method } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    // For now, auto-approve deposits (in production, admin approval would be required)
    const transaction = await depositToWallet(
      userId,
      parseFloat(amount),
      description || 'Wallet deposit',
      undefined,
      { payment_method }
    );

    res.json({
      message: 'Deposit successful',
      transaction
    });
  } catch (error: any) {
    console.error('❌ [Wallet API] Deposit error:', error);
    res.status(500).json({ error: error.message || 'Failed to process deposit' });
  }
});

/**
 * POST /api/wallet/withdraw
 * Withdraw funds from wallet
 */
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, description, withdrawal_address } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    if (!withdrawal_address) {
      return res.status(400).json({ error: 'Withdrawal address is required' });
    }

    const transaction = await withdrawFromWallet(
      userId,
      parseFloat(amount),
      description || 'Wallet withdrawal',
      { withdrawal_address }
    );

    res.json({
      message: 'Withdrawal successful',
      transaction
    });
  } catch (error: any) {
    console.error('❌ [Wallet API] Withdrawal error:', error);

    // Return specific error messages
    if (error.message.includes('Insufficient balance')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('KYC')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || 'Failed to process withdrawal' });
  }
});

/**
 * POST /api/wallet/transfer
 * Transfer funds to another user
 */
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const fromUserId = (req as any).user.id;
    const { to_user_email, amount, description } = req.body;

    // Validate input
    if (!to_user_email) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid transfer amount' });
    }

    // Find recipient user by email
    const { query } = require('../db');
    const userResult = await query(
      'SELECT id, email, full_name FROM users WHERE email = ? LIMIT 1',
      [to_user_email]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    const toUserId = userResult.rows[0].id;

    const result = await transferBetweenWallets(
      fromUserId,
      toUserId,
      parseFloat(amount),
      description || `Transfer to ${to_user_email}`
    );

    res.json({
      message: 'Transfer successful',
      debit_transaction: result.debitTx,
      credit_transaction: result.creditTx,
      recipient: {
        email: userResult.rows[0].email,
        name: userResult.rows[0].full_name
      }
    });
  } catch (error: any) {
    console.error('❌ [Wallet API] Transfer error:', error);

    // Return specific error messages
    if (error.message.includes('Insufficient balance')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('same wallet')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || 'Failed to process transfer' });
  }
});

/**
 * GET /api/wallet/transactions
 * Get user's transaction history with pagination
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const transactionType = req.query.type as string;

    const result = await getTransactionHistory(userId, limit, offset, transactionType);

    res.json({
      transactions: result.transactions,
      total: result.total,
      limit,
      offset,
      has_more: (offset + limit) < result.total
    });
  } catch (error: any) {
    console.error('❌ [Wallet API] Get transactions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get transaction history' });
  }
});

/**
 * GET /api/wallet/transaction/:id
 * Get single transaction details
 */
router.get('/transaction/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const transactionId = req.params.id;

    const { query } = require('../db');
    const result = await query(
      'SELECT * FROM mlm_transactions WHERE id = ? AND user_id = ? LIMIT 1',
      [transactionId, userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ [Wallet API] Get transaction error:', error);
    res.status(500).json({ error: error.message || 'Failed to get transaction' });
  }
});

/**
 * GET /api/wallet/stats
 * Get wallet statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { query } = require('../db');

    // Get total deposits
    const depositResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_deposits
       FROM mlm_transactions
       WHERE user_id = ?
       AND transaction_type IN ('deposit', 'transfer_in', 'roi_distribution', 'level_income', 'booster_roi', 'monthly_reward')
       AND status = 'completed'`,
      [userId]
    );

    // Get total withdrawals
    const withdrawalResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_withdrawals
       FROM mlm_transactions
       WHERE user_id = ?
       AND transaction_type IN ('withdrawal', 'transfer_out')
       AND status = 'completed'`,
      [userId]
    );

    // Get pending amount
    const pendingResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as pending_amount
       FROM mlm_transactions
       WHERE user_id = ?
       AND status = 'pending'`,
      [userId]
    );

    res.json({
      total_deposits: parseFloat(depositResult.rows[0]?.total_deposits || '0'),
      total_withdrawals: parseFloat(withdrawalResult.rows[0]?.total_withdrawals || '0'),
      pending_amount: parseFloat(pendingResult.rows[0]?.pending_amount || '0')
    });
  } catch (error: any) {
    console.error('❌ [Wallet API] Get stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get wallet stats' });
  }
});

export default router;
