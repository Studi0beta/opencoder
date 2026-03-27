import { json, type RequestHandler } from '@sveltejs/kit';
import { loadRegistryState } from '$lib/server/app-state-store';

export const POST: RequestHandler = async () => {
	const registry = await loadRegistryState();
	return json({ count: registry.servers.length });
};
