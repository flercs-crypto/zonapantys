export type AppRole = 'buyer' | 'seller' | 'admin';
export type RegistrationRole = Exclude<AppRole, 'admin'>;
export type SellerVerificationStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus =
	| 'pending'
	| 'confirmed'
	| 'completed'
	| 'shipped'
	| 'delivered'
	| 'cancelled';

export interface Profile {
	id: string;
	firebase_uid: string;
	email: string;
	display_name: string | null;
	avatar_url: string | null;
	is_active: boolean;
	email_verified: boolean;
	role: AppRole | null;
	roles: AppRole[];
	created_at: string;
	updated_at: string;
}

export interface Seller {
	id: string;
	profile_id: string;
	store_name: string;
	store_slug: string;
	description: string | null;
	phone: string | null;
	country: string | null;
	logo_url: string | null;
	banner_url: string | null;
	is_active: boolean;
	verification_status: SellerVerificationStatus;
	verification_selfie_url: string | null;
	rejection_reason: string | null;
	verified_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface Product {
	id: string;
	seller_id: string;
	name: string;
	description: string | null;
	price: number;
	stock: number;
	images: string[];
	category: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Order {
	id: string;
	buyer_id: string | null;
	seller_id: string | null;
	status: OrderStatus;
	total: number;
	shipping_address: Record<string, unknown> | null;
	tracking_number: string | null;
	shipping_provider: string | null;
	shipped_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface OrderItem {
	id: string;
	order_id: string;
	product_id: string | null;
	quantity: number;
	unit_price: number;
}

export interface Favorite {
	id: string;
	profile_id: string;
	product_id: string;
	created_at: string;
}

export interface Review {
	id: string;
	seller_id: string;
	buyer_id: string;
	product_id: string;
	order_id: string;
	rating: number;
	comment: string | null;
	created_at: string;
}

export interface StoreVisit {
	id: string;
	seller_id: string;
	visited_at: string;
}

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type SellerInsert = Omit<Seller, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type SellerUpdate = Partial<Omit<Seller, 'id' | 'created_at' | 'updated_at'>>;

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type OrderUpdate = Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;

export type OrderItemInsert = Omit<OrderItem, 'id'> & { id?: string };
export type OrderItemUpdate = Partial<Omit<OrderItem, 'id'>>;

export type FavoriteInsert = Omit<Favorite, 'id' | 'created_at'> & { id?: string };
export type FavoriteUpdate = Partial<Omit<Favorite, 'id' | 'created_at'>>;

export type ReviewInsert = Omit<Review, 'id' | 'created_at'> & { id?: string };
export type ReviewUpdate = Partial<Omit<Review, 'id' | 'created_at'>>;

export type StoreVisitInsert = Omit<StoreVisit, 'id' | 'visited_at'> & { id?: string };
export type StoreVisitUpdate = Partial<Omit<StoreVisit, 'id' | 'visited_at'>>;

export type ProfileRegistrationAction = 'created' | 'updated' | 'role-added' | 'noop';

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: Profile;
				Insert: ProfileInsert;
				Update: ProfileUpdate;
				Relationships: [];
			};
			sellers: {
				Row: Seller;
				Insert: SellerInsert;
				Update: SellerUpdate;
				Relationships: [];
			};
			products: {
				Row: Product;
				Insert: ProductInsert;
				Update: ProductUpdate;
				Relationships: [];
			};
			orders: {
				Row: Order;
				Insert: OrderInsert;
				Update: OrderUpdate;
				Relationships: [];
			};
			order_items: {
				Row: OrderItem;
				Insert: OrderItemInsert;
				Update: OrderItemUpdate;
				Relationships: [];
			};
			favorites: {
				Row: Favorite;
				Insert: FavoriteInsert;
				Update: FavoriteUpdate;
				Relationships: [];
			};
			reviews: {
				Row: Review;
				Insert: ReviewInsert;
				Update: ReviewUpdate;
				Relationships: [];
			};
			store_visits: {
				Row: StoreVisit;
				Insert: StoreVisitInsert;
				Update: StoreVisitUpdate;
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
}

export type TableName = keyof Database['public']['Tables'];
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

export type NewProduct = ProductInsert;
export type NewOrder = OrderInsert;