export class DataServiceError extends Error {
	code: string;
	cause?: unknown;

	constructor(message: string, code = 'data/unknown', cause?: unknown) {
		super(message);
		this.name = 'DataServiceError';
		this.code = code;
		this.cause = cause;
	}
}

export const createDataServiceError = (
	message: string,
	code = 'data/unknown',
	cause?: unknown
) => new DataServiceError(message, code, cause);