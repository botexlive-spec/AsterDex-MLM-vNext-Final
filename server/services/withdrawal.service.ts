/**
 * Withdrawal Service - Production Ready
 * Complete ledger-based withdrawal system with MySQL transactions
 * - 15% deduction on all withdrawals
 * - Admin approval/rejection flow
 * - Auto-approval mode support
 * - Full transaction safety with row-locking
 * - Ledger integration
 */

import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

// Get the connection pool
let pool: mysql.Pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'finaster_mlm',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

export interface WithdrawalRequest {
  id?: string;
  user_id: string;
  requested_amount: number;
  deduction_percentage: number;
  deduction_amount: number;
  final_amount: number;
  wallet_address?: string;
  payment_method?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejection_reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface WithdrawalResult {
  success: boolean;
  message: string;
  data?: {
    withdrawal_id: string;
    requested_amount: number;
    deduction_percentage: number;
    deduction_amount: number;
    final_amount: number;
    new_balance: number;
  };
}

/**
 * Submit withdrawal request - NO DEDUCTION (deduction only applies to stop-investment)
 */
export async function submitWithdrawalRequest(
  userId: string,
  requestedAmount: number,
  walletAddress?: string,
  paymentMethod?: string,
  network?: string
): Promise<WithdrawalResult> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock user row and get current balance
    const [users] = await connection.execute(
      `SELECT id, email, wallet_balance
       FROM users
       WHERE id = ?
       FOR UPDATE`,
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('User not found');
    }

    const user: any = users[0];
    const currentBalance = parseFloat(user.wallet_balance || '0');

    // 2. Validate minimum withdrawal (configurable - default $10)
    const MIN_WITHDRAWAL = 10;
    if (requestedAmount < MIN_WITHDRAWAL) {
      throw new Error(`Minimum withdrawal amount is $${MIN_WITHDRAWAL}`);
    }

    // 3. Validate maximum withdrawal (cannot exceed balance)
    if (requestedAmount > currentBalance) {
      throw new Error(
        `Insufficient balance. Available: $${currentBalance.toFixed(2)}, Requested: $${requestedAmount.toFixed(2)}`
      );
    }

    // 4. NO DEDUCTION for regular withdrawals (only for stop-investment)
    const DEDUCTION_PERCENTAGE = 0;
    const deductionAmount = 0;
    const finalAmount = requestedAmount;

    // 5. Deduct requested amount from wallet instantly
    const newBalance = currentBalance - requestedAmount;

    await connection.execute(
      `UPDATE users
       SET wallet_balance = ?
       WHERE id = ?`,
      [newBalance, userId]
    );

    // 6. Create withdrawal request record
    const withdrawalId = randomUUID();

    await connection.execute(
      `INSERT INTO withdrawals (
        id, user_id, requested_amount,
        deduction_percentage, deduction_amount, final_amount,
        wallet_address, payment_method, network, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        withdrawalId,
        userId,
        requestedAmount,
        DEDUCTION_PERCENTAGE,
        deductionAmount,
        finalAmount,
        walletAddress || null,
        paymentMethod || 'crypto',
        network || 'TRC20'
      ]
    );

    // 7. Create ledger entry - withdrawal_request
    const transactionId = randomUUID();

    await connection.execute(
      `INSERT INTO mlm_transactions (
        id, user_id, transaction_type, amount, description,
        status, reference_type, reference_id,
        balance_before, balance_after, metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionId,
        userId,
        'withdrawal_request',
        -requestedAmount, // Negative amount (debit)
        `Withdrawal request pending - 15% deduction will be applied`,
        'pending',
        'withdrawal',
        withdrawalId,
        currentBalance,
        newBalance,
        JSON.stringify({
          requested_amount: requestedAmount,
          deduction_percentage: DEDUCTION_PERCENTAGE,
          deduction_amount: deductionAmount,
          final_amount: finalAmount,
          wallet_address: walletAddress,
          payment_method: paymentMethod
        })
      ]
    );

    await connection.commit();

    console.log(`✅ Withdrawal request created: ${withdrawalId}`);
    console.log(`   User: ${user.email}, Amount: $${requestedAmount}, Network: ${network || 'TRC20'}, Final: $${finalAmount}`);

    return {
      success: true,
      message: `Withdrawal request submitted successfully. You will receive $${finalAmount.toFixed(2)} (pending admin approval).`,
      data: {
        withdrawal_id: withdrawalId,
        requested_amount: requestedAmount,
        deduction_percentage: DEDUCTION_PERCENTAGE,
        deduction_amount: deductionAmount,
        final_amount: finalAmount,
        new_balance: newBalance
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Withdrawal request failed:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create withdrawal request'
    };
  } finally {
    connection.release();
  }
}

/**
 * Approve withdrawal - Admin action
 */
export async function approveWithdrawal(
  withdrawalId: string,
  adminId: string
): Promise<WithdrawalResult> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock withdrawal row
    const [withdrawals] = await connection.execute(
      `SELECT * FROM withdrawals
       WHERE id = ?
       FOR UPDATE`,
      [withdrawalId]
    );

    if (!Array.isArray(withdrawals) || withdrawals.length === 0) {
      throw new Error('Withdrawal request not found');
    }

    const withdrawal: any = withdrawals[0];

    // 2. Validate status
    if (withdrawal.status !== 'pending') {
      throw new Error(`Cannot approve withdrawal with status: ${withdrawal.status}`);
    }

    // 3. Update withdrawal status to approved
    await connection.execute(
      `UPDATE withdrawals
       SET status = 'approved',
           approved_by = ?,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [adminId, withdrawalId]
    );

    // 4. Update transaction status to completed
    await connection.execute(
      `UPDATE mlm_transactions
       SET status = 'completed',
           description = ?,
           updated_at = NOW()
       WHERE reference_type = 'withdrawal'
         AND reference_id = ?
         AND transaction_type = 'withdrawal_request'`,
      [
        `Withdrawal approved - $${withdrawal.final_amount} paid (15% deduction applied)`,
        withdrawalId
      ]
    );

    // 5. Create completion ledger entry
    const completionTxId = randomUUID();

    await connection.execute(
      `INSERT INTO mlm_transactions (
        id, user_id, transaction_type, amount, description,
        status, reference_type, reference_id,
        metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        completionTxId,
        withdrawal.user_id,
        'withdrawal_completed',
        0, // No balance change (already deducted)
        `Withdrawal completed - $${withdrawal.final_amount} paid to ${withdrawal.wallet_address || 'user account'}`,
        'completed',
        'withdrawal',
        withdrawalId,
        JSON.stringify({
          approved_by: adminId,
          final_amount: parseFloat(withdrawal.final_amount),
          deduction_percentage: parseFloat(withdrawal.deduction_percentage),
          wallet_address: withdrawal.wallet_address
        })
      ]
    );

    await connection.commit();

    console.log(`✅ Withdrawal approved: ${withdrawalId} by admin ${adminId}`);

    return {
      success: true,
      message: `Withdrawal approved. $${withdrawal.final_amount} will be paid to user.`,
      data: {
        withdrawal_id: withdrawalId,
        requested_amount: parseFloat(withdrawal.requested_amount),
        deduction_percentage: parseFloat(withdrawal.deduction_percentage),
        deduction_amount: parseFloat(withdrawal.deduction_amount),
        final_amount: parseFloat(withdrawal.final_amount),
        new_balance: 0 // Not applicable for approval
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Withdrawal approval failed:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve withdrawal'
    };
  } finally {
    connection.release();
  }
}

/**
 * Reject withdrawal - Refund to user wallet
 */
export async function rejectWithdrawal(
  withdrawalId: string,
  adminId: string,
  reason: string
): Promise<WithdrawalResult> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock withdrawal row
    const [withdrawals] = await connection.execute(
      `SELECT * FROM withdrawals
       WHERE id = ?
       FOR UPDATE`,
      [withdrawalId]
    );

    if (!Array.isArray(withdrawals) || withdrawals.length === 0) {
      throw new Error('Withdrawal request not found');
    }

    const withdrawal: any = withdrawals[0];

    // 2. Validate status
    if (withdrawal.status !== 'pending') {
      throw new Error(`Cannot reject withdrawal with status: ${withdrawal.status}`);
    }

    // 3. Lock user row
    const [users] = await connection.execute(
      `SELECT wallet_balance FROM users
       WHERE id = ?
       FOR UPDATE`,
      [withdrawal.user_id]
    );

    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('User not found');
    }

    const user: any = users[0];
    const currentBalance = parseFloat(user.wallet_balance || '0');
    const refundAmount = parseFloat(withdrawal.requested_amount);
    const newBalance = currentBalance + refundAmount;

    // 4. Refund to user wallet
    await connection.execute(
      `UPDATE users
       SET wallet_balance = ?
       WHERE id = ?`,
      [newBalance, withdrawal.user_id]
    );

    // 5. Update withdrawal status to rejected
    await connection.execute(
      `UPDATE withdrawals
       SET status = 'rejected',
           rejection_reason = ?,
           approved_by = ?,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [reason, adminId, withdrawalId]
    );

    // 6. Update original transaction status
    await connection.execute(
      `UPDATE mlm_transactions
       SET status = 'cancelled',
           description = ?,
           updated_at = NOW()
       WHERE reference_type = 'withdrawal'
         AND reference_id = ?
         AND transaction_type = 'withdrawal_request'`,
      [
        `Withdrawal rejected - ${reason}`,
        withdrawalId
      ]
    );

    // 7. Create refund ledger entry
    const refundTxId = randomUUID();

    await connection.execute(
      `INSERT INTO mlm_transactions (
        id, user_id, transaction_type, amount, description,
        status, reference_type, reference_id,
        balance_before, balance_after, metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        refundTxId,
        withdrawal.user_id,
        'withdrawal_refund',
        refundAmount, // Positive amount (credit)
        `Withdrawal rejected - Amount refunded: ${reason}`,
        'completed',
        'withdrawal',
        withdrawalId,
        currentBalance,
        newBalance,
        JSON.stringify({
          rejected_by: adminId,
          rejection_reason: reason,
          refund_amount: refundAmount
        })
      ]
    );

    await connection.commit();

    console.log(`❌ Withdrawal rejected: ${withdrawalId} by admin ${adminId}`);
    console.log(`   Reason: ${reason}, Refunded: $${refundAmount}`);

    return {
      success: true,
      message: `Withdrawal rejected. $${refundAmount.toFixed(2)} refunded to user wallet.`,
      data: {
        withdrawal_id: withdrawalId,
        requested_amount: refundAmount,
        deduction_percentage: 0,
        deduction_amount: 0,
        final_amount: refundAmount,
        new_balance: newBalance
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Withdrawal rejection failed:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reject withdrawal'
    };
  } finally {
    connection.release();
  }
}

/**
 * Get pending withdrawals - Admin view
 */
export async function getPendingWithdrawals(): Promise<any[]> {
  const pool = await getPool();

  const [withdrawals] = await pool.execute(
    `SELECT
      w.*,
      u.email,
      u.full_name,
      u.wallet_balance
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    WHERE w.status = 'pending'
    ORDER BY w.created_at ASC`
  );

  return withdrawals as any[];
}

/**
 * Get all withdrawals with filters - Admin view
 */
export async function getAllWithdrawals(
  status?: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ withdrawals: any[]; total: number }> {
  const pool = await getPool();

  let sql = `
    SELECT
      w.*,
      u.email,
      u.full_name,
      u.wallet_balance
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
  `;

  const params: any[] = [];

  if (status) {
    sql += ` WHERE w.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY w.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const [withdrawals] = await pool.execute(sql, params);

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM withdrawals`;
  if (status) {
    countSql += ` WHERE status = ?`;
  }

  const [countResult] = await pool.execute(countSql, status ? [status] : []);
  const total = (countResult as any[])[0]?.total || 0;

  return {
    withdrawals: withdrawals as any[],
    total
  };
}

/**
 * Get user withdrawals
 */
export async function getUserWithdrawals(
  userId: string,
  status?: string,
  limit: number = 50
): Promise<any[]> {
  const pool = await getPool();

  let sql = `SELECT * FROM withdrawals WHERE user_id = ?`;
  const params: any[] = [userId];

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

  const [withdrawals] = await pool.execute(sql, params);

  return withdrawals as any[];
}

/**
 * Get withdrawal statistics
 */
export async function getWithdrawalStats(): Promise<{
  total_pending: number;
  total_pending_amount: number;
  total_approved: number;
  total_approved_amount: number;
  total_rejected: number;
  total_rejected_amount: number;
}> {
  const pool = await getPool();

  const [stats] = await pool.execute(`
    SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as total_pending,
      SUM(CASE WHEN status = 'pending' THEN final_amount ELSE 0 END) as total_pending_amount,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as total_approved,
      SUM(CASE WHEN status = 'approved' THEN final_amount ELSE 0 END) as total_approved_amount,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as total_rejected,
      SUM(CASE WHEN status = 'rejected' THEN requested_amount ELSE 0 END) as total_rejected_amount
    FROM withdrawals
  `);

  const result: any = (stats as any[])[0];

  return {
    total_pending: parseInt(result.total_pending || '0'),
    total_pending_amount: parseFloat(result.total_pending_amount || '0'),
    total_approved: parseInt(result.total_approved || '0'),
    total_approved_amount: parseFloat(result.total_approved_amount || '0'),
    total_rejected: parseInt(result.total_rejected || '0'),
    total_rejected_amount: parseFloat(result.total_rejected_amount || '0')
  };
}

/**
 * Admin Add Funds - Credit user wallet directly
 */
export async function adminAddFunds(
  userId: string,
  amount: number,
  adminId: string,
  description: string
): Promise<WithdrawalResult> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock user row
    const [users] = await connection.execute(
      `SELECT id, email, wallet_balance
       FROM users
       WHERE id = ?
       FOR UPDATE`,
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('User not found');
    }

    const user: any = users[0];
    const currentBalance = parseFloat(user.wallet_balance || '0');
    const newBalance = currentBalance + amount;

    // 2. Update wallet balance
    await connection.execute(
      `UPDATE users
       SET wallet_balance = ?
       WHERE id = ?`,
      [newBalance, userId]
    );

    // 3. Create ledger entry
    const transactionId = randomUUID();

    await connection.execute(
      `INSERT INTO mlm_transactions (
        id, user_id, transaction_type, amount, description,
        status, reference_type, reference_id,
        balance_before, balance_after, metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionId,
        userId,
        'admin_add_fund',
        amount,
        description || `Admin credited $${amount} to wallet`,
        'completed',
        'admin_action',
        adminId,
        currentBalance,
        newBalance,
        JSON.stringify({
          admin_id: adminId,
          amount: amount,
          reason: description
        })
      ]
    );

    await connection.commit();

    console.log(`✅ Admin added funds: $${amount} to user ${user.email} by admin ${adminId}`);

    return {
      success: true,
      message: `Successfully added $${amount.toFixed(2)} to user wallet.`,
      data: {
        withdrawal_id: transactionId,
        requested_amount: amount,
        deduction_percentage: 0,
        deduction_amount: 0,
        final_amount: amount,
        new_balance: newBalance
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Admin add funds failed:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add funds'
    };
  } finally {
    connection.release();
  }
}
