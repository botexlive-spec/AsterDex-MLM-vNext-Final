/**
 * Package Type Definitions - Lifetime ROI System
 * For lifetime ROI investment packages
 * ✅ NEW LOGIC: No expiry, No limits, Stop anytime
 */

export interface Package {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  min_investment?: number;
  max_investment?: number;
  daily_return_percentage: number;
  level_income_percentages?: number[];
  matching_bonus_percentage?: number;
  is_active: boolean;
  is_featured?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  // ✅ LIFETIME ROI FLAGS
  is_lifetime?: boolean;
  has_expiry?: boolean;
  has_limit?: boolean;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  amount_invested: number;
  start_date: string;
  daily_return: number;
  status: 'active' | 'stopped' | 'withdrawn' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Relations
  package?: {
    id: string;
    name: string;
    price: number;
    daily_return_percentage: number;
  };
  // ✅ LIFETIME ROI FIELDS
  is_lifetime?: boolean;
  total_roi_earned?: number;
  days_active?: number;
  can_stop?: boolean;
  can_withdraw?: boolean;
  stop_date?: string;
  penalty_percentage?: number;
  principal_remaining?: number;
  withdrawal_date?: string;
  // Booster fields
  booster_days_remaining?: number;
}

export interface PackagePurchaseRequest {
  package_id: string;
  amount: number;
  payment_password?: string; // Optional, not used in backend (JWT auth)
  idempotency_key?: string; // Optional, for duplicate prevention
}

export interface PackagePurchaseResponse {
  user_package: UserPackage;
  transaction_id: string;
  message: string;
}

export interface PackageStats {
  total_invested: number;
  active_packages: number;
  total_earned: number;
  total_roi_earned?: number;
}

/**
 * Stop Investment Request
 * ✅ NEW: Stop with penalty
 */
export interface StopInvestmentRequest {
  investment_id: string;
  reason?: string;
}

export interface StopInvestmentResponse {
  success: boolean;
  message: string;
  stop_details: {
    investment_id: string;
    stop_date: string;
    days_active: number;
    investment_amount: number;
    total_roi_earned: number;
    penalty_percentage: number;
    penalty_amount: number;
    principal_remaining: number;
    note: string;
  };
}

/**
 * Withdraw Principal Request
 * ✅ NEW: Withdraw after stopping
 */
export interface WithdrawPrincipalRequest {
  investment_id: string;
  notes?: string;
}

export interface WithdrawPrincipalResponse {
  success: boolean;
  message: string;
  withdrawal_details: {
    investment_id: string;
    principal_amount: number;
    withdrawal_date: string;
    transaction_id: string;
    new_wallet_balance: number;
    note: string;
  };
}

/**
 * Stop Preview (Penalty Calculation)
 * ✅ NEW: Preview before stopping
 */
export interface StopPreviewResponse {
  investment_id: string;
  current_status: string;
  can_stop: boolean;
  preview: {
    days_active: number;
    investment_amount: number;
    total_roi_earned: number;
    penalty_percentage: number;
    penalty_amount: number;
    principal_remaining: number;
    warning: string;
  };
}
