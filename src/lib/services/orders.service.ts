import * as m from '$lib/paraglide/messages.js';
import { supabase } from '$lib/supabase/client';
import type { NewOrder, Order, OrderStatus } from '$lib/types/database.types';
import { createDataServiceError } from './service.utils';

export const createOrder = async (data: NewOrder): Promise<Order> => {
	const { data: order, error } = await supabase.from('orders').insert(data).select('*').single();

	if (error) {
		throw createDataServiceError(m.service_orders_create_failed(), 'orders/create-failed', error);
	}

	return order;
};

export const getOrdersByBuyer = async (buyerId: string): Promise<Order[]> => {
	const { data, error } = await supabase
		.from('orders')
		.select('*')
		.eq('buyer_id', buyerId)
		.order('created_at', { ascending: false });

	if (error) {
		throw createDataServiceError(m.service_orders_by_buyer_failed(), 'orders/by-buyer', error);
	}

	return data;
};

export const getOrdersBySeller = async (sellerId: string): Promise<Order[]> => {
	const { data, error } = await supabase
		.from('orders')
		.select('*')
		.eq('seller_id', sellerId)
		.order('created_at', { ascending: false });

	if (error) {
		throw createDataServiceError(m.service_orders_by_seller_failed(), 'orders/by-seller', error);
	}

	return data;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
	const { data: order, error } = await supabase
		.from('orders')
		.update({ status })
		.eq('id', orderId)
		.select('*')
		.single();

	if (error) {
		throw createDataServiceError(
			m.service_orders_update_status_failed(),
			'orders/update-status',
			error
		);
	}

	return order;
};
