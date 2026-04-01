import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These are read at RUNTIME in the browser, not at build time.
// Netlify injects them as window.__env__ or directly via VITE_ prefix.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Check if properly configured
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create client - always valid, but may use fallback URL
export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false,
        } 
      }
    );

// Helper to check if Supabase is properly configured at runtime
export const isSupabaseConfigured = (): boolean => isConfigured;

// Warn in dev if not configured
if (!isConfigured && import.meta.env.DEV) {
  console.warn('[BYNDIO] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
}
