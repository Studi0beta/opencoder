import { json, type RequestHandler } from '@sveltejs/kit';
import { loadRegistryState } from '$lib/server/app-state-store';
import { detectDirectFramingBlock } from '$lib/server/framing-policy';

const REQUEST_TIMEOUT_MS = 6500;

export const GET: RequestHandler = async ({ params, fetch }) => {
	const id = params.id;
	const target = (await loadRegistryState()).servers.find((item) => item.id === id);
	if (!target) {
		return json({ message: 'Unknown target id.' }, { status: 404 });
	}

	const url = target.healthcheckUrl ?? target.baseUrl;
	const startedAt = performance.now();

	try {
		const response = await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			headers: { accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		});

		const framing = detectDirectFramingBlock(response.headers);
		const latencyMs = Math.round(performance.now() - startedAt);

		const state = response.ok ? 'online' : 'degraded';
		const message = response.ok
			? framing.reason
			: `Health endpoint returned ${response.status} ${response.statusText}`;

		return json({
			state,
			message,
			latencyMs,
			lastCheckedAt: new Date().toISOString(),
			directEmbeddable: !framing.blocked,
			recommendedMode: framing.blocked ? 'proxy' : 'direct'
		});
	} catch (error) {
		const reason = error instanceof Error ? error.message : 'Request failed';
		return json({
			state: 'offline',
			message: reason,
			lastCheckedAt: new Date().toISOString(),
			directEmbeddable: false,
			recommendedMode: 'proxy'
		});
	}
};
