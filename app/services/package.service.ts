/**
 * Package Service - Lifetime ROI System
 * Handles all package-related operations using MySQL backend API
 * NEW LOGIC: Lifetime ROI, No expiry, No limits
 */

import apiClient from '../utils/api-client';
import {
  Package,
  UserPackage,
  PackagePurchaseRequest,
  PackagePurchaseResponse,
  PackageStats,
} from '../types/package.types';

/**
 * Get the SINGLE global investment package
 * ✅ NEW ARCHITECTURE: Single package with $100-$100K slider
 */
export const getAvailablePackages = async (): Promise<Package[]> => {
  try {
    console.log('🔍 Fetching global investment package from backend...');

    const response = await apiClient.get<{ package: any }>('/packages');

    if (response.error) {
      console.error('❌ Error fetching package:', response.error);
      throw new Error(response.error);
    }

    const pkg = response.data?.package;
    if (!pkg) {
      console.error('❌ No package returned from API');
      throw new Error('Package not found');
    }

    console.log(`✅ Loaded global package: ${pkg.name}`);

    // Map single package to array format (for compatibility)
    const packageData: Package = {
      id: pkg.id,
      name: pkg.name,
      description: `${pkg.daily_roi_percentage}% daily ROI - Unlimited potential`,
      min_investment: pkg.min_investment, // $100
      max_investment: pkg.max_investment, // $100,000
      daily_return_percentage: pkg.daily_roi_percentage, // 0.4%
      level_income_percentages: pkg.level_income_percentages || [],
      matching_bonus_percentage: 0, // Disabled
      is_active: pkg.is_active,
      price: pkg.min_investment,
      // Slider configuration
      slider_min: pkg.slider_min || 100,
      slider_max: pkg.slider_max || 100000,
      slider_step: pkg.slider_step || 100,
      // New architecture fields
      levels: pkg.levels || 15,
      commission_type: pkg.commission_type || 'roi_on_roi',
      binary_enabled: false,
      booster_available: pkg.booster_available || false,
      monthly_reward_available: pkg.monthly_reward_available || false,
      // Lifetime ROI
      is_lifetime: true,
      has_expiry: false,
      has_limit: false,
    };

    return [packageData]; // Return as array for compatibility
  } catch (error: any) {
    console.error('Error fetching package:', error);
    throw new Error(error.message || 'Failed to load package');
  }
};

/**
 * Get a single package by ID
 */
export const getPackageById = async (packageId: string): Promise<Package | null> => {
  try {
    const packages = await getAvailablePackages();
    const pkg = packages.find(p => p.id.toString() === packageId.toString());

    if (!pkg) return null;

    return pkg;
  } catch (error: any) {
    console.error('Error fetching package:', error);
    throw new Error(error.message || 'Failed to load package');
  }
};

/**
 * Purchase a package with wallet balance
 * ✅ NEW: Includes idempotency support
 */
export const purchasePackage = async (
  request: PackagePurchaseRequest
): Promise<PackagePurchaseResponse> => {
  try {
    console.log('🛒 Purchasing package:', request);

    // Generate idempotency key to prevent duplicates
    const idempotencyKey = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Call backend API to purchase package
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      investment: any;
    }>('/packages/purchase', {
      package_id: request.package_id,
      investment_amount: request.amount,
      idempotency_key: idempotencyKey,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    const result = response.data!;

    console.log('✅ Package purchased successfully');

    // Map backend response to frontend format
    return {
      user_package: {
        id: result.investment?.id || '',
        user_id: '',
        package_id: request.package_id,
        package: result.investment?.package_name ? {
          id: request.package_id,
          name: result.investment.package_name,
          price: result.investment.investment_amount,
          daily_return_percentage: result.investment.daily_roi ?
            (result.investment.daily_roi / result.investment.investment_amount) * 100 : 5,
        } : undefined,
        amount_invested: result.investment?.investment_amount || request.amount,
        start_date: result.investment?.activation_date || new Date().toISOString(),
        daily_return: result.investment?.daily_roi || (request.amount * 0.05),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // ✅ LIFETIME ROI - NO END DATE, NO LIMITS
        is_lifetime: true,
        total_roi_earned: 0,
      },
      transaction_id: result.investment?.id || idempotencyKey,
      message: result.message,
    };
  } catch (error: any) {
    console.error('Error purchasing package:', error);
    throw new Error(error.message || 'Failed to purchase package');
  }
};

/**
 * Get user's active investments (packages)
 * ✅ NEW: Returns lifetime ROI investments with stop/withdraw status
 */
export const getUserPackages = async (
  status?: 'active' | 'stopped' | 'withdrawn' | 'cancelled'
): Promise<UserPackage[]> => {
  try {
    console.log('🔍 Fetching user investments...');

    const response = await apiClient.get<{ investments: any[] }>('/packages/my-packages');

    if (response.error) {
      throw new Error(response.error);
    }

    const investments = response.data?.investments || [];
    console.log(`✅ Found ${investments.length} user investments`);

    // Map backend format to frontend format (LIFETIME ROI)
    const mappedPackages = investments.map((inv: any) => ({
      id: inv.id,
      user_id: '',
      package_id: inv.package_id || '',
      package: inv.package_name ? {
        id: inv.package_id || '',
        name: inv.package_name,
        price: inv.investment_amount,
        daily_return_percentage: inv.daily_roi_amount ?
          (inv.daily_roi_amount / inv.investment_amount) * 100 : 5,
      } : undefined,
      amount_invested: inv.investment_amount,
      start_date: inv.activation_date,
      daily_return: inv.daily_roi_amount,
      status: inv.status,
      created_at: inv.activation_date,
      updated_at: inv.activation_date,
      // ✅ LIFETIME ROI FIELDS
      is_lifetime: true,
      total_roi_earned: inv.total_roi_earned || 0,
      days_active: inv.days_active || 0,
      can_stop: inv.can_stop || false,
      can_withdraw: inv.can_withdraw || false,
      stop_date: inv.stop_date,
      penalty_percentage: inv.penalty_percentage,
      principal_remaining: inv.principal_remaining,
      withdrawal_date: inv.withdrawal_date,
      // Booster fields
      booster_days_remaining: inv.booster_days_remaining || 0,
    }));

    // Filter by status if provided
    if (status) {
      return mappedPackages.filter(pkg => pkg.status === status);
    }

    return mappedPackages;
  } catch (error: any) {
    console.error('Error fetching user investments:', error);
    throw new Error(error.message || 'Failed to load your investments');
  }
};

/**
 * Get investment statistics for user dashboard
 * ✅ NEW: Updated for lifetime ROI system
 */
export const getPackageStats = async (): Promise<PackageStats> => {
  try {
    console.log('📊 Calculating investment stats...');

    // Get all user investments
    const packages = await getUserPackages();

    // Calculate stats
    const stats: PackageStats = {
      total_invested: 0,
      active_packages: 0,
      total_earned: 0,
      total_roi_earned: 0,
    };

    packages.forEach((pkg: UserPackage) => {
      stats.total_invested += pkg.amount_invested;
      stats.total_earned += pkg.total_roi_earned || 0;
      stats.total_roi_earned += pkg.total_roi_earned || 0;

      if (pkg.status === 'active') {
        stats.active_packages++;
      }
    });

    console.log('✅ Investment stats calculated:', stats);
    return stats;
  } catch (error: any) {
    console.error('Error fetching investment stats:', error);
    throw new Error(error.message || 'Failed to load investment statistics');
  }
};

/**
 * Get featured packages for homepage
 */
export const getFeaturedPackages = async (): Promise<Package[]> => {
  try {
    // Get all packages and return top 3
    const packages = await getAvailablePackages();
    return packages.slice(0, 3);
  } catch (error: any) {
    console.error('Error fetching featured packages:', error);
    throw new Error(error.message || 'Failed to load featured packages');
  }
};

/**
 * Check if user can purchase a package (has sufficient balance)
 * ✅ NEW: Validates $100 minimum and multiples of $100
 */
export const canPurchasePackage = async (
  packageId: string,
  amount: number
): Promise<{ canPurchase: boolean; reason?: string }> => {
  try {
    // ✅ NEW: $100 minimum validation
    if (amount < 100) {
      return {
        canPurchase: false,
        reason: 'Minimum investment is $100',
      };
    }

    // ✅ NEW: Multiples of $100 validation
    if (amount % 100 !== 0) {
      return {
        canPurchase: false,
        reason: 'Investment must be in multiples of $100 (e.g., $100, $200, $300...)',
      };
    }

    // Get package
    const pkg = await getPackageById(packageId);
    if (!pkg) {
      return { canPurchase: false, reason: 'Package not found' };
    }

    // Check min/max investment
    if (amount < (pkg.min_investment || pkg.price)) {
      return {
        canPurchase: false,
        reason: `Minimum investment for this package is $${pkg.min_investment || pkg.price}`,
      };
    }
    if (pkg.max_investment && amount > pkg.max_investment) {
      return {
        canPurchase: false,
        reason: `Maximum investment for this package is $${pkg.max_investment}`,
      };
    }

    // Get wallet balance from dashboard API
    const dashboardResponse = await apiClient.get<{ user: { wallet_balance: number } }>('/dashboard');

    if (dashboardResponse.error) {
      return { canPurchase: false, reason: 'Failed to verify balance' };
    }

    const walletBalance = dashboardResponse.data?.user?.wallet_balance || 0;

    if (walletBalance < amount) {
      return {
        canPurchase: false,
        reason: `Insufficient balance. You need $${(amount - walletBalance).toFixed(2)} more.`,
      };
    }

    return { canPurchase: true };
  } catch (error: any) {
    console.error('Error checking purchase eligibility:', error);
    return { canPurchase: false, reason: error.message || 'Failed to verify eligibility' };
  }
};

/**
 * Stop an active investment
 * ✅ NEW: Stop with penalty (15% within 30 days, 5% after)
 */
export const stopInvestment = async (
  investmentId: string,
  reason?: string
): Promise<{ success: boolean; message: string; details: any }> => {
  try {
    console.log('🛑 Stopping investment:', investmentId);

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      stop_details: any;
    }>('/investments/stop', {
      investment_id: investmentId,
      reason: reason || 'User requested stop',
    });

    if (response.error) {
      throw new Error(response.error);
    }

    console.log('✅ Investment stopped successfully');
    return {
      success: true,
      message: response.data?.message || 'Investment stopped successfully',
      details: response.data?.stop_details,
    };
  } catch (error: any) {
    console.error('Error stopping investment:', error);
    throw new Error(error.message || 'Failed to stop investment');
  }
};

/**
 * Withdraw principal after stopping
 * ✅ NEW: Withdraw remaining principal to wallet
 */
export const withdrawPrincipal = async (
  investmentId: string,
  notes?: string
): Promise<{ success: boolean; message: string; details: any }> => {
  try {
    console.log('💰 Withdrawing principal:', investmentId);

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      withdrawal_details: any;
    }>('/investments/withdraw', {
      investment_id: investmentId,
      notes: notes || 'Principal withdrawal',
    });

    if (response.error) {
      throw new Error(response.error);
    }

    console.log('✅ Principal withdrawn successfully');
    return {
      success: true,
      message: response.data?.message || 'Principal withdrawn successfully',
      details: response.data?.withdrawal_details,
    };
  } catch (error: any) {
    console.error('Error withdrawing principal:', error);
    throw new Error(error.message || 'Failed to withdraw principal');
  }
};

/**
 * Get stop investment preview (penalty calculation)
 * ✅ NEW: Preview penalty before stopping
 */
export const getStopPreview = async (
  investmentId: string
): Promise<{ preview: any }> => {
  try {
    console.log('🔍 Getting stop preview:', investmentId);

    const response = await apiClient.get<{ preview: any }>(`/investments/${investmentId}/stop-details`);

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      preview: response.data?.preview,
    };
  } catch (error: any) {
    console.error('Error getting stop preview:', error);
    throw new Error(error.message || 'Failed to get stop preview');
  }
};
