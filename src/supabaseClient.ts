import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables or localStorage
export function getSupabaseCredentials() {
  const url = (import.meta as any).env.VITE_SUPABASE_URL || localStorage.getItem('mpls_supabase_url') || 'https://nwywugpsucforoergrzj.supabase.co';
  const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('mpls_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eXd1Z3BzdWNmb3JvZXJncnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTQwNzQsImV4cCI6MjA5OTU5MDA3NH0.vnCbrnPgnW73VzeG81c3NRuIw13-DmGcnC3x0pdnCec';
  return { url: url.trim(), anonKey: anonKey.trim() };
}

// Check if Supabase is fully configured
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return url.startsWith('http') && anonKey.length > 10;
}

// Lazily initialize Supabase client to prevent crashes if config is incomplete
let supabaseClientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  const { url, anonKey } = getSupabaseCredentials();
  
  // Recreate client if configuration has changed
  if (
    !supabaseClientInstance || 
    (supabaseClientInstance as any).supabaseUrl !== url || 
    (supabaseClientInstance as any).supabaseKey !== anonKey
  ) {
    supabaseClientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false // Disable auth persistence to avoid interference with local logic
      }
    });
  }
  
  return supabaseClientInstance;
}
