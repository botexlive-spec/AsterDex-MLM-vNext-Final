/**
 * MLM System Type Definitions
 * Multi-Level Marketing Business Logic Types
 */

export type PackageTier = 'tier_1' | 'tier_2' | 'tier_3';

export type TransactionType =
  | 'robot_subscription'
  | 'package_investment'
  | 'direct_income'
  | 'level_income'
  | 'booster_income'
  | 'matching_bonus'
  | 'roi_income'
  | 'rank_reward'
  | 'withdrawal'
  | 'deposit'
  | 'dex_trade'
  | 'kyc_fee';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export type RankType =
  | 'starter'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'double_diamond'
  | 'triple_diamond'
  | 'crown'
  | 'crown_ambassador';

// ============================================
// PACKAGE TYPES
// ============================================

export interface Package {
  id: string;
  name: string;
  tier: PackageTier;
  min_amount: number;
  max_amount?: number;
  roi_percentage_min: number;
  roi_percentage_max: number;
  description?: string;
  benefits?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  roi_percentage: number;
  purchased_at: string;
  is_active: boolean;
  roi_earned: number;
  created_at: string;
  package?: Package;
}

// ============================================
// ROBOT SUBSCRIPTION
// ============================================

export interface RobotSubscription {
  id: string;
  user_id: string;
  amount: number;
  purchased_at: string;
  expires_at: string;
  is_active: boolean;
  auto_renew: boolean;
  created_at: string;
}

// ============================================
// TRANSACTIONS
// ============================================

export interface MLMTransaction {
  id: string;
  user_id: string;
  from_user_id?: string;
  transaction_type: TransactionType;
  amount: number;
  status: TransactionStatus;
  level?: number;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

// ============================================
// BINARY TREE
// ============================================

export interface BinaryTreeNode {
  id: string;
  user_id: string;
  parent_id?: string;
  left_child_id?: string;
  right_child_id?: string;
  level: number;
  position: 'left' | 'right' | 'root';
  left_volume: number;
  right_volume: number;
  created_at: string;
  updated_at: string;
}

export interface TreeVisualization {
  user_id: string;
  email: string;
  full_name?: string;
  level: number;
  position: 'left' | 'right' | 'root';
  total_investment: number;
  children: TreeVisualization[];
}

// ============================================
// INCOME TYPES
// ============================================

export interface LevelIncome {
  id: string;
  user_id: string;
  from_user_id: string;
  level: number;
  amount: number;
  income_type: string;
  created_at: string;
}

export interface MatchingBonus {
  id: string;
  user_id: string;
  left_matches: number;
  right_matches: number;
  bonus_amount: number;
  achieved_at: string;
}

export interface BoosterIncome {
  id: string;
  user_id: string;
  direct_1_id: string;
  direct_2_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

// ============================================
// RANK & REWARDS
// ============================================

export interface RankAchievement {
  id: string;
  user_id: string;
  rank: RankType;
  total_volume: number;
  reward_amount: number;
  achieved_at: string;
}

export interface RankRequirement {
  rank: RankType;
  min_volume: number;
  reward_amount: number;
  description: string;
}

// ============================================
// KYC
// ============================================

export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_number?: string;
  document_url?: string;
  selfie_url?: string;
  status: KYCStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
}

// ============================================
// WITHDRAWALS & DEPOSITS
// ============================================

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: TransactionStatus;
  transaction_hash?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  transaction_hash?: string;
  status: TransactionStatus;
  deposited_at: string;
  confirmed_at?: string;
  confirmations: number;
}

// ============================================
// DEX TRADES
// ============================================

export interface DEXTrade {
  id: string;
  user_id: string;
  trade_type: 'buy' | 'sell' | 'swap';
  symbol: string;
  amount: number;
  price?: number;
  total_value: number;
  fee: number;
  status: TransactionStatus;
  trade_data?: Record<string, any>;
  executed_at: string;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// ============================================
// DASHBOARD DATA
// ============================================

export interface UserDashboardData {
  user: {
    id: string;
    email: string;
    full_name?: string;
    wallet_balance: number;
    total_investment: number;
    total_earnings: number;
    direct_count: number;
    team_count: number;
    current_rank: RankType;
    robot_subscription_active: boolean;
    robot_subscription_expires_at?: string;
    kyc_status: KYCStatus;
    levels_unlocked: number;
  };
  statistics: {
    today_earnings: number;
    week_earnings: number;
    month_earnings: number;
    left_volume: number;
    right_volume: number;
    total_volume: number;
    roi_earned: number;
  };
  recent_transactions: MLMTransaction[];
  active_packages: UserPackage[];
  direct_referrals: Array<{
    id: string;
    email: string;
    full_name?: string;
    total_investment: number;
    joined_at: string;
  }>;
  notifications: Notification[];
  next_rank: RankRequirement;
}

export interface AdminDashboardData {
  statistics: {
    total_users: number;
    active_users: number;
    total_investment: number;
    total_payouts: number;
    pending_kyc: number;
    pending_withdrawals: number;
    today_signups: number;
    week_signups: number;
  };
  recent_users: Array<{
    id: string;
    email: string;
    full_name?: string;
    total_investment: number;
    created_at: string;
  }>;
  pending_actions: {
    kyc_reviews: number;
    withdrawal_requests: number;
    support_tickets: number;
  };
  revenue_chart: Array<{
    date: string;
    revenue: number;
    payouts: number;
  }>;
}

// ============================================
// LEVEL INCOME CONFIGURATION
// ============================================

export interface LevelIncomeConfig {
  level: number;
  amount: number;
  unlockRequirement: string;
}

export const LEVEL_INCOME_CONFIG: LevelIncomeConfig[] = [
  { level: 1, amount: 20, unlockRequirement: '1 direct' },
  { level: 2, amount: 10, unlockRequirement: '2 directs' },
  { level: 3, amount: 5, unlockRequirement: '3 directs' },
  { level: 4, amount: 3, unlockRequirement: '4 directs' },
  { level: 5, amount: 2, unlockRequirement: '5 directs' },
  { level: 6, amount: 2, unlockRequirement: '6 directs' },
  { level: 7, amount: 2, unlockRequirement: '7 directs' },
  { level: 8, amount: 2, unlockRequirement: '8 directs' },
  { level: 9, amount: 2, unlockRequirement: '9 directs' },
  { level: 10, amount: 2, unlockRequirement: '10 directs' },
  { level: 11, amount: 1, unlockRequirement: '11 directs' },
  { level: 12, amount: 1, unlockRequirement: '11 directs' },
  { level: 13, amount: 1, unlockRequirement: '11 directs' },
  { level: 14, amount: 1, unlockRequirement: '11 directs' },
  { level: 15, amount: 1, unlockRequirement: '11 directs' },
  { level: 16, amount: 1, unlockRequirement: '11 directs' },
  { level: 17, amount: 1, unlockRequirement: '11 directs' },
  { level: 18, amount: 1, unlockRequirement: '11 directs' },
  { level: 19, amount: 1, unlockRequirement: '11 directs' },
  { level: 20, amount: 1, unlockRequirement: '11 directs' },
  { level: 21, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 22, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 23, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 24, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 25, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 26, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 27, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 28, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 29, amount: 0.5, unlockRequirement: '21 directs' },
  { level: 30, amount: 0.5, unlockRequirement: '21 directs' },
];

// ============================================
// MATCHING BONUS TIERS
// ============================================

export interface MatchingBonusTier {
  leftMatches: number;
  rightMatches: number;
  bonusAmount: number;
}

export const MATCHING_BONUS_TIERS: MatchingBonusTier[] = [
  { leftMatches: 25, rightMatches: 25, bonusAmount: 125 },
  { leftMatches: 50, rightMatches: 50, bonusAmount: 300 },
  { leftMatches: 100, rightMatches: 100, bonusAmount: 600 },
  { leftMatches: 150, rightMatches: 150, bonusAmount: 900 },
  { leftMatches: 300, rightMatches: 300, bonusAmount: 1800 },
  { leftMatches: 500, rightMatches: 500, bonusAmount: 3000 },
  { leftMatches: 1000, rightMatches: 1000, bonusAmount: 6000 },
  { leftMatches: 2500, rightMatches: 2500, bonusAmount: 15000 },
  { leftMatches: 5000, rightMatches: 5000, bonusAmount: 30000 },
  { leftMatches: 10000, rightMatches: 10000, bonusAmount: 60000 },
  { leftMatches: 25000, rightMatches: 25000, bonusAmount: 150000 },
  { leftMatches: 50000, rightMatches: 50000, bonusAmount: 300000 },
  { leftMatches: 100000, rightMatches: 100000, bonusAmount: 600000 },
  { leftMatches: 250000, rightMatches: 250000, bonusAmount: 1500000 },
  { leftMatches: 500000, rightMatches: 500000, bonusAmount: 3000000 },
  { leftMatches: 1000000, rightMatches: 1000000, bonusAmount: 6000000 },
  { leftMatches: 1200000, rightMatches: 1200000, bonusAmount: 10000000 },
  { leftMatches: 2500000, rightMatches: 2500000, bonusAmount: 21000000 },
];

// ============================================
// RANK REQUIREMENTS
// ============================================

export const RANK_REQUIREMENTS: RankRequirement[] = [
  {
    rank: 'starter',
    min_volume: 0,
    reward_amount: 0,
    description: 'Entry level',
  },
  {
    rank: 'bronze',
    min_volume: 25000,
    reward_amount: 125,
    description: 'Achieve $25,000 volume',
  },
  {
    rank: 'silver',
    min_volume: 50000,
    reward_amount: 250,
    description: 'Achieve $50,000 volume',
  },
  {
    rank: 'gold',
    min_volume: 100000,
    reward_amount: 500,
    description: 'Achieve $100,000 volume',
  },
  {
    rank: 'platinum',
    min_volume: 250000,
    reward_amount: 1250,
    description: 'Achieve $250,000 volume',
  },
  {
    rank: 'diamond',
    min_volume: 500000,
    reward_amount: 2500,
    description: 'Achieve $500,000 volume',
  },
  {
    rank: 'double_diamond',
    min_volume: 1000000,
    reward_amount: 5000,
    description: 'Achieve $1,000,000 volume',
  },
  {
    rank: 'triple_diamond',
    min_volume: 2500000,
    reward_amount: 12500,
    description: 'Achieve $2,500,000 volume',
  },
  {
    rank: 'crown',
    min_volume: 5000000,
    reward_amount: 25000,
    description: 'Achieve $5,000,000 volume',
  },
  {
    rank: 'crown_ambassador',
    min_volume: 10000000,
    reward_amount: 50000,
    description: 'Achieve $10,000,000 volume',
  },
];

// ============================================
// ROI ON ROI PERCENTAGES
// ============================================

export interface ROIOnROIConfig {
  level: number;
  percentage: number;
}

export const ROI_ON_ROI_CONFIG: ROIOnROIConfig[] = [
  { level: 1, percentage: 10 },
  { level: 2, percentage: 5 },
  { level: 3, percentage: 4 },
  { level: 4, percentage: 3 },
  { level: 5, percentage: 1 },
  { level: 6, percentage: 1 },
  { level: 7, percentage: 1 },
  { level: 8, percentage: 1 },
  { level: 9, percentage: 1 },
  { level: 10, percentage: 1 },
  { level: 11, percentage: 0.5 },
  { level: 12, percentage: 0.5 },
  { level: 13, percentage: 0.5 },
  { level: 14, percentage: 0.5 },
  { level: 15, percentage: 0.5 },
  { level: 16, percentage: 0.5 },
  { level: 17, percentage: 0.5 },
  { level: 18, percentage: 0.5 },
  { level: 19, percentage: 0.5 },
  { level: 20, percentage: 0.5 },
  { level: 21, percentage: 0.2 },
  { level: 22, percentage: 0.2 },
  { level: 23, percentage: 0.2 },
  { level: 24, percentage: 0.2 },
  { level: 25, percentage: 0.2 },
  { level: 26, percentage: 0.2 },
  { level: 27, percentage: 0.2 },
  { level: 28, percentage: 0.2 },
  { level: 29, percentage: 0.2 },
  { level: 30, percentage: 0.2 },
];

// ============================================
// FORM DATA TYPES
// ============================================

export interface PurchasePackageData {
  package_id: string;
  amount: number;
  payment_method: 'wallet' | 'dex';
}

export interface WithdrawalRequest {
  amount: number;
  wallet_address: string;
  notes?: string;
}

export interface KYCSubmission {
  document_type: string;
  document_number?: string;
  document_file: File;
  selfie_file: File;
}
