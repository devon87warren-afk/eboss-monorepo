/**
 * Supabase Client Configuration
 *
 * This module provides a singleton Supabase client instance for the application.
 * It supports both browser and server-side usage with proper environment variable handling.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Check if Supabase is properly configured
 * @returns boolean indicating if Supabase environment variables are set
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Singleton Supabase client instance
 * Returns null if Supabase is not configured (allows graceful fallback to mock data)
 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get the Supabase client instance
 * @returns SupabaseClient instance or null if not configured
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
};

/**
 * Supabase client for direct usage
 * Note: Will be null if environment variables are not set
 */
export const supabase = getSupabaseClient();

/**
 * Helper to check if we're connected to Supabase
 * Useful for determining whether to use real data or mock fallbacks
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('technician_locations').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
