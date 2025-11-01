/**
 * Admin Dashboard Type Definitions
 * For Asterdex DEX Admin Panel
 */

import { User, UserRole } from './auth.types';
import { Referral, TradingActivity } from './referral.types';

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_user_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_traders: number;
  total_admins: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  total_referrals: number;
  total_trading_volume: number;
  total_commissions: number;
}

export interface UserManagementFilters {
  role?: UserRole;
  is_active?: boolean;
  email_verified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  email_verified?: boolean;
}

export interface ReferralAnalyticsFilters {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  status?: string;
}

export interface ReferralAnalyticsData {
  total_referrals: number;
  active_referrals: number;
  completed_referrals: number;
  total_commissions: number;
  avg_commission: number;
  top_referrers: Array<{
    user_id: string;
    user_email: string;
    referral_count: number;
    total_commission: number;
  }>;
  referrals_over_time: Array<{
    date: string;
    count: number;
    commission: number;
  }>;
}

export interface TradingVolumeData {
  total_volume: number;
  total_trades: number;
  avg_trade_size: number;
  volume_by_day: Array<{
    date: string;
    volume: number;
    trades: number;
  }>;
  top_traders: Array<{
    user_id: string;
    user_email: string;
    total_volume: number;
    trade_count: number;
  }>;
}

export interface SystemSettings {
  referral_commission_rate: number;
  min_trade_volume: number;
  max_referral_levels: number;
  email_notifications_enabled: boolean;
  maintenance_mode: boolean;
}

export interface ActivityLogEntry {
  id: string;
  type: 'user_login' | 'user_signup' | 'trade' | 'referral' | 'admin_action';
  user_id: string;
  user_email: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ActivityLogFilters {
  type?: ActivityLogEntry['type'];
  user_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface ActivityLogResponse {
  logs: ActivityLogEntry[];
  total: number;
  page: number;
  limit: number;
}
