import { supabaseAdmin } from '$lib/supabase/server';

export const AVATARS_BUCKET = 'avatars';
export const PRODUCTS_BUCKET = 'products';
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
} as const;

const MIME_MAGIC_BYTES: Array<{
	mime: keyof typeof ALLOWED_IMAGE_MIME_TYPES;
	bytes: number[];
}> = [
	{ mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
	{ mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
	{ mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }
];

const detectMimeFromBytes = (
	bytes: Uint8Array
): keyof typeof ALLOWED_IMAGE_MIME_TYPES | null => {
	for (const entry of MIME_MAGIC_BYTES) {
		if (entry.bytes.every((byte, index) => bytes[index] === byte)) {
			return entry.mime;
		}
	}

	return null;
};

export type ValidatedImageUpload = {
	bytes: Uint8Array<ArrayBuffer>;
	contentType: keyof typeof ALLOWED_IMAGE_MIME_TYPES;
	extension: (typeof ALLOWED_IMAGE_MIME_TYPES)[keyof typeof ALLOWED_IMAGE_MIME_TYPES];
	fileName: string;
	originalName: string;
	size: number;
};

export class StorageUploadError extends Error {
	code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = 'StorageUploadError';
		this.code = code;
	}
}

const sanitizeFileName = (value: string) =>
	value
		.toLowerCase()
		.replace(/\.[^/.]+$/, '')
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);

const ensureFile = (value: FormDataEntryValue | null): File => {
	if (!(value instanceof File) || value.size === 0) {
		throw new StorageUploadError('storage/file-required', 'File is required');
	}

	return value;
};

export const validateImageUpload = async (
	value: FormDataEntryValue | null
): Promise<ValidatedImageUpload> => {
	const file = ensureFile(value);

	if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
		throw new StorageUploadError('storage/file-too-large', 'Image exceeds maximum size');
	}

	const bytes = new Uint8Array(await file.arrayBuffer());
	const detectedMime = detectMimeFromBytes(bytes);

	if (!detectedMime) {
		throw new StorageUploadError(
			'storage/invalid-type',
			'File content does not match any allowed image type'
		);
	}

	const extension = ALLOWED_IMAGE_MIME_TYPES[detectedMime];
	const baseName = sanitizeFileName(file.name) || 'image';

	return {
		bytes,
		contentType: detectedMime,
		extension,
		fileName: `${baseName}.${extension}`,
		originalName: file.name,
		size: bytes.length
	};
};

export const buildAvatarStoragePath = (firebaseUid: string, extension: string) =>
	`avatars/${firebaseUid}/avatar.${extension}`;

export const buildProductStoragePath = (
	sellerId: string,
	productId: string,
	fileName: string
) => `products/${sellerId}/${productId}/${fileName}`;

export const removeStorageFolderObjects = async (bucket: string, folderPath: string) => {
	const { data, error } = await supabaseAdmin.storage.from(bucket).list(folderPath, {
		limit: 100,
		offset: 0
	});

	if (error || !data || data.length === 0) {
		return;
	}

	const objectPaths = data
		.filter((entry) => entry.name && entry.id)
		.map((entry) => `${folderPath}/${entry.name}`);

	if (objectPaths.length === 0) {
		return;
	}

	await supabaseAdmin.storage.from(bucket).remove(objectPaths);
};

export const uploadPublicStorageObject = async (options: {
	bucket: string;
	path: string;
	file: ValidatedImageUpload;
	upsert?: boolean;
}) => {
	const { error } = await supabaseAdmin.storage.from(options.bucket).upload(options.path, options.file.bytes, {
		contentType: options.file.contentType,
		upsert: options.upsert ?? true
	});

	if (error) {
		throw new StorageUploadError('storage/upload-failed', error.message);
	}

	const {
		data: { publicUrl }
	} = supabaseAdmin.storage.from(options.bucket).getPublicUrl(options.path);

	return {
		path: options.path,
		publicUrl
	};
};