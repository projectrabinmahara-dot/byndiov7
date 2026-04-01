import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These are read at RUNTIME in the browser, not at build time.
// Netlify injects them as window.__env__ or directly via VITE_ prefix.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if properly configured
const isConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

// Use placeholder values to prevent initialization errors
// The client will be created but won't work without proper config
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder.anon.key';

export const supabase: SupabaseClient = createClient(
  isConfigured ? supabaseUrl : fallbackUrl,
  isConfigured ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Prevent fetch errors from breaking the app
      fetch: (url, options) => {
        if (!isConfigured) {
          console.warn('[BYNDIO] Supabase not configured - operations will be skipped');
          return Promise.resolve(new Response(JSON.stringify({ error: 'Not configured' }), { status: 500 }));
        }
        return fetch(url, options);
      }
    }
  }
);

// Helper to check if Supabase is properly configured at runtime
export const isSupabaseConfigured = (): boolean => isConfigured;

// Warn in dev if not configured
if (!isConfigured && import.meta.env.DEV) {
  console.warn('[BYNDIO] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
}
