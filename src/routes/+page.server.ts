import { loadAppState } from '$lib/server/app-state-store';

export const load = async () => {
	return {
		appState: await loadAppState()
	};
};
