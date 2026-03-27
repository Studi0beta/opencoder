import { normalizeServerUrl } from '$lib/shared/url';
import {
	defaultThemeState,
	normalizePalette,
	type SavedThemePalette,
	type ThemePalette
} from '$lib/theme';
import type { OpencodeServer, PersistedAppState, PersistedState, ServerInput } from '$lib/types';

interface ExportEnvelope {
	version: number;
	exportedAt: string;
	appState: PersistedAppState;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function parseServerInput(value: unknown, index: number): ServerInput {
	if (!isObject(value)) {
		throw new Error(`Entry ${index + 1} must be an object.`);
	}

	const name = String(value.name ?? '').trim();
	const baseUrl = String(value.baseUrl ?? '').trim();

	if (!name) {
		throw new Error(`Entry ${index + 1} is missing name.`);
	}

	if (!baseUrl) {
		throw new Error(`Entry ${index + 1} is missing baseUrl.`);
	}

	return {
		name,
		baseUrl,
		description: value.description ? String(value.description) : undefined,
		healthcheckUrl: value.healthcheckUrl ? String(value.healthcheckUrl) : undefined
	};
}

function parseImportedServer(value: unknown, index: number): OpencodeServer {
	if (!isObject(value)) {
		throw new Error(`Server ${index + 1} must be an object.`);
	}

	const id = String(value.id ?? '').trim();
	const name = String(value.name ?? '').trim();
	const baseUrl = String(value.baseUrl ?? '').trim();
	const createdAt = String(value.createdAt ?? '').trim();
	const updatedAt = String(value.updatedAt ?? '').trim() || createdAt;

	if (!name) {
		throw new Error(`Server ${index + 1} is missing name.`);
	}

	if (!baseUrl) {
		throw new Error(`Server ${index + 1} is missing baseUrl.`);
	}

	return {
		id: id || crypto.randomUUID(),
		name,
		baseUrl: normalizeServerUrl(baseUrl),
		description: value.description ? String(value.description) : undefined,
		healthcheckUrl: value.healthcheckUrl
			? normalizeServerUrl(String(value.healthcheckUrl))
			: undefined,
		createdAt: createdAt || new Date().toISOString(),
		updatedAt: updatedAt || createdAt || new Date().toISOString()
	};
}

function parseThemePalette(value: unknown): ThemePalette {
	if (!isObject(value)) {
		return defaultThemeState().activePalette;
	}

	return normalizePalette({
		background: String(value.background ?? defaultThemeState().activePalette.background),
		text: String(value.text ?? defaultThemeState().activePalette.text),
		brand: String(value.brand ?? defaultThemeState().activePalette.brand)
	});
}

function parseSavedPalettes(value: unknown): SavedThemePalette[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item) => {
		if (!isObject(item)) {
			return [];
		}

		const id = String(item.id ?? '').trim();
		const name = String(item.name ?? '').trim();
		const createdAt = String(item.createdAt ?? '').trim();
		if (!name) {
			return [];
		}

		return [
			{
				id: id || crypto.randomUUID(),
				name,
				createdAt: createdAt || new Date().toISOString(),
				...parseThemePalette(item)
			}
		];
	});
}

function parseRegistry(value: unknown): PersistedState {
	if (!isObject(value) || !Array.isArray(value.servers)) {
		return { servers: [], selectedServerId: null };
	}

	const servers = value.servers.map((item, index) => parseImportedServer(item, index));
	const selectedServerId =
		typeof value.selectedServerId === 'string' &&
		servers.some((server) => server.id === value.selectedServerId)
			? value.selectedServerId
			: (servers[0]?.id ?? null);

	return { servers, selectedServerId };
}

function parseThemeState(value: unknown) {
	if (!isObject(value)) {
		return defaultThemeState();
	}

	const activeThemePresetId =
		typeof value.activeThemePresetId === 'string' || value.activeThemePresetId === null
			? value.activeThemePresetId
			: defaultThemeState().activeThemePresetId;

	return {
		activeThemePresetId,
		activePalette: parseThemePalette(value.activePalette),
		savedPalettes: parseSavedPalettes(value.savedPalettes)
	};
}

function parseAppState(value: unknown): PersistedAppState {
	if (!isObject(value)) {
		return { registry: { servers: [], selectedServerId: null }, theme: defaultThemeState() };
	}

	return {
		registry: parseRegistry(value.registry ?? value),
		theme: parseThemeState(value.theme ?? value)
	};
}

export function buildAppExport(appState: PersistedAppState): string {
	const payload: ExportEnvelope = {
		version: 2,
		exportedAt: new Date().toISOString(),
		appState
	};

	return JSON.stringify(payload, null, 2);
}

export function buildServerExport(servers: OpencodeServer[]): string {
	return buildAppExport({
		registry: {
			servers,
			selectedServerId: servers[0]?.id ?? null
		},
		theme: defaultThemeState()
	});
}

export function parseAppImport(raw: string): PersistedAppState {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error('Import file is not valid JSON.');
	}

	if (Array.isArray(parsed)) {
		return {
			registry: {
				servers: parsed.map((item, index) =>
					parseImportedServer(parseServerInput(item, index), index)
				),
				selectedServerId: null
			},
			theme: defaultThemeState()
		};
	}

	if (isObject(parsed) && Array.isArray(parsed.servers)) {
		if (parsed.appState) {
			return parseAppState(parsed.appState);
		}

		return {
			registry: parseRegistry(parsed),
			theme: defaultThemeState()
		};
	}

	if (isObject(parsed) && (parsed.appState || parsed.registry || parsed.theme)) {
		return parseAppState(parsed.appState ?? parsed);
	}

	throw new Error('Import JSON must include appState, registry/theme, or a servers array.');
}

export function parseServerImport(raw: string): ServerInput[] {
	const appState = parseAppImport(raw);
	return appState.registry.servers.map((server) => ({
		name: server.name,
		baseUrl: server.baseUrl,
		description: server.description,
		healthcheckUrl: server.healthcheckUrl
	}));
}
