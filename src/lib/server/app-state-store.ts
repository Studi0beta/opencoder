import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizePalette, defaultThemeState, type PersistedThemeState } from '$lib/theme';
import type { PersistedAppState, PersistedState } from '$lib/types';

const STATE_FILE =
	process.env.OPENCODE_HUB_STATE_FILE ?? path.join(process.cwd(), '.opencode-hub', 'state.json');

const DEFAULT_REGISTRY_STATE: PersistedState = {
	servers: [],
	selectedServerId: null
};

const DEFAULT_APP_STATE: PersistedAppState = {
	registry: DEFAULT_REGISTRY_STATE,
	theme: defaultThemeState()
};

let cachedState: PersistedAppState = DEFAULT_APP_STATE;

function normalizeRegistryState(input: PersistedState | undefined): PersistedState {
	if (!input || !Array.isArray(input.servers)) {
		return DEFAULT_REGISTRY_STATE;
	}

	const selectedServerId =
		typeof input.selectedServerId === 'string' &&
		input.servers.some(
			(server) => server && typeof server.id === 'string' && server.id === input.selectedServerId
		)
			? input.selectedServerId
			: (input.servers.find((server) => server && typeof server.id === 'string')?.id ?? null);

	return {
		servers: input.servers,
		selectedServerId
	};
}

function normalizeThemeState(input: PersistedThemeState | undefined): PersistedThemeState {
	if (!input || typeof input !== 'object') {
		return defaultThemeState();
	}

	const palette =
		input.activePalette && typeof input.activePalette === 'object'
			? normalizePalette({
					background: String(input.activePalette.background ?? ''),
					text: String(input.activePalette.text ?? ''),
					brand: String(input.activePalette.brand ?? '')
				})
			: defaultThemeState().activePalette;

	return {
		activeThemePresetId:
			typeof input.activeThemePresetId === 'string' || input.activeThemePresetId === null
				? input.activeThemePresetId
				: null,
		activePalette: palette,
		savedPalettes: Array.isArray(input.savedPalettes) ? input.savedPalettes : []
	};
}

function normalizeAppState(input: Partial<PersistedAppState> | undefined): PersistedAppState {
	return {
		registry: normalizeRegistryState(input?.registry),
		theme: normalizeThemeState(input?.theme)
	};
}

async function ensureStateDir(): Promise<void> {
	await mkdir(path.dirname(STATE_FILE), { recursive: true });
}

export async function loadAppState(): Promise<PersistedAppState> {
	try {
		const raw = await readFile(STATE_FILE, 'utf8');
		cachedState = normalizeAppState(JSON.parse(raw) as Partial<PersistedAppState>);
		return cachedState;
	} catch {
		return cachedState;
	}
}

export async function saveAppState(state: PersistedAppState): Promise<void> {
	cachedState = normalizeAppState(state);
	await ensureStateDir();
	try {
		await writeFile(STATE_FILE, `${JSON.stringify(cachedState, null, 2)}\n`, 'utf8');
	} catch {
		// Fall back to in-memory state if the filesystem is not writable.
	}
}

export async function loadRegistryState(): Promise<PersistedState> {
	const state = await loadAppState();
	return state.registry;
}

export async function loadThemeState(): Promise<PersistedThemeState> {
	const state = await loadAppState();
	return state.theme;
}

export async function saveRegistryState(registry: PersistedState): Promise<void> {
	const state = await loadAppState();
	await saveAppState({
		registry: normalizeRegistryState(registry),
		theme: state.theme
	});
}

export async function saveThemeState(theme: PersistedThemeState): Promise<void> {
	const state = await loadAppState();
	await saveAppState({
		registry: state.registry,
		theme: normalizeThemeState(theme)
	});
}
