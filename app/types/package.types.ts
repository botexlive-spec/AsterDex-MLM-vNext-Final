/**
 * Package Type Definitions
 * For investment packages and subscriptions
 */

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
  daily_return_percentage: number;
  max_return_percentage: number;
  min_investment?: number;
  max_investment?: number;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Calculated fields
  total_return?: number;
  daily_return?: number;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  amount_invested: number;
  start_date: string;
  end_date: string;
  daily_return: number;
  total_return: number;
  claimed_return: number;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  last_claim_date?: string;
  created_at: string;
  updated_at: string;
  // Relations
  package?: Package;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PackagePurchaseRequest {
  package_id: string;
  amount: number;
  payment_password: string;
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
  available_to_claim: number;
}

export interface PackageClaimRequest {
  user_package_id: string;
}

export interface PackageClaimResponse {
  claimed_amount: number;
  transaction_id: string;
  new_wallet_balance: number;
}
