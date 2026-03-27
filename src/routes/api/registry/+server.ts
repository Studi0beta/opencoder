import { json, type RequestHandler } from '@sveltejs/kit';
import { loadRegistryState, saveRegistryState } from '$lib/server/app-state-store';
import type { PersistedState } from '$lib/types';

function isPersistedState(value: unknown): value is PersistedState {
	return (
		typeof value === 'object' &&
		value !== null &&
		Array.isArray((value as { servers?: unknown }).servers)
	);
}

export const GET: RequestHandler = async () => {
	return json(await loadRegistryState());
};

export const PUT: RequestHandler = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ message: 'Invalid JSON payload.' }, { status: 400 });
	}

	if (!isPersistedState(payload)) {
		return json({ message: 'Payload must be a registry state object.' }, { status: 400 });
	}

	await saveRegistryState(payload);
	return json({ ok: true });
};
