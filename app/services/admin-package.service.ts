/**
 * Admin Package Service - Complete MLM Package Management
 * Handles packages, commission levels, analytics
 */

import { supabase } from './supabase.client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  min_investment: number;
  max_investment: number;
  daily_return_percentage: number;
  max_return_percentage: number;
  duration_days: number;
  level_depth: number;
  binary_bonus_percentage: number;
  direct_commission_percentage: number;
  binary_volume_multiplier: number;
  features: string[];
  status: 'active' | 'inactive';
  is_popular: boolean;
  sort_order: number;
  image_url?: string;
  allow_multiple_purchases: boolean;
  allow_upgrades: boolean;
  auto_renewal: boolean;
  min_rank_required?: string;
  kyc_required: boolean;
  robot_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageLevelCommission {
  id: string;
  package_id: string;
  level: number;
  commission_percentage: number;
}

export interface PackageFeature {
  id?: string;
  package_id?: string;
  feature_text: string;
  feature_icon?: string;
  display_order: number;
  is_highlighted: boolean;
}

export interface PackageAnalytics {
  package_id: string;
  total_purchases: number;
  total_active_users: number;
  total_expired_users: number;
  total_investment: number;
  total_roi_paid: number;
  average_investment: number;
  last_purchase_date: string;
}

export interface CreatePackageData {
  name: string;
  description: string;
  price: number;
  min_investment: number;
  max_investment: number;
  daily_return_percentage: number;
  max_return_percentage: number;
  duration_days: number;
  level_depth: number;
  binary_bonus_percentage: number;
  direct_commission_percentage: number;
  binary_volume_multiplier?: number;
  features: string[];
  is_popular: boolean;
  image_url?: string;
  allow_multiple_purchases?: boolean;
  allow_upgrades?: boolean;
  auto_renewal?: boolean;
  min_rank_required?: string;
  kyc_required?: boolean;
  robot_required?: boolean;
  level_commissions: { level: number; percentage: number }[];
}

// ============================================
// PACKAGE CRUD OPERATIONS
// ============================================

export async function getAllPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActivePackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPackageById(id: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createPackage(packageData: CreatePackageData): Promise<Package> {
  // Get current max sort_order
  const { data: packages } = await supabase
    .from('packages')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = packages && packages.length > 0 ? packages[0].sort_order + 1 : 0;

  // Create package
  const { data: newPackage, error: packageError } = await supabase
    .from('packages')
    .insert({
      name: packageData.name,
      description: packageData.description,
      price: packageData.price,
      min_investment: packageData.min_investment,
      max_investment: packageData.max_investment,
      daily_return_percentage: packageData.daily_return_percentage,
      max_return_percentage: packageData.max_return_percentage,
      duration_days: packageData.duration_days,
      level_depth: packageData.level_depth,
      binary_bonus_percentage: packageData.binary_bonus_percentage,
      direct_commission_percentage: packageData.direct_commission_percentage,
      binary_volume_multiplier: packageData.binary_volume_multiplier || 1.0,
      features: packageData.features,
      status: 'active',
      is_popular: packageData.is_popular,
      sort_order: nextSortOrder,
      image_url: packageData.image_url,
      allow_multiple_purchases: packageData.allow_multiple_purchases ?? true,
      allow_upgrades: packageData.allow_upgrades ?? true,
      auto_renewal: packageData.auto_renewal ?? false,
      min_rank_required: packageData.min_rank_required,
      kyc_required: packageData.kyc_required ?? false,
      robot_required: packageData.robot_required ?? false,
    })
    .select()
    .single();

  if (packageError) throw packageError;

  // Create level commissions
  if (packageData.level_commissions && packageData.level_commissions.length > 0) {
    const commissions = packageData.level_commissions.map(lc => ({
      package_id: newPackage.id,
      level: lc.level,
      commission_percentage: lc.percentage,
    }));

    const { error: commissionsError } = await supabase
      .from('package_level_commissions')
      .insert(commissions);

    if (commissionsError) throw commissionsError;
  }

  return newPackage;
}

export async function updatePackage(id: string, packageData: Partial<CreatePackageData>): Promise<Package> {
  const updateData: any = {
    ...packageData,
    updated_at: new Date().toISOString(),
  };

  // Remove level_commissions from update data (handle separately)
  const levelCommissions = updateData.level_commissions;
  delete updateData.level_commissions;

  // Update package
  const { data: updatedPackage, error: packageError } = await supabase
    .from('packages')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (packageError) throw packageError;

  // Update level commissions if provided
  if (levelCommissions && levelCommissions.length > 0) {
    // Delete existing commissions
    await supabase
      .from('package_level_commissions')
      .delete()
      .eq('package_id', id);

    // Insert new commissions
    const commissions = levelCommissions.map((lc: any) => ({
      package_id: id,
      level: lc.level,
      commission_percentage: lc.percentage,
    }));

    const { error: commissionsError } = await supabase
      .from('package_level_commissions')
      .insert(commissions);

    if (commissionsError) throw commissionsError;
  }

  return updatedPackage;
}

export async function deletePackage(id: string): Promise<void> {
  // Check if package has any active user packages
  const { data: userPackages, error: checkError } = await supabase
    .from('user_packages')
    .select('id')
    .eq('package_id', id)
    .eq('status', 'active')
    .limit(1);

  if (checkError) throw checkError;

  if (userPackages && userPackages.length > 0) {
    throw new Error('Cannot delete package with active subscriptions. Please deactivate first.');
  }

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function togglePackageStatus(id: string): Promise<Package> {
  // Get current status
  const pkg = await getPackageById(id);
  if (!pkg) throw new Error('Package not found');

  const newStatus = pkg.status === 'active' ? 'inactive' : 'active';

  const { data, error } = await supabase
    .from('packages')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reorderPackages(packageId: string, direction: 'up' | 'down'): Promise<void> {
  const packages = await getAllPackages();
  const currentIndex = packages.findIndex(p => p.id === packageId);

  if (currentIndex === -1) throw new Error('Package not found');

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= packages.length) {
    throw new Error('Cannot move package further');
  }

  const currentPackage = packages[currentIndex];
  const targetPackage = packages[targetIndex];

  // Swap sort orders
  await supabase
    .from('packages')
    .update({ sort_order: targetPackage.sort_order })
    .eq('id', currentPackage.id);

  await supabase
    .from('packages')
    .update({ sort_order: currentPackage.sort_order })
    .eq('id', targetPackage.id);
}

// ============================================
// LEVEL COMMISSIONS
// ============================================

export async function getPackageLevelCommissions(packageId: string): Promise<PackageLevelCommission[]> {
  const { data, error } = await supabase
    .from('package_level_commissions')
    .select('*')
    .eq('package_id', packageId)
    .order('level', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function setPackageLevelCommissions(
  packageId: string,
  commissions: { level: number; percentage: number }[]
): Promise<void> {
  // Delete existing
  await supabase
    .from('package_level_commissions')
    .delete()
    .eq('package_id', packageId);

  // Insert new
  const commissionsData = commissions.map(c => ({
    package_id: packageId,
    level: c.level,
    commission_percentage: c.percentage,
  }));

  const { error } = await supabase
    .from('package_level_commissions')
    .insert(commissionsData);

  if (error) throw error;
}

// ============================================
// PACKAGE ANALYTICS
// ============================================

export async function getPackageAnalytics(packageId: string): Promise<PackageAnalytics | null> {
  const { data, error } = await supabase
    .from('package_analytics')
    .select('*')
    .eq('package_id', packageId)
    .eq('analytics_date', new Date().toISOString().split('T')[0])
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

export async function getAllPackagesAnalytics(): Promise<Map<string, PackageAnalytics>> {
  const { data, error } = await supabase
    .from('package_analytics')
    .select('*')
    .eq('analytics_date', new Date().toISOString().split('T')[0]);

  if (error) throw error;

  const analyticsMap = new Map<string, PackageAnalytics>();
  data?.forEach(analytics => {
    analyticsMap.set(analytics.package_id, analytics);
  });

  return analyticsMap;
}

// ============================================
// PACKAGE FEATURES
// ============================================

export async function getPackageFeatures(packageId: string): Promise<PackageFeature[]> {
  const { data, error } = await supabase
    .from('package_features')
    .select('*')
    .eq('package_id', packageId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addPackageFeature(packageId: string, feature: Omit<PackageFeature, 'id' | 'package_id'>): Promise<PackageFeature> {
  const { data, error } = await supabase
    .from('package_features')
    .insert({
      package_id: packageId,
      ...feature,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePackageFeature(featureId: string, updates: Partial<PackageFeature>): Promise<PackageFeature> {
  const { data, error } = await supabase
    .from('package_features')
    .update(updates)
    .eq('id', featureId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePackageFeature(featureId: string): Promise<void> {
  const { error } = await supabase
    .from('package_features')
    .delete()
    .eq('id', featureId);

  if (error) throw error;
}
