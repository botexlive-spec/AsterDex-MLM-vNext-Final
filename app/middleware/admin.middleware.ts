/**
 * Admin Authorization Middleware
 * Provides role-based access control for admin endpoints
 */

import { supabase } from '../services/supabase.client';

/**
 * Verify that the current user has admin privileges
 * @throws Error if user is not authenticated or not an admin
 */
export const requireAdmin = async (): Promise<void> => {
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Authentication error:', authError);
    throw new Error('Authentication required');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check admin role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user role:', userError);
    throw new Error('Failed to verify user permissions');
  }

  if (!userData) {
    throw new Error('User not found');
  }

  // Allow both 'admin' and 'superadmin' roles
  if (userData.role !== 'admin' && userData.role !== 'superadmin') {
    console.warn(`Unauthorized admin access attempt by user ${user.id} with role: ${userData.role}`);
    throw new Error('Admin access required. You do not have permission to perform this action.');
  }

  // Successfully verified as admin
  console.log(`Admin access granted for user ${user.id} (role: ${userData.role})`);
};

/**
 * Verify that the current user has superadmin privileges
 * @throws Error if user is not authenticated or not a superadmin
 */
export const requireSuperAdmin = async (): Promise<void> => {
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Authentication error:', authError);
    throw new Error('Authentication required');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check superadmin role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user role:', userError);
    throw new Error('Failed to verify user permissions');
  }

  if (!userData) {
    throw new Error('User not found');
  }

  // Only allow 'superadmin' role
  if (userData.role !== 'superadmin') {
    console.warn(`Unauthorized superadmin access attempt by user ${user.id} with role: ${userData.role}`);
    throw new Error('Superadmin access required. You do not have permission to perform this action.');
  }

  // Successfully verified as superadmin
  console.log(`Superadmin access granted for user ${user.id}`);
};

/**
 * Get the current authenticated user's role
 * @returns The user's role or null if not authenticated
 */
export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    return userData.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Check if the current user is an admin (admin or superadmin)
 * @returns true if user is admin or superadmin, false otherwise
 */
export const isAdmin = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  return role === 'admin' || role === 'superadmin';
};

/**
 * Check if the current user is a superadmin
 * @returns true if user is superadmin, false otherwise
 */
export const isSuperAdmin = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  return role === 'superadmin';
};
