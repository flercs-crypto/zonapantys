import * as m from '$lib/paraglide/messages.js';
import { supabase } from '$lib/supabase/client';
import type { NewProduct, Product, ProductUpdate } from '$lib/types/database.types';
import { createDataServiceError } from './service.utils';

export const getProductsBySeller = async (sellerId: string): Promise<Product[]> => {
	const { data, error } = await supabase
		.from('products')
		.select('*')
		.eq('seller_id', sellerId)
		.order('created_at', { ascending: false });

	if (error) {
		throw createDataServiceError(
			m.service_products_by_seller_failed(),
			'products/by-seller',
			error
		);
	}

	return data;
};

export const getProductById = async (id: string): Promise<Product | null> => {
	const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

	if (error) {
		throw createDataServiceError(m.service_products_by_id_failed(), 'products/by-id', error);
	}

	return data;
};

export const createProduct = async (data: NewProduct): Promise<Product> => {
	const { data: product, error } = await supabase
		.from('products')
		.insert(data)
		.select('*')
		.single();

	if (error) {
		throw createDataServiceError(
			m.service_products_create_failed(),
			'products/create-failed',
			error
		);
	}

	return product;
};

export const updateProduct = async (id: string, data: Partial<ProductUpdate>): Promise<Product> => {
	const { data: product, error } = await supabase
		.from('products')
		.update(data)
		.eq('id', id)
		.select('*')
		.single();

	if (error) {
		throw createDataServiceError(
			m.service_products_update_failed(),
			'products/update-failed',
			error
		);
	}

	return product;
};

export const deleteProduct = async (id: string): Promise<void> => {
	const { error } = await supabase.from('products').delete().eq('id', id);

	if (error) {
		throw createDataServiceError(
			m.service_products_delete_failed(),
			'products/delete-failed',
			error
		);
	}
};
