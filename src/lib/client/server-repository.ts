import type { PersistedState } from '$lib/types';

const EMPTY_STATE: PersistedState = {
	servers: [],
	selectedServerId: null
};

export interface ServerRepository {
	load(): Promise<PersistedState>;
	save(state: PersistedState): Promise<void>;
}

async function requestRegistryState(
	method: 'GET' | 'PUT',
	state?: PersistedState
): Promise<unknown> {
	const response = await window.fetch('/api/registry', {
		method,
		headers: method === 'PUT' ? { 'content-type': 'application/json' } : undefined,
		body: method === 'PUT' && state ? JSON.stringify(state) : undefined
	});

	if (!response.ok) {
		throw new Error(`Registry request failed (${response.status}).`);
	}

	return response.json();
}

export class RemoteServerRepository implements ServerRepository {
	async load(): Promise<PersistedState> {
		try {
			const payload = (await requestRegistryState('GET')) as Partial<PersistedState>;
			if (!payload || !Array.isArray(payload.servers)) {
				return EMPTY_STATE;
			}

			return {
				servers: payload.servers,
				selectedServerId:
					typeof payload.selectedServerId === 'string' ? payload.selectedServerId : null
			};
		} catch {
			return EMPTY_STATE;
		}
	}

	async save(state: PersistedState): Promise<void> {
		await requestRegistryState('PUT', state);
	}
}
