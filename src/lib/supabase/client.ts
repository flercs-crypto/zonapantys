import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { auth } from '$lib/firebase/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false
	},
	accessToken: async () => {
		if (!browser || !auth.currentUser) {
			return null;
		}

		return auth.currentUser.getIdToken();
	}
});