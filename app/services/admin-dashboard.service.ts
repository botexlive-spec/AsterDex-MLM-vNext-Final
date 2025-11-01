/**
 * Admin Dashboard Service
 * Provides comprehensive dashboard statistics and metrics
 */

import { supabase } from './supabase.client';
import { requireAdmin } from '../middleware/admin.middleware';

export interface DashboardStats {
  // User metrics
  total_users: number;
  active_users: number;
  today_registrations: number;
  week_registrations: number;
  month_registrations: number;

  // Financial metrics
  total_revenue: number;
  total_investments: number;
  total_withdrawals: number;
  pending_withdrawals: number;
  pending_withdrawals_amount: number;

  // Package metrics
  active_packages: number;
  total_packages_sold: number;

  // KYC metrics
  pending_kyc: number;
  approved_kyc: number;

  // Commission metrics
  total_commissions_paid: number;
  pending_commissions: number;

  // ROI metrics
  total_roi_distributed: number;

  // Binary metrics
  total_binary_earnings: number;

  // Robot subscriptions
  active_robot_subscriptions: number;
}

export interface RecentActivity {
  id: string;
  type: 'registration' | 'package' | 'withdrawal' | 'kyc' | 'robot';
  user_id: string;
  user_name: string;
  description: string;
  amount?: number;
  timestamp: string;
}

export interface TopUser {
  id: string;
  name: string;
  email: string;
  total_investment: number;
  total_earnings: number;
  rank: string;
  team_size: number;
}

/**
 * Helper function to safely execute database queries
 */
const safeQuery = async <T>(queryFn: () => Promise<T>, defaultValue: T): Promise<T> => {
  try {
    return await queryFn();
  } catch (error) {
    console.warn('Query failed, using default:', error);
    return defaultValue;
  }
};

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Verify admin access
    await requireAdmin();

    console.log('🚀 Loading dashboard stats in parallel...');
    const startTime = Date.now();

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();

    // Execute ALL queries in parallel for maximum performance
    const [
      // User metrics
      total_users_result,
      active_users_result,
      today_registrations_result,
      week_registrations_result,
      month_registrations_result,

      // Package metrics
      active_packages,
      total_packages_sold,
      total_investments,

      // Financial metrics
      total_withdrawals,
      pending_withdrawals,
      pending_withdrawals_amount,
      total_deposits,

      // KYC metrics
      pending_kyc,
      approved_kyc,

      // Commission and earnings metrics
      total_commissions_paid,
      total_roi_distributed,
      total_binary_earnings,

      // Robot subscriptions
      active_robot_subscriptions,
    ] = await Promise.all([
      // User metrics
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),

      // Package metrics
      safeQuery(async () => {
        const { count } = await supabase.from('user_packages').select('*', { count: 'exact', head: true }).eq('is_active', true);
        return count || 0;
      }, 0),
      safeQuery(async () => {
        const { count } = await supabase.from('user_packages').select('*', { count: 'exact', head: true });
        return count || 0;
      }, 0),
      safeQuery(async () => {
        const { data } = await supabase.from('user_packages').select('amount');
        return data?.reduce((sum, pkg) => sum + (pkg.amount || 0), 0) || 0;
      }, 0),

      // Financial metrics
      safeQuery(async () => {
        const { data } = await supabase.from('withdrawal_requests').select('amount').eq('status', 'approved');
        return data?.reduce((sum, w) => sum + w.amount, 0) || 0;
      }, 0),
      safeQuery(async () => {
        const { count } = await supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        return count || 0;
      }, 0),
      safeQuery(async () => {
        const { data } = await supabase.from('withdrawal_requests').select('amount').eq('status', 'pending');
        return data?.reduce((sum, w) => sum + w.amount, 0) || 0;
      }, 0),
      safeQuery(async () => {
        const { data } = await supabase.from('deposits').select('amount').eq('status', 'approved');
        return data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      }, 0),

      // KYC metrics
      safeQuery(async () => {
        const { count } = await supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        return count || 0;
      }, 0),
      safeQuery(async () => {
        const { count } = await supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status', 'approved');
        return count || 0;
      }, 0),

      // Commission and earnings metrics
      safeQuery(async () => {
        const { data } = await supabase.from('mlm_transactions').select('amount').in('transaction_type', ['direct_income', 'level_income', 'matching_bonus', 'rank_reward', 'booster_income']);
        return data?.reduce((sum, c) => sum + Math.abs(c.amount), 0) || 0;
      }, 0),
      safeQuery(async () => {
        const { data } = await supabase.from('mlm_transactions').select('amount').eq('transaction_type', 'roi_income');
        return data?.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0;
      }, 0),
      safeQuery(async () => {
        const { data } = await supabase.from('mlm_transactions').select('amount').eq('transaction_type', 'matching_bonus');
        return data?.reduce((sum, b) => sum + Math.abs(b.amount), 0) || 0;
      }, 0),

      // Robot subscriptions
      safeQuery(async () => {
        const { count } = await supabase.from('robot_subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true).gte('expires_at', new Date().toISOString());
        return count || 0;
      }, 0),
    ]);

    const total_revenue = total_investments + total_deposits;

    const loadTime = Date.now() - startTime;
    console.log(`✅ Dashboard stats loaded in ${loadTime}ms`);

    return {
      total_users: total_users_result.count || 0,
      active_users: active_users_result.count || 0,
      today_registrations: today_registrations_result.count || 0,
      week_registrations: week_registrations_result.count || 0,
      month_registrations: month_registrations_result.count || 0,
      total_revenue,
      total_investments,
      total_withdrawals,
      pending_withdrawals,
      pending_withdrawals_amount,
      active_packages,
      total_packages_sold,
      pending_kyc,
      approved_kyc,
      total_commissions_paid,
      pending_commissions: 0,
      total_roi_distributed,
      total_binary_earnings,
      active_robot_subscriptions,
    };
  } catch (error: any) {
    console.error('Error getting dashboard stats:', error);
    throw new Error(error.message || 'Failed to get dashboard statistics');
  }
};

/**
 * Get recent platform activities
 */
export const getRecentActivities = async (limit: number = 20): Promise<RecentActivity[]> => {
  try {
    // Verify admin access
    await requireAdmin();

    const activities: RecentActivity[] = [];

    // Get recent registrations
    const recentUsers = await safeQuery(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }, []);

    recentUsers.forEach(user => {
      activities.push({
        id: `reg-${user.id}`,
        type: 'registration',
        user_id: user.id,
        user_name: user.full_name || 'Unknown User',
        description: 'New user registered',
        timestamp: user.created_at,
      });
    });

    // Get recent package purchases - safe query
    const recentPackages = await safeQuery(async () => {
      const { data } = await supabase
        .from('user_packages')
        .select('id, amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }, []);

    for (const pkg of recentPackages) {
      // Get user info separately
      const user = await safeQuery(async () => {
        const { data } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('id', pkg.user_id)
          .single();
        return data;
      }, null);

      if (user) {
        activities.push({
          id: `pkg-${pkg.id}`,
          type: 'package',
          user_id: user.id,
          user_name: user.full_name || 'Unknown User',
          description: 'Package purchased',
          amount: pkg.amount,
          timestamp: pkg.created_at,
        });
      }
    }

    // Get recent withdrawals - safe query
    const recentWithdrawals = await safeQuery(async () => {
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('id, amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }, []);

    for (const withdrawal of recentWithdrawals) {
      const user = await safeQuery(async () => {
        const { data } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('id', withdrawal.user_id)
          .single();
        return data;
      }, null);

      if (user) {
        activities.push({
          id: `withdrawal-${withdrawal.id}`,
          type: 'withdrawal',
          user_id: user.id,
          user_name: user.full_name || 'Unknown User',
          description: 'Withdrawal requested',
          amount: withdrawal.amount,
          timestamp: withdrawal.created_at,
        });
      }
    }

    // Sort all activities by timestamp and limit
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, limit);
  } catch (error: any) {
    console.error('Error getting recent activities:', error);
    return [];
  }
};

/**
 * Get top users by investment
 */
export const getTopUsers = async (limit: number = 10): Promise<TopUser[]> => {
  try {
    // Verify admin access
    await requireAdmin();

    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email, total_investment, total_earnings, rank')
      .order('total_investment', { ascending: false })
      .limit(limit);

    if (!users) return [];

    // Get team size for each user
    const topUsers: TopUser[] = await Promise.all(
      users.map(async (user) => {
        const { count: team_size } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('sponsor_id', user.id);

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          total_investment: user.total_investment || 0,
          total_earnings: user.total_earnings || 0,
          rank: user.rank || 'Starter',
          team_size: team_size || 0,
        };
      })
    );

    return topUsers;
  } catch (error: any) {
    console.error('Error getting top users:', error);
    return [];
  }
};

/**
 * Get growth chart data (registrations over time)
 */
export const getGrowthChartData = async (days: number = 30) => {
  try {
    // Verify admin access
    await requireAdmin();

    const { data } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const dateMap = new Map();
    data?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      registrations: count,
    }));
  } catch (error: any) {
    console.error('Error getting growth chart data:', error);
    return [];
  }
};

/**
 * Get revenue chart data
 */
export const getRevenueChartData = async (days: number = 30) => {
  try {
    // Verify admin access
    await requireAdmin();

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get package purchases - safe query
    const packages = await safeQuery(async () => {
      const { data } = await supabase
        .from('user_packages')
        .select('amount, created_at')
        .gte('created_at', startDate);
      return data || [];
    }, []);

    // Get deposits - safe query
    const deposits = await safeQuery(async () => {
      const { data } = await supabase
        .from('deposits')
        .select('amount, created_at')
        .eq('status', 'approved')
        .gte('created_at', startDate);
      return data || [];
    }, []);

    // Combine and group by date
    const dateMap = new Map();

    packages.forEach(pkg => {
      const date = new Date(pkg.created_at).toISOString().split('T')[0];
      const current = dateMap.get(date) || { date, revenue: 0 };
      current.revenue += pkg.amount;
      dateMap.set(date, current);
    });

    deposits.forEach(dep => {
      const date = new Date(dep.created_at).toISOString().split('T')[0];
      const current = dateMap.get(date) || { date, revenue: 0 };
      current.revenue += dep.amount;
      dateMap.set(date, current);
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error: any) {
    console.error('Error getting revenue chart data:', error);
    return [];
  }
};
