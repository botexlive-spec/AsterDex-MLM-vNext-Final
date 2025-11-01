/**
 * Referral System Type Definitions
 * For Asterdex DEX Referral Marketing System
 */

export type ReferralStatus = 'pending' | 'active' | 'completed';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  clicks: number;
  signups: number;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: ReferralStatus;
  commission_earned: number;
  created_at: string;
}

export interface TradingActivity {
  id: string;
  user_id: string;
  trade_volume: number;
  commission: number;
  referrer_commission: number;
  trade_data?: Record<string, any>;
  created_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_clicks: number;
  total_signups: number;
  total_commission: number;
  conversion_rate: number;
}

export interface ReferralAnalytics {
  referral_code: string;
  clicks: number;
  signups: number;
  conversions: number;
  total_commission: number;
  avg_commission: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CreateReferralCodeData {
  expires_at?: string;
}

export interface UpdateReferralCodeData {
  is_active?: boolean;
  expires_at?: string;
}

export interface ReferralDashboardData {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  codes: ReferralCode[];
  referrals: Referral[];
  stats: ReferralStats;
  recent_activity: TradingActivity[];
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_referrals: number;
  total_commission: number;
  rank: number;
}
