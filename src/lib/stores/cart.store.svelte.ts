import { browser } from '$app/environment';

export type CartProductSnapshot = {
	id: string;
	sellerId: string;
	sellerSlug: string;
	sellerName: string;
	name: string;
	description: string;
	image: string;
	alt: string;
	price: number;
};

export type CartItem = {
	id: string;
	product: CartProductSnapshot;
	quantity: number;
	price: number;
	note: string;
	addedAt: string;
};

type CartGroup = {
	sellerId: string;
	sellerSlug: string;
	sellerName: string;
	items: CartItem[];
	subtotal: number;
};

const STORAGE_KEY = 'zonapantys.cart.v1';

const normalizeNote = (note: string) => note.trim();

const isCartProductSnapshot = (value: unknown): value is CartProductSnapshot => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const product = value as Record<string, unknown>;
	return (
		typeof product.id === 'string' &&
		typeof product.sellerId === 'string' &&
		typeof product.sellerSlug === 'string' &&
		typeof product.sellerName === 'string' &&
		typeof product.name === 'string' &&
		typeof product.description === 'string' &&
		typeof product.image === 'string' &&
		typeof product.alt === 'string' &&
		typeof product.price === 'number'
	);
};

const isCartItem = (value: unknown): value is CartItem => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const item = value as Record<string, unknown>;
	return (
		typeof item.id === 'string' &&
		isCartProductSnapshot(item.product) &&
		typeof item.quantity === 'number' &&
		typeof item.price === 'number' &&
		typeof item.note === 'string' &&
		typeof item.addedAt === 'string'
	);
};

class CartStore {
	items = $state<CartItem[]>([]);
	isReady = $state(false);
	totalItems = $derived(this.items.reduce((total, item) => total + item.quantity, 0));
	subtotal = $derived(
		this.items.reduce((total, item) => total + item.quantity * item.price, 0)
	);
	isEmpty = $derived(this.items.length === 0);
	groupedItems = $derived.by(() => {
		const groups = new Map<string, CartGroup>();

		for (const item of this.items) {
			const existingGroup = groups.get(item.product.sellerId);

			if (existingGroup) {
				existingGroup.items.push(item);
				existingGroup.subtotal += item.price * item.quantity;
				continue;
			}

			groups.set(item.product.sellerId, {
				sellerId: item.product.sellerId,
				sellerSlug: item.product.sellerSlug,
				sellerName: item.product.sellerName,
				items: [item],
				subtotal: item.price * item.quantity
			});
		}

		return Array.from(groups.values());
	});

	init() {
		if (!browser || this.isReady) {
			return;
		}

		this.load();
		this.isReady = true;
	}

	addItem(product: CartProductSnapshot, note = '') {
		this.init();

		const normalizedNote = normalizeNote(note);
		const existingItem = this.items.find(
			(item) => item.product.id === product.id && item.note === normalizedNote
		);

		if (existingItem) {
			existingItem.quantity += 1;
			existingItem.price = product.price;
			existingItem.product = product;
			this.persist();
			return;
		}

		this.items = [
			...this.items,
			{
				id: browser && 'randomUUID' in crypto ? crypto.randomUUID() : `${product.id}-${Date.now()}`,
				product,
				quantity: 1,
				price: product.price,
				note: normalizedNote,
				addedAt: new Date().toISOString()
			}
		];
		this.persist();
	}

	updateQuantity(itemId: string, quantity: number) {
		this.init();

		if (quantity <= 0) {
			this.removeItem(itemId);
			return;
		}

		const item = this.items.find((entry) => entry.id === itemId);

		if (!item) {
			return;
		}

		item.quantity = quantity;
		this.persist();
	}

	updateNote(itemId: string, note: string) {
		this.init();

		const item = this.items.find((entry) => entry.id === itemId);

		if (!item) {
			return;
		}

		item.note = normalizeNote(note);
		this.persist();
	}

	removeItem(itemId: string) {
		this.init();
		this.items = this.items.filter((item) => item.id !== itemId);
		this.persist();
	}

	clear() {
		this.init();
		this.items = [];
		this.persist();
	}

	private load() {
		if (!browser) {
			return;
		}

		try {
			const rawValue = window.localStorage.getItem(STORAGE_KEY);

			if (!rawValue) {
				this.items = [];
				return;
			}

			const parsed = JSON.parse(rawValue) as unknown;

			if (Array.isArray(parsed)) {
				this.items = parsed.filter(isCartItem);
				return;
			}

			this.items = [];
		} catch {
			this.items = [];
		}
	}

	private persist() {
		if (!browser) {
			return;
		}

		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
	}
}

export const cartStore = new CartStore();

if (browser) {
	cartStore.init();
}
