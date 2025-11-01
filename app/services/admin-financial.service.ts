/**
 * Admin Financial Service
 * Handles deposits, withdrawals, and financial operations
 */

import { supabase } from './supabase.client';
import { requireAdmin } from '../middleware/admin.middleware';

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  bank_details?: Record<string, any>;
  wallet_address?: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  kyc_status?: string;
  available_balance?: number;
  processed_by?: string;
  processed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface FinancialStats {
  total_deposits: number;
  total_withdrawals: number;
  pending_deposits: number;
  pending_withdrawals: number;
  total_deposits_amount: number;
  total_withdrawals_amount: number;
  pending_deposits_amount: number;
  pending_withdrawals_amount: number;
}

/**
 * Get all deposits with filters
 */
export const getAllDeposits = async (filters?: {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}): Promise<Deposit[]> => {
  try {
        // Verify admin access
    await requireAdmin();

let query = supabase
      .from('deposits')
      .select(`
        *,
        user:users!user_id(
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error getting deposits:', error);
    throw new Error(error.message || 'Failed to get deposits');
  }
};

/**
 * Get all withdrawals with filters
 */
export const getAllWithdrawals = async (filters?: {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}): Promise<Withdrawal[]> => {
  try {
        // Verify admin access
    await requireAdmin();

let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        user:users!user_id(
          id,
          full_name,
          email,
          kyc_status
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error getting withdrawals:', error);
    throw new Error(error.message || 'Failed to get withdrawals');
  }
};

/**
 * Approve deposit
 */
export const approveDeposit = async (
  depositId: string,
  notes?: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get deposit details
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .select('*, user:users!user_id(wallet_balance)')
      .eq('id', depositId)
      .single();

    if (depositError) throw depositError;
    if (!deposit) throw new Error('Deposit not found');

    if (deposit.status !== 'pending') {
      throw new Error('Deposit has already been processed');
    }

    // Update deposit status
    const { error: updateError } = await supabase
      .from('deposits')
      .update({
        status: 'approved',
        notes,
        processed_by: admin.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', depositId);

    if (updateError) throw updateError;

    // Get user's current wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('available_balance, total_balance')
      .eq('user_id', deposit.user_id)
      .single();

    if (walletError) throw walletError;

    // Update user wallet balance
    await supabase
      .from('wallets')
      .update({
        available_balance: (walletData.available_balance || 0) + deposit.amount,
        total_balance: (walletData.total_balance || 0) + deposit.amount,
      })
      .eq('user_id', deposit.user_id);

    // Create transaction record
    await supabase.from('mlm_transactions').insert({
      user_id: deposit.user_id,
      transaction_type: 'deposit',
      amount: deposit.amount,
      status: 'completed',
      metadata: {
        deposit_id: depositId,
        method: deposit.method,
        approved_by: admin.id,
        notes,
      },
    });

    // Log admin action
    await supabase.from('admin_actions').insert({
      user_id: deposit.user_id,
      admin_id: admin.id,
      action: 'approve_deposit',
      metadata: { deposit_id: depositId, amount: deposit.amount },
    });
  } catch (error: any) {
    console.error('Error approving deposit:', error);
    throw new Error(error.message || 'Failed to approve deposit');
  }
};

/**
 * Reject deposit
 */
export const rejectDeposit = async (
  depositId: string,
  reason: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get deposit details
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .single();

    if (depositError) throw depositError;
    if (!deposit) throw new Error('Deposit not found');

    if (deposit.status !== 'pending') {
      throw new Error('Deposit has already been processed');
    }

    // Update deposit status
    const { error: updateError } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
        notes: reason,
        processed_by: admin.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', depositId);

    if (updateError) throw updateError;

    // Log admin action
    await supabase.from('admin_actions').insert({
      user_id: deposit.user_id,
      admin_id: admin.id,
      action: 'reject_deposit',
      metadata: { deposit_id: depositId, reason },
    });
  } catch (error: any) {
    console.error('Error rejecting deposit:', error);
    throw new Error(error.message || 'Failed to reject deposit');
  }
};

/**
 * Approve withdrawal
 */
export const approveWithdrawal = async (
  withdrawalId: string,
  notes?: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError) throw withdrawalError;
    if (!withdrawal) throw new Error('Withdrawal not found');

    if (withdrawal.status !== 'pending') {
      throw new Error('Withdrawal has already been processed');
    }

    // Update withdrawal status
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        notes,
        processed_by: admin.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    // Create transaction record
    await supabase.from('mlm_transactions').insert({
      user_id: withdrawal.user_id,
      transaction_type: 'withdrawal',
      amount: -withdrawal.amount, // Negative for withdrawal
      status: 'completed',
      metadata: {
        withdrawal_id: withdrawalId,
        method: withdrawal.method,
        approved_by: admin.id,
        notes,
      },
    });

    // Log admin action
    await supabase.from('admin_actions').insert({
      user_id: withdrawal.user_id,
      admin_id: admin.id,
      action: 'approve_withdrawal',
      metadata: { withdrawal_id: withdrawalId, amount: withdrawal.amount },
    });
  } catch (error: any) {
    console.error('Error approving withdrawal:', error);
    throw new Error(error.message || 'Failed to approve withdrawal');
  }
};

/**
 * Reject withdrawal
 */
export const rejectWithdrawal = async (
  withdrawalId: string,
  reason: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError) throw withdrawalError;
    if (!withdrawal) throw new Error('Withdrawal not found');

    if (withdrawal.status !== 'pending') {
      throw new Error('Withdrawal has already been processed');
    }

    // Get user's current wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('available_balance, locked_balance')
      .eq('user_id', withdrawal.user_id)
      .single();

    if (walletError) throw walletError;

    // Return locked amount to available balance
    await supabase
      .from('wallets')
      .update({
        available_balance: (walletData.available_balance || 0) + withdrawal.amount,
        locked_balance: Math.max(0, (walletData.locked_balance || 0) - withdrawal.amount),
      })
      .eq('user_id', withdrawal.user_id);

    // Update withdrawal status
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        processed_by: admin.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    // Log admin action
    await supabase.from('admin_actions').insert({
      user_id: withdrawal.user_id,
      admin_id: admin.id,
      action: 'reject_withdrawal',
      metadata: { withdrawal_id: withdrawalId, reason },
    });
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error);
    throw new Error(error.message || 'Failed to reject withdrawal');
  }
};

/**
 * Get financial statistics
 */
export const getFinancialStats = async (): Promise<FinancialStats> => {
  try {
        // Verify admin access
    await requireAdmin();

// Get deposits stats
    const { data: deposits } = await supabase
      .from('deposits')
      .select('status, amount');

    // Get withdrawals stats
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('status, amount');

    const stats: FinancialStats = {
      total_deposits: deposits?.length || 0,
      total_withdrawals: withdrawals?.length || 0,
      pending_deposits: deposits?.filter(d => d.status === 'pending').length || 0,
      pending_withdrawals: withdrawals?.filter(w => w.status === 'pending').length || 0,
      total_deposits_amount: deposits?.reduce((sum, d) => sum + d.amount, 0) || 0,
      total_withdrawals_amount: withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0,
      pending_deposits_amount: deposits?.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0) || 0,
      pending_withdrawals_amount: withdrawals?.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0) || 0,
    };

    return stats;
  } catch (error: any) {
    console.error('Error getting financial stats:', error);
    throw new Error(error.message || 'Failed to get financial stats');
  }
};
