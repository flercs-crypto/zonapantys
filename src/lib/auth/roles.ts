import type { AppRole, RegistrationRole } from '$lib/types/database.types';

export const AUTH_ROLE_HOME = {
	buyer: '/dashboard',
	seller: '/dashboard/seller',
	admin: '/admin/dashboard'
} as const satisfies Record<AppRole, string>;

const LEGACY_ROLE_ALIASES = {
	client: 'buyer'
} as const;

export const toDatabaseProfileRole = (role: AppRole | RegistrationRole | null | undefined) => {
	if (!role) {
		return null;
	}

	return role;
};

export const REGISTERABLE_ROLES = ['buyer', 'seller'] as const satisfies readonly RegistrationRole[];

export const isAppRole = (value: unknown): value is AppRole =>
	typeof value === 'string' && value in AUTH_ROLE_HOME;

export const normalizeAppRoles = (...values: unknown[]): AppRole[] => {
	const roles = values.flatMap((value) => {
		if (Array.isArray(value)) {
			return value.flatMap((entry) => {
				const normalizedEntry = normalizeAppRole(entry);
				return normalizedEntry ? [normalizedEntry] : [];
			});
		}

		const normalizedValue = normalizeAppRole(value);
		return normalizedValue ? [normalizedValue] : [];
	});

	return Array.from(new Set(roles));
};

export const normalizeAppRole = (value: unknown): AppRole | null => {
	if (isAppRole(value)) {
		return value;
	}

	if (typeof value === 'string' && value in LEGACY_ROLE_ALIASES) {
		return LEGACY_ROLE_ALIASES[value as keyof typeof LEGACY_ROLE_ALIASES];
	}

	return null;
};

export const isRegistrationRole = (value: unknown): value is RegistrationRole =>
	typeof value === 'string' && REGISTERABLE_ROLES.includes(value as RegistrationRole);

const ROLE_HOME_PRIORITY: AppRole[] = ['admin', 'seller', 'buyer'];

export const getPrimaryAppRole = (...values: unknown[]) => {
	const roles = normalizeAppRoles(...values);
	return ROLE_HOME_PRIORITY.find((role) => roles.includes(role)) ?? null;
};

export const hasAppRole = (requiredRole: AppRole, ...values: unknown[]) =>
	normalizeAppRoles(...values).includes(requiredRole);

export const resolveRoleHome = (...values: unknown[]) => {
	const primaryRole = getPrimaryAppRole(...values);
	return primaryRole ? AUTH_ROLE_HOME[primaryRole] : null;
};