import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		filterSerializedResponseHeaders: (name) => {
			const allowed = ['content-type', 'cache-control', 'etag', 'last-modified'];
			return allowed.includes(name.toLowerCase());
		}
	});

	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'no-referrer');
	response.headers.set('x-frame-options', 'SAMEORIGIN');
	response.headers.set('permissions-policy', 'camera=(), geolocation=(), microphone=()');

	return response;
};
