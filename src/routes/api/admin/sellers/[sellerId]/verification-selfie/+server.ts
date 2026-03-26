import { hasAppRole } from '$lib/auth/roles';
import * as m from '$lib/paraglide/messages.js';
import { createSignedStorageObjectUrl, VERIFICATIONS_BUCKET } from '$lib/services/storage.server';
import { supabaseAdmin } from '$lib/supabase/server';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || !hasAppRole('admin', locals.user.roles, locals.user.role)) {
		return json({ message: m.api_not_authenticated() }, { status: 401 });
	}

	const { data, error } = await supabaseAdmin
		.from('sellers')
		.select('verification_selfie_url')
		.eq('id', params.sellerId)
		.maybeSingle();

	if (error || !data?.verification_selfie_url) {
		return json({ message: m.dashboard_admin_verification_selfie_unavailable() }, { status: 404 });
	}

	const signedUrl = await createSignedStorageObjectUrl(
		VERIFICATIONS_BUCKET,
		data.verification_selfie_url,
		300
	);

	return json({ signedUrl });
};