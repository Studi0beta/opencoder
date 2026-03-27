import type { PersistedState } from '$lib/types';

const STORAGE_KEY = 'opencode-hub.state.v1';

const EMPTY_STATE: PersistedState = {
	servers: [],
	selectedServerId: null
};

export interface ServerRepository {
	load(): PersistedState;
	save(state: PersistedState): void;
}

export class LocalStorageServerRepository implements ServerRepository {
	load(): PersistedState {
		if (typeof localStorage === 'undefined') {
			return EMPTY_STATE;
		}

		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return EMPTY_STATE;
		}

		try {
			const parsed = JSON.parse(raw);
			if (typeof parsed !== 'object' || parsed === null) {
				return EMPTY_STATE;
			}

			const state = parsed as PersistedState;
			if (!Array.isArray(state.servers)) {
				return EMPTY_STATE;
			}

			return {
				servers: state.servers,
				selectedServerId: typeof state.selectedServerId === 'string' ? state.selectedServerId : null
			};
		} catch {
			return EMPTY_STATE;
		}
	}

	save(state: PersistedState): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}
}
