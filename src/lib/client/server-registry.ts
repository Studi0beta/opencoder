import { writable, derived, get } from 'svelte/store';
import { normalizeServerUrl } from '$lib/shared/url';
import { RemoteServerRepository } from '$lib/client/server-repository';
import type { OpencodeServer, PersistedState, ServerInput, SyncTarget } from '$lib/types';

const repository = new RemoteServerRepository();
const state = writable<PersistedState>({ servers: [], selectedServerId: null });

const syncQueue = {
	timer: 0,
	inFlight: false
};

function nowIso(): string {
	return new Date().toISOString();
}

function ensureUniqueUrl(
	servers: OpencodeServer[],
	normalizedUrl: string,
	excludingId?: string
): void {
	const duplicate = servers.some(
		(server) => server.baseUrl === normalizedUrl && server.id !== excludingId
	);
	if (duplicate) {
		throw new Error('This server URL already exists.');
	}
}

function toServer(input: ServerInput): OpencodeServer {
	const timestamp = nowIso();
	return {
		id: crypto.randomUUID(),
		name: input.name.trim(),
		baseUrl: normalizeServerUrl(input.baseUrl),
		description: input.description?.trim() || undefined,
		healthcheckUrl: input.healthcheckUrl ? normalizeServerUrl(input.healthcheckUrl) : undefined,
		createdAt: timestamp,
		updatedAt: timestamp
	};
}

function toServerInput(input: ServerInput): ServerInput {
	return {
		name: input.name.trim(),
		baseUrl: input.baseUrl,
		description: input.description?.trim() || undefined,
		healthcheckUrl: input.healthcheckUrl?.trim() || undefined
	};
}

function persist(nextState: PersistedState): void {
	state.set(nextState);
	void repository.save(nextState).catch(() => {
		// The UI stays in sync locally and will retry on the next mutation.
	});
	queueSync();
}

function selectedOrFirst(stateValue: PersistedState): string | null {
	if (
		stateValue.selectedServerId &&
		stateValue.servers.some((server) => server.id === stateValue.selectedServerId)
	) {
		return stateValue.selectedServerId;
	}

	return stateValue.servers[0]?.id ?? null;
}

async function syncTargets(targets: SyncTarget[]): Promise<void> {
	await fetch('/api/targets/sync', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ targets })
	});
}

function queueSync(): void {
	if (typeof window === 'undefined') {
		return;
	}

	window.clearTimeout(syncQueue.timer);
	syncQueue.timer = window.setTimeout(async () => {
		if (syncQueue.inFlight) {
			queueSync();
			return;
		}

		syncQueue.inFlight = true;
		try {
			const targets = get(state).servers.map((server) => ({
				id: server.id,
				baseUrl: server.baseUrl,
				healthcheckUrl: server.healthcheckUrl
			}));
			await syncTargets(targets);
		} catch {
			// Silent retry; health/proxy endpoints will report if sync fails.
		} finally {
			syncQueue.inFlight = false;
		}
	}, 250);
}

export async function initializeServerRegistry(initialState?: PersistedState): Promise<void> {
	const loaded = initialState ?? (await repository.load());
	const selectedServerId = selectedOrFirst(loaded);
	state.set({ ...loaded, selectedServerId });
	queueSync();
}

export function replaceRegistryState(nextState: PersistedState): void {
	persist({
		servers: nextState.servers,
		selectedServerId: selectedOrFirst(nextState)
	});
}

export function addServer(input: ServerInput): OpencodeServer {
	const current = get(state);
	const nextServer = toServer(toServerInput(input));
	ensureUniqueUrl(current.servers, nextServer.baseUrl);

	const nextState: PersistedState = {
		servers: [...current.servers, nextServer],
		selectedServerId: current.selectedServerId ?? nextServer.id
	};

	persist(nextState);
	return nextServer;
}

export function updateServer(id: string, input: ServerInput): OpencodeServer {
	const current = get(state);
	const index = current.servers.findIndex((server) => server.id === id);
	if (index === -1) {
		throw new Error('Server not found.');
	}

	const normalizedBaseUrl = normalizeServerUrl(input.baseUrl);
	ensureUniqueUrl(current.servers, normalizedBaseUrl, id);

	const updated: OpencodeServer = {
		...current.servers[index],
		name: input.name.trim(),
		baseUrl: normalizedBaseUrl,
		description: input.description?.trim() || undefined,
		healthcheckUrl: input.healthcheckUrl ? normalizeServerUrl(input.healthcheckUrl) : undefined,
		updatedAt: nowIso()
	};

	const servers = [...current.servers];
	servers[index] = updated;
	persist({
		servers,
		selectedServerId: selectedOrFirst({ servers, selectedServerId: current.selectedServerId })
	});

	return updated;
}

export function removeServer(id: string): void {
	const current = get(state);
	const servers = current.servers.filter((server) => server.id !== id);
	persist({
		servers,
		selectedServerId: selectedOrFirst({
			servers,
			selectedServerId: current.selectedServerId === id ? null : current.selectedServerId
		})
	});
}

export function selectServer(id: string): void {
	const current = get(state);
	if (!current.servers.some((server) => server.id === id)) {
		return;
	}
	persist({ ...current, selectedServerId: id });
}

export function importServers(inputs: ServerInput[]): {
	added: number;
	skipped: number;
	errors: string[];
} {
	const current = get(state);
	const nextServers = [...current.servers];
	const errors: string[] = [];
	let added = 0;

	for (const [index, rawInput] of inputs.entries()) {
		try {
			const input = toServerInput(rawInput);
			if (!input.name) {
				throw new Error('Name is required.');
			}

			const normalizedBaseUrl = normalizeServerUrl(input.baseUrl);
			ensureUniqueUrl(nextServers, normalizedBaseUrl);

			nextServers.push(
				toServer({
					...input,
					baseUrl: normalizedBaseUrl,
					healthcheckUrl: input.healthcheckUrl
						? normalizeServerUrl(input.healthcheckUrl)
						: undefined
				})
			);
			added += 1;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Invalid server entry.';
			errors.push(`Entry ${index + 1}: ${message}`);
		}
	}

	if (added > 0) {
		persist({
			servers: nextServers,
			selectedServerId: selectedOrFirst({
				servers: nextServers,
				selectedServerId: current.selectedServerId
			})
		});
	}

	return { added, skipped: inputs.length - added, errors };
}

export const registryState = { subscribe: state.subscribe };

export const servers = derived(state, ($state) => $state.servers);
export const selectedServerId = derived(state, ($state) => $state.selectedServerId);
export const selectedServer = derived(state, ($state) => {
	return $state.servers.find((server) => server.id === $state.selectedServerId) ?? null;
});
