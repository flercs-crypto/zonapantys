import imageCompression from 'browser-image-compression';

const IMAGE_EXTENSION_BY_MIME = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
} as const;

type SupportedImageMimeType = keyof typeof IMAGE_EXTENSION_BY_MIME;

export type ImageCompressionOptions = {
	maxWidth: number;
	quality: number;
	maxBytes: number;
};

export type CompressionResult = {
	file: File;
	compressed: boolean;
};

export const PRODUCT_IMAGE_COMPRESSION: ImageCompressionOptions = {
	maxWidth: 800,
	quality: 0.8,
	maxBytes: 500 * 1024
};

export const AVATAR_IMAGE_COMPRESSION: ImageCompressionOptions = {
	maxWidth: 400,
	quality: 0.85,
	maxBytes: 200 * 1024
};

export const VERIFICATION_SELFIE_COMPRESSION: ImageCompressionOptions = {
	maxWidth: 1200,
	quality: 0.85,
	maxBytes: 800 * 1024
};

const isSupportedImageType = (fileType: string): fileType is SupportedImageMimeType =>
	fileType in IMAGE_EXTENSION_BY_MIME;

const replaceExtension = (fileName: string, extension: string) => {
	const baseName = fileName.replace(/\.[^.]+$/, '');
	return `${baseName || 'image'}.${extension}`;
};

const normalizeCompressedFile = (file: File) => {
	if (!isSupportedImageType(file.type)) {
		return file;
	}

	const expectedExtension = IMAGE_EXTENSION_BY_MIME[file.type];
	const normalizedName = replaceExtension(file.name, expectedExtension);

	if (normalizedName === file.name) {
		return file;
	}

	return new File([file], normalizedName, {
		type: file.type,
		lastModified: file.lastModified
	});
};

export const compressImageFile = async (
	file: File,
	options: ImageCompressionOptions
): Promise<CompressionResult> => {
	if (typeof window === 'undefined' || !isSupportedImageType(file.type)) {
		return { file, compressed: false };
	}

	try {
		const compressedFile = await imageCompression(file, {
			maxSizeMB: options.maxBytes / (1024 * 1024),
			maxWidthOrHeight: options.maxWidth,
			initialQuality: options.quality,
			useWebWorker: true,
			fileType: file.type,
			preserveExif: false
		});

		const normalizedFile = normalizeCompressedFile(compressedFile);

		if (normalizedFile.size >= file.size) {
			return { file, compressed: false };
		}

		return { file: normalizedFile, compressed: true };
	} catch (error) {
		console.error('Image compression failed. Uploading original file instead.', error);
		return { file, compressed: false };
	}
};