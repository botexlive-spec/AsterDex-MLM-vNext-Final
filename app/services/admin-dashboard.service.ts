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
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Verify admin access
    await requireAdmin();

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();

    // User metrics
    const { count: total_users } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: active_users } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: today_registrations } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart);

    const { count: week_registrations } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    const { count: month_registrations } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo);

    // Package metrics
    const { count: active_packages } = await supabase
      .from('user_packages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: total_packages_sold } = await supabase
      .from('user_packages')
      .select('*', { count: 'exact', head: true });

    // Financial metrics - Total investments
    const { data: userPackages } = await supabase
      .from('user_packages')
      .select('amount');

    const total_investments = userPackages?.reduce((sum, pkg) => sum + (pkg.amount || 0), 0) || 0;

    // Total withdrawals
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount, status')
      .eq('status', 'approved');

    const total_withdrawals = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    // Pending withdrawals
    const { count: pending_withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: pendingWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('status', 'pending');

    const pending_withdrawals_amount = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    // KYC metrics
    const { count: pending_kyc } = await supabase
      .from('kyc_documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approved_kyc } = await supabase
      .from('kyc_documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Commission metrics
    const { data: commissions } = await supabase
      .from('mlm_transactions')
      .select('amount')
      .in('transaction_type', [
        'direct_income',
        'level_income',
        'matching_bonus',
        'rank_reward',
        'booster_income',
      ]);

    const total_commissions_paid = commissions?.reduce((sum, c) => sum + Math.abs(c.amount), 0) || 0;

    // ROI distributed
    const { data: roiTransactions } = await supabase
      .from('mlm_transactions')
      .select('amount')
      .eq('transaction_type', 'roi_income');

    const total_roi_distributed = roiTransactions?.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0;

    // Binary earnings
    const { data: binaryTransactions } = await supabase
      .from('mlm_transactions')
      .select('amount')
      .eq('transaction_type', 'matching_bonus');

    const total_binary_earnings = binaryTransactions?.reduce((sum, b) => sum + Math.abs(b.amount), 0) || 0;

    // Robot subscriptions
    const { count: active_robot_subscriptions } = await supabase
      .from('robot_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

    // Calculate total revenue (investments + deposits)
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('status', 'approved');

    const total_deposits = deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const total_revenue = total_investments + total_deposits;

    return {
      total_users: total_users || 0,
      active_users: active_users || 0,
      today_registrations: today_registrations || 0,
      week_registrations: week_registrations || 0,
      month_registrations: month_registrations || 0,
      total_revenue,
      total_investments,
      total_withdrawals,
      pending_withdrawals: pending_withdrawals || 0,
      pending_withdrawals_amount,
      active_packages: active_packages || 0,
      total_packages_sold: total_packages_sold || 0,
      pending_kyc: pending_kyc || 0,
      approved_kyc: approved_kyc || 0,
      total_commissions_paid,
      pending_commissions: 0, // TODO: Calculate based on pending commission runs
      total_roi_distributed,
      total_binary_earnings,
      active_robot_subscriptions: active_robot_subscriptions || 0,
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
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    recentUsers?.forEach(user => {
      activities.push({
        id: `reg-${user.id}`,
        type: 'registration',
        user_id: user.id,
        user_name: user.full_name,
        description: 'New user registered',
        timestamp: user.created_at,
      });
    });

    // Get recent package purchases
    const { data: recentPackages } = await supabase
      .from('user_packages')
      .select(`
        id,
        amount,
        created_at,
        user:users!user_id(id, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    recentPackages?.forEach((pkg: any) => {
      activities.push({
        id: `pkg-${pkg.id}`,
        type: 'package',
        user_id: pkg.user.id,
        user_name: pkg.user.full_name,
        description: 'Package purchased',
        amount: pkg.amount,
        timestamp: pkg.created_at,
      });
    });

    // Get recent withdrawals
    const { data: recentWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select(`
        id,
        amount,
        created_at,
        user:users!user_id(id, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    recentWithdrawals?.forEach((withdrawal: any) => {
      activities.push({
        id: `withdrawal-${withdrawal.id}`,
        type: 'withdrawal',
        user_id: withdrawal.user.id,
        user_name: withdrawal.user.full_name,
        description: 'Withdrawal requested',
        amount: withdrawal.amount,
        timestamp: withdrawal.created_at,
      });
    });

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

    // Get package purchases
    const { data: packages } = await supabase
      .from('user_packages')
      .select('amount, created_at')
      .gte('created_at', startDate);

    // Get deposits
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount, created_at')
      .eq('status', 'approved')
      .gte('created_at', startDate);

    // Combine and group by date
    const dateMap = new Map();

    packages?.forEach(pkg => {
      const date = new Date(pkg.created_at).toISOString().split('T')[0];
      const current = dateMap.get(date) || { date, revenue: 0 };
      current.revenue += pkg.amount;
      dateMap.set(date, current);
    });

    deposits?.forEach(dep => {
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
