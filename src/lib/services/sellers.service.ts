import * as m from '$lib/paraglide/messages.js';
import { supabase } from '$lib/supabase/client';
import type { Seller, SellerUpdate } from '$lib/types/database.types';
import { createDataServiceError } from './service.utils';

export const getSellerBySlug = async (slug: string): Promise<Seller | null> => {
	const { data, error } = await supabase
		.from('sellers')
		.select('*')
		.eq('store_slug', slug)
		.maybeSingle();

	if (error) {
		throw createDataServiceError(
			m.service_sellers_by_slug_failed(),
			'sellers/fetch-by-slug',
			error
		);
	}

	return data;
};

export const getSellerById = async (id: string): Promise<Seller | null> => {
	const { data, error } = await supabase.from('sellers').select('*').eq('id', id).maybeSingle();

	if (error) {
		throw createDataServiceError(m.service_sellers_by_id_failed(), 'sellers/fetch-by-id', error);
	}

	return data;
};

export const updateSeller = async (id: string, data: Partial<SellerUpdate>): Promise<Seller> => {
	const { data: updatedSeller, error } = await supabase
		.from('sellers')
		.update(data)
		.eq('id', id)
		.select('*')
		.single();

	if (error) {
		throw createDataServiceError(m.service_sellers_update_failed(), 'sellers/update-failed', error);
	}

	return updatedSeller;
};
