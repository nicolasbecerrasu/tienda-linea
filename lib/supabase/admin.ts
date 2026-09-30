import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isServiceRoleConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  serviceRoleKey !== 'tu-service-role-key-aqui'
);

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL o SERVICE_ROLE_KEY no están configurados en las variables de entorno.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
