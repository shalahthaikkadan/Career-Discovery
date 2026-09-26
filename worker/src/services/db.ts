import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from '../types';

export function getSupabase(env: Env): SupabaseClient {
  const url = env.SUPABASE_URL || 'https://qhrmenvunfcykvmpyshb.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in worker environment.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
