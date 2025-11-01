/**
 * Admin User Service
 * Handles admin-specific user management operations
 * Updated with better error handling for missing tables
 */

import { supabase } from './supabase.client';
import { requireAdmin } from '../middleware/admin.middleware';

export interface UserDetailedInfo {
  id: string;
  email: string;
  full_name: string;
  wallet_balance: number;
  total_investment: number;
  total_earnings: number;
  referral_code: string;
  referred_by?: string;
  rank: string;
  kyc_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_referrals?: number;
  active_packages?: number;
  pending_withdrawals?: number;
}

export interface UserPackageInfo {
  id: string;
  package_id: string;
  package_name: string;
  amount_invested: number;
  start_date: string;
  end_date: string;
  daily_return: number;
  total_return: number;
  claimed_return: number;
  status: string;
  created_at: string;
}

export interface UserTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  metadata: any;
  created_at: string;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  rank: string;
  total_investment: number;
  wallet_balance: number;
  created_at: string;
  is_active: boolean;
}

export interface UserEarnings {
  roi_earnings: number;
  referral_earnings: number;
  binary_earnings: number;
  rank_bonus: number;
  total_earnings: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string;
  metadata: any;
  created_at: string;
}

export interface AdminActionRequest {
  user_id: string;
  action_type: 'wallet_adjustment' | 'rank_change' | 'suspend' | 'activate' | 'reset_password';
  amount?: number;
  new_rank?: string;
  reason: string;
  admin_notes?: string;
}

/**
 * Get detailed user information for admin panel
 */
export const getUserDetailedInfo = async (userId: string): Promise<UserDetailedInfo | null> => {
  try {
        // Verify admin access
    await requireAdmin();

// Get user basic info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user basic info:', userError);
      console.error('User ID:', userId);
      console.error('Error details:', JSON.stringify(userError));
      return null; // Return null instead of throwing
    }
    if (!user) {
      console.warn('User not found:', userId);
      return null;
    }

    // Get total referrals count (gracefully handle errors)
    let referralCount = 0;
    try {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId);
      referralCount = count || 0;
    } catch (error) {
      console.warn('Failed to get referral count:', error);
    }

    // Get active packages count (gracefully handle errors)
    let activePackages = 0;
    try {
      const { count } = await supabase
        .from('user_packages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');
      activePackages = count || 0;
    } catch (error) {
      console.warn('Failed to get active packages count:', error);
    }

    // Get pending withdrawals count (gracefully handle errors)
    let pendingWithdrawals = 0;
    try {
      const { count } = await supabase
        .from('withdrawal_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');
      pendingWithdrawals = count || 0;
    } catch (error) {
      console.warn('Failed to get pending withdrawals count:', error);
    }

    return {
      ...user,
      total_referrals: referralCount,
      active_packages: activePackages,
      pending_withdrawals: pendingWithdrawals,
    };
  } catch (error: any) {
    console.error('Error getting user detailed info:', error);
    throw new Error(error.message || 'Failed to get user information');
  }
};

/**
 * Get user's packages for admin view
 */
export const getUserPackages = async (userId: string): Promise<UserPackageInfo[]> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data, error } = await supabase
      .from('user_packages')
      .select(`
        *,
        package:packages (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error getting user packages:', error);
      return []; // Return empty array instead of throwing
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      package_id: item.package_id,
      package_name: item.package?.name || 'Unknown Package',
      amount_invested: item.amount_invested,
      start_date: item.start_date,
      end_date: item.end_date,
      daily_return: item.daily_return,
      total_return: item.total_return,
      claimed_return: item.claimed_return,
      status: item.status,
      created_at: item.created_at,
    }));
  } catch (error: any) {
    console.error('Error getting user packages:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Get user's transaction history for admin view
 */
export const getUserTransactions = async (
  userId: string,
  limit: number = 50
): Promise<UserTransaction[]> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data, error } = await supabase
      .from('mlm_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error getting user transactions:', error);
      return []; // Return empty array instead of throwing
    }

    return data || [];
  } catch (error: any) {
    console.error('Error getting user transactions:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Get user's team members (direct referrals)
 */
export const getUserTeam = async (userId: string): Promise<TeamMember[]> => {
  try {
    // Verify admin access
    await requireAdmin();

    console.log('🔍 Fetching team members for user:', userId);

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, current_rank, total_investment, wallet_balance, created_at, is_active')
      .eq('sponsor_id', userId)  // Changed from 'referred_by' to 'sponsor_id'
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('❌ Error getting user team:', error);
      return []; // Return empty array instead of throwing
    }

    console.log(`✅ Found ${data?.length || 0} team members`);

    return (data || []).map(member => ({
      ...member,
      rank: member.current_rank || 'starter', // Map current_rank to rank
    }));
  } catch (error: any) {
    console.error('Error getting user team:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Get user's earnings breakdown
 */
export const getUserEarnings = async (userId: string): Promise<UserEarnings> => {
  const defaultEarnings: UserEarnings = {
    roi_earnings: 0,
    referral_earnings: 0,
    binary_earnings: 0,
    rank_bonus: 0,
    total_earnings: 0,
  };

  try {
    // Get all earnings transactions
    const { data: transactions, error } = await supabase
      .from('mlm_transactions')
      .select('transaction_type, amount')
      .eq('user_id', userId)
      .in('transaction_type', [
        'package_return',
        'referral_commission',
        'binary_commission',
        'rank_bonus',
      ]);

    if (error) {
      console.warn('Error getting user earnings:', error);
      return defaultEarnings; // Return default instead of throwing
    }

    const earnings: UserEarnings = { ...defaultEarnings };

    transactions?.forEach((tx: any) => {
      const amount = Math.abs(tx.amount);
      switch (tx.transaction_type) {
        case 'package_return':
          earnings.roi_earnings += amount;
          break;
        case 'referral_commission':
          earnings.referral_earnings += amount;
          break;
        case 'binary_commission':
          earnings.binary_earnings += amount;
          break;
        case 'rank_bonus':
          earnings.rank_bonus += amount;
          break;
      }
      earnings.total_earnings += amount;
    });

    return earnings;
  } catch (error: any) {
    console.error('Error getting user earnings:', error);
    return defaultEarnings; // Return default instead of throwing
  }
};

/**
 * Get user's activity log
 */
export const getUserActivityLog = async (
  userId: string,
  limit: number = 50
): Promise<ActivityLog[]> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If activity_logs table doesn't exist, return empty array
      console.warn('Activity logs table not found, returning empty array');
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('Error getting user activity log:', error);
    // Return empty array instead of throwing error if table doesn't exist
    return [];
  }
};

/**
 * Adjust user wallet balance (admin action)
 */
export const adjustWalletBalance = async (
  userId: string,
  amount: number,
  reason: string,
  adminNotes?: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Update wallet balance
    const newBalance = userData.wallet_balance + amount;
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Create transaction record
    await supabase.from('mlm_transactions').insert({
      user_id: userId,
      transaction_type: amount > 0 ? 'admin_credit' : 'admin_debit',
      amount: amount,
      status: 'completed',
      metadata: {
        admin_id: admin.id,
        reason: reason,
        notes: adminNotes,
        previous_balance: userData.wallet_balance,
        new_balance: newBalance,
      },
    });

    // Log admin action
    await logAdminAction(userId, admin.id, 'wallet_adjustment', {
      amount,
      reason,
      notes: adminNotes,
    });
  } catch (error: any) {
    console.error('Error adjusting wallet balance:', error);
    throw new Error(error.message || 'Failed to adjust wallet balance');
  }
};

/**
 * Change user rank (admin action)
 */
export const changeUserRank = async (
  userId: string,
  newRank: string,
  reason: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get current rank
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('rank')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Update rank
    const { error: updateError } = await supabase
      .from('users')
      .update({
        rank: newRank,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log admin action
    await logAdminAction(userId, admin.id, 'rank_change', {
      previous_rank: userData.rank,
      new_rank: newRank,
      reason,
    });
  } catch (error: any) {
    console.error('Error changing user rank:', error);
    throw new Error(error.message || 'Failed to change user rank');
  }
};

/**
 * Suspend user account (admin action)
 */
export const suspendUser = async (userId: string, reason: string): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log admin action
    await logAdminAction(userId, admin.id, 'suspend_user', { reason });
  } catch (error: any) {
    console.error('Error suspending user:', error);
    throw new Error(error.message || 'Failed to suspend user');
  }
};

/**
 * Activate user account (admin action)
 */
export const activateUser = async (userId: string): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log admin action
    await logAdminAction(userId, admin.id, 'activate_user', {});
  } catch (error: any) {
    console.error('Error activating user:', error);
    throw new Error(error.message || 'Failed to activate user');
  }
};

/**
 * Log admin action to database
 */
const logAdminAction = async (
  userId: string,
  adminId: string,
  action: string,
  metadata: any
): Promise<void> => {
  try {
    await supabase.from('admin_actions').insert({
      user_id: userId,
      admin_id: adminId,
      action: action,
      metadata: metadata,
    });
  } catch (error: any) {
    console.warn('Failed to log admin action:', error);
    // Don't throw error - logging failure shouldn't break the main action
  }
};

/**
 * Get all users with filtering and pagination
 */
export const getAllUsers = async (
  filters?: {
    search?: string;
    status?: 'active' | 'inactive';
    kyc_status?: string;
    rank?: string;
  },
  page: number = 1,
  pageSize: number = 20
): Promise<{ users: UserDetailedInfo[]; total: number }> => {
  try {
    let query = supabase.from('users').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('is_active', filters.status === 'active');
    }
    if (filters?.kyc_status) {
      query = query.eq('kyc_status', filters.kyc_status);
    }
    if (filters?.rank) {
      query = query.eq('rank', filters.rank);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return {
      users: data || [],
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error getting all users:', error);
    throw new Error(error.message || 'Failed to get users');
  }
};

/**
 * Cancel user package (admin action)
 */
export const cancelUserPackage = async (
  packageId: string,
  reason: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('user_packages')
      .select('user_id, package_id, amount_invested, status')
      .eq('id', packageId)
      .single();

    if (packageError) throw packageError;
    if (!packageData) throw new Error('Package not found');

    // Update package status
    const { error: updateError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', packageId);

    if (updateError) throw updateError;

    // Log admin action
    await logAdminAction(packageData.user_id, admin.id, 'cancel_package', {
      package_id: packageId,
      reason,
    });
  } catch (error: any) {
    console.error('Error cancelling user package:', error);
    throw new Error(error.message || 'Failed to cancel package');
  }
};

/**
 * Manually assign package to user (admin action)
 */
export const assignPackageToUser = async (
  userId: string,
  packageId: string,
  amount: number,
  reason: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (pkgError) throw pkgError;
    if (!pkg) throw new Error('Package not found');

    // Calculate package returns
    const dailyReturn = (amount * pkg.daily_return_percentage) / 100;
    const totalReturn = (amount * pkg.max_return_percentage) / 100;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pkg.duration_days);

    // Create user package subscription
    const { data: userPackage, error: packageError } = await supabase
      .from('user_packages')
      .insert({
        user_id: userId,
        package_id: packageId,
        amount_invested: amount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        daily_return: dailyReturn,
        total_return: totalReturn,
        claimed_return: 0,
        status: 'active',
      })
      .select()
      .single();

    if (packageError) throw packageError;

    // Update user's total investment
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('total_investment')
      .eq('id', userId)
      .single();

    if (!userError && userData) {
      await supabase
        .from('users')
        .update({
          total_investment: (userData.total_investment || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // Create transaction record
    await supabase.from('mlm_transactions').insert({
      user_id: userId,
      transaction_type: 'package_purchase',
      amount: -amount, // Negative because it's a deduction (even though admin assigned)
      status: 'completed',
      metadata: {
        package_id: packageId,
        package_name: pkg.name,
        user_package_id: userPackage.id,
        daily_return: dailyReturn,
        total_return: totalReturn,
        duration_days: pkg.duration_days,
        admin_assigned: true,
        admin_id: admin.id,
        reason: reason,
      },
    });

    // Log admin action
    await logAdminAction(userId, admin.id, 'assign_package', {
      package_id: packageId,
      package_name: pkg.name,
      amount,
      reason,
    });
  } catch (error: any) {
    console.error('Error assigning package to user:', error);
    throw new Error(error.message || 'Failed to assign package');
  }
};

/**
 * Create manual transaction (admin action)
 */
export const createManualTransaction = async (
  userId: string,
  transactionType: string,
  amount: number,
  description: string
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!admin) throw new Error('Admin not authenticated');

    // If it's a credit/debit transaction, update wallet balance
    if (transactionType === 'admin_credit' || transactionType === 'admin_debit') {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newBalance = userData.wallet_balance + amount;

      await supabase
        .from('users')
        .update({
          wallet_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // Create transaction record
    await supabase.from('mlm_transactions').insert({
      user_id: userId,
      transaction_type: transactionType,
      amount: amount,
      status: 'completed',
      metadata: {
        description: description,
        admin_created: true,
        admin_id: admin.id,
      },
    });

    // Log admin action
    await logAdminAction(userId, admin.id, 'create_manual_transaction', {
      transaction_type: transactionType,
      amount,
      description,
    });
  } catch (error: any) {
    console.error('Error creating manual transaction:', error);
    throw new Error(error.message || 'Failed to create transaction');
  }
};
