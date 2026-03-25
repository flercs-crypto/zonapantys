type RateLimitEntry = {
	count: number;
	resetAt: number;
};

type RateLimitConfig = {
	windowMs: number;
	maxRequests: number;
};

const buckets = new Map<string, Map<string, RateLimitEntry>>();

const getBucket = (name: string) => {
	let bucket = buckets.get(name);

	if (!bucket) {
		bucket = new Map();
		buckets.set(name, bucket);
	}

	return bucket;
};

export const createRateLimiter = (name: string, config: RateLimitConfig) => {
	const bucket = getBucket(name);

	return {
		check(key: string): { allowed: boolean; retryAfterMs: number } {
			const now = Date.now();
			const entry = bucket.get(key);

			if (!entry || now >= entry.resetAt) {
				bucket.set(key, { count: 1, resetAt: now + config.windowMs });
				return { allowed: true, retryAfterMs: 0 };
			}

			if (entry.count >= config.maxRequests) {
				return { allowed: false, retryAfterMs: entry.resetAt - now };
			}

			entry.count += 1;
			return { allowed: true, retryAfterMs: 0 };
		}
	};
};

export const sessionRateLimit = createRateLimiter('session', {
	windowMs: 60_000,
	maxRequests: 10
});

export const profileRateLimit = createRateLimiter('profile', {
	windowMs: 60_000,
	maxRequests: 15
});

export const checkoutRateLimit = createRateLimiter('checkout', {
	windowMs: 60_000,
	maxRequests: 5
});

export const uploadRateLimit = createRateLimiter('upload', {
	windowMs: 60_000,
	maxRequests: 10
});
