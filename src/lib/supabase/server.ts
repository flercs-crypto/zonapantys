import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseAdmin: SupabaseClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false
	}
});