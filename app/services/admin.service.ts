/**
 * Admin Service
 * Handles all admin dashboard-related API calls
 */

import { supabase } from './supabase.client';
import {
  AdminDashboardStats,
  UserManagementFilters,
  UserListResponse,
  UpdateUserData,
  ReferralAnalyticsData,
  ReferralAnalyticsFilters,
  TradingVolumeData,
  SystemSettings,
  ActivityLogEntry,
  ActivityLogFilters,
  ActivityLogResponse,
} from '../types/admin.types';
import { User } from '../types/auth.types';
import { requireAdmin } from '../middleware/admin.middleware';

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async (): Promise<AdminDashboardStats> => {
  try {
        // Verify admin access
    await requireAdmin();

// Get total users
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalUsersError) throw totalUsersError;

    // Get active users
    const { count: activeUsers, error: activeUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeUsersError) throw activeUsersError;

    // Get total traders
    const { count: totalTraders, error: tradersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'trader');

    if (tradersError) throw tradersError;

    // Get total admins
    const { count: totalAdmins, error: adminsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (adminsError) throw adminsError;

    // Get new users (today, this week, this month)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: newUsersThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    const { count: newUsersThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    // Get referral stats
    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true });

    // Get trading volume and commissions
    const { data: tradingData } = await supabase
      .from('trading_activity')
      .select('trade_volume, commission');

    const totalTradingVolume = tradingData?.reduce((sum, t) => sum + parseFloat(t.trade_volume.toString()), 0) || 0;
    const totalCommissions = tradingData?.reduce((sum, t) => sum + parseFloat(t.commission.toString()), 0) || 0;

    return {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      total_traders: totalTraders || 0,
      total_admins: totalAdmins || 0,
      new_users_today: newUsersToday || 0,
      new_users_this_week: newUsersThisWeek || 0,
      new_users_this_month: newUsersThisMonth || 0,
      total_referrals: totalReferrals || 0,
      total_trading_volume: totalTradingVolume,
      total_commissions: totalCommissions,
    };
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    throw new Error(error.message || 'Failed to fetch admin statistics');
  }
};

/**
 * Get users list with filters and pagination
 */
export const getUsersList = async (filters: UserManagementFilters = {}): Promise<UserListResponse> => {
  try {
        // Verify admin access
    await requireAdmin();

const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.email_verified !== undefined) {
      query = query.eq('email_verified', filters.email_verified);
    }

    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      users: data as User[],
      total: count || 0,
      page,
      limit,
      total_pages: totalPages,
    };
  } catch (error: any) {
    console.error('Get users list error:', error);
    throw new Error(error.message || 'Failed to fetch users list');
  }
};

/**
 * Update user data (admin only)
 */
export const updateUser = async (userId: string, data: UpdateUserData): Promise<User> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: userData, error } = await supabase
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return userData as User;
  } catch (error: any) {
    console.error('Update user error:', error);
    throw new Error(error.message || 'Failed to update user');
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Delete user error:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
};

/**
 * Get referral analytics
 */
export const getReferralAnalytics = async (
  filters: ReferralAnalyticsFilters = {}
): Promise<ReferralAnalyticsData> => {
  try {
        // Verify admin access
    await requireAdmin();

let query = supabase
      .from('referrals')
      .select('*, users!referrer_id(email)');

    // Apply filters
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters.user_id) {
      query = query.eq('referrer_id', filters.user_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data: referrals, error } = await query;

    if (error) throw error;

    const totalReferrals = referrals?.length || 0;
    const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0;
    const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
    const totalCommissions = referrals?.reduce((sum, r) => sum + parseFloat(r.commission_earned.toString()), 0) || 0;
    const avgCommission = totalReferrals > 0 ? totalCommissions / totalReferrals : 0;

    // Calculate top referrers
    const referrerMap = new Map();
    referrals?.forEach(r => {
      const key = r.referrer_id;
      if (!referrerMap.has(key)) {
        referrerMap.set(key, {
          user_id: r.referrer_id,
          user_email: r.users?.email || 'Unknown',
          referral_count: 0,
          total_commission: 0,
        });
      }
      const entry = referrerMap.get(key);
      entry.referral_count++;
      entry.total_commission += parseFloat(r.commission_earned.toString());
    });

    const topReferrers = Array.from(referrerMap.values())
      .sort((a, b) => b.referral_count - a.referral_count)
      .slice(0, 10);

    // Calculate referrals over time (by day)
    const dateMap = new Map();
    referrals?.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, count: 0, commission: 0 });
      }
      const entry = dateMap.get(date);
      entry.count++;
      entry.commission += parseFloat(r.commission_earned.toString());
    });

    const referralsOverTime = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_referrals: totalReferrals,
      active_referrals: activeReferrals,
      completed_referrals: completedReferrals,
      total_commissions: totalCommissions,
      avg_commission: avgCommission,
      top_referrers: topReferrers,
      referrals_over_time: referralsOverTime,
    };
  } catch (error: any) {
    console.error('Get referral analytics error:', error);
    throw new Error(error.message || 'Failed to fetch referral analytics');
  }
};

/**
 * Get trading volume data
 */
export const getTradingVolumeData = async (): Promise<TradingVolumeData> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: trades, error } = await supabase
      .from('trading_activity')
      .select('*, users(email)');

    if (error) throw error;

    const totalVolume = trades?.reduce((sum, t) => sum + parseFloat(t.trade_volume.toString()), 0) || 0;
    const totalTrades = trades?.length || 0;
    const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

    // Calculate volume by day
    const dateMap = new Map();
    trades?.forEach(t => {
      const date = new Date(t.created_at).toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, volume: 0, trades: 0 });
      }
      const entry = dateMap.get(date);
      entry.volume += parseFloat(t.trade_volume.toString());
      entry.trades++;
    });

    const volumeByDay = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate top traders
    const traderMap = new Map();
    trades?.forEach(t => {
      const key = t.user_id;
      if (!traderMap.has(key)) {
        traderMap.set(key, {
          user_id: t.user_id,
          user_email: t.users?.email || 'Unknown',
          total_volume: 0,
          trade_count: 0,
        });
      }
      const entry = traderMap.get(key);
      entry.total_volume += parseFloat(t.trade_volume.toString());
      entry.trade_count++;
    });

    const topTraders = Array.from(traderMap.values())
      .sort((a, b) => b.total_volume - a.total_volume)
      .slice(0, 10);

    return {
      total_volume: totalVolume,
      total_trades: totalTrades,
      avg_trade_size: avgTradeSize,
      volume_by_day: volumeByDay,
      top_traders: topTraders,
    };
  } catch (error: any) {
    console.error('Get trading volume data error:', error);
    throw new Error(error.message || 'Failed to fetch trading volume data');
  }
};

/**
 * Log admin action
 */
export const logAdminAction = async (
  action: string,
  targetUserId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: user.id,
        action,
        target_user_id: targetUserId,
        details,
      });

    if (error) throw error;
  } catch (error: any) {
    console.error('Log admin action error:', error);
    // Don't throw error for logging failures
  }
};
