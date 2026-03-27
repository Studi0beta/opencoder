import type { PersistedThemeState } from '$lib/theme';

async function requestThemeState(
	method: 'GET' | 'PUT',
	state?: PersistedThemeState
): Promise<unknown> {
	const response = await window.fetch('/api/theme', {
		method,
		headers: method === 'PUT' ? { 'content-type': 'application/json' } : undefined,
		body: method === 'PUT' && state ? JSON.stringify(state) : undefined
	});

	if (!response.ok) {
		throw new Error(`Theme request failed (${response.status}).`);
	}

	return response.json();
}

export async function saveThemeState(state: PersistedThemeState): Promise<void> {
	await requestThemeState('PUT', state);
}
