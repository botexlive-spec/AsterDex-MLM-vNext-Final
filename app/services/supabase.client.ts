/**
 * Supabase Client Configuration
 * For Asterdex DEX Backend Connection
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getRuntimeConfig } from '../utils/runtime-config';

// Supabase configuration - uses runtime config with fallback to env vars
const supabaseUrl = getRuntimeConfig('VITE_SUPABASE_URL') || 'http://localhost:54321';
const supabaseAnonKey = getRuntimeConfig('VITE_SUPABASE_ANON_KEY') || '';

if (!supabaseAnonKey) {
  console.warn('⚠️  VITE_SUPABASE_ANON_KEY is not set in environment variables');
} else {
  console.log('✅ Supabase configuration loaded:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });
}

// Create Supabase client instance
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'asterdex-web',
    },
  },
});

/**
 * Get the current authenticated user from Supabase
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

/**
 * Get the current session from Supabase
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting current session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return null;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
};

/**
 * Subscribe to authentication state changes
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Export as default for convenience
export default supabase;
