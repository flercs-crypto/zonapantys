import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		csp: {
			directives: {
				'default-src': ['self'],
				'script-src': [
					'self',
					'unsafe-hashes',
					'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I=',
					'https://js.stripe.com',
					'https://apis.google.com',
					'https://accounts.google.com'
				],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': [
					'self',
					'data:',
					'blob:',
					'https://*.supabase.co',
					'https://images.unsplash.com',
					'https://*.googleusercontent.com',
					'https://*.stripe.com'
				],
				'font-src': ['self'],
				'connect-src': [
					'self',
					'https://*.supabase.co',
					'https://*.googleapis.com',
					'https://securetoken.googleapis.com',
					'https://identitytoolkit.googleapis.com',
					'https://accounts.google.com',
					'https://www.googleapis.com',
					'https://api.stripe.com'
				],
				'frame-src': [
					'https://js.stripe.com',
					'https://*.firebaseapp.com',
					'https://accounts.google.com'
				],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none']
			}
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
