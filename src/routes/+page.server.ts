import { loadAppState } from '$lib/server/app-state-store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, request }) => {
	const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
	const isHttps = forwardedProto ? forwardedProto === 'https' : url.protocol === 'https:';

	return {
		appState: await loadAppState(),
		isHttps
	};
};
