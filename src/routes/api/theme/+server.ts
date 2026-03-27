import { json, type RequestHandler } from '@sveltejs/kit';
import { loadThemeState, saveThemeState } from '$lib/server/app-state-store';
import { normalizePalette, type PersistedThemeState } from '$lib/theme';

function isThemeState(value: unknown): value is PersistedThemeState {
	return (
		typeof value === 'object' &&
		value !== null &&
		((value as { activeThemePresetId?: unknown }).activeThemePresetId === null ||
			typeof (value as { activeThemePresetId?: unknown }).activeThemePresetId === 'string') &&
		typeof (value as { activePalette?: unknown }).activePalette === 'object' &&
		(value as { activePalette?: { background?: unknown; text?: unknown; brand?: unknown } })
			.activePalette !== null &&
		typeof (value as { activePalette?: { background?: unknown } }).activePalette?.background ===
			'string' &&
		typeof (value as { activePalette?: { text?: unknown } }).activePalette?.text === 'string' &&
		typeof (value as { activePalette?: { brand?: unknown } }).activePalette?.brand === 'string' &&
		Array.isArray((value as { savedPalettes?: unknown }).savedPalettes)
	);
}

export const GET: RequestHandler = async () => {
	return json(await loadThemeState());
};

export const PUT: RequestHandler = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ message: 'Invalid JSON payload.' }, { status: 400 });
	}

	if (!isThemeState(payload)) {
		return json({ message: 'Payload must be a theme state object.' }, { status: 400 });
	}

	await saveThemeState({
		activeThemePresetId: payload.activeThemePresetId,
		activePalette: normalizePalette(payload.activePalette),
		savedPalettes: payload.savedPalettes
	});

	return json({ ok: true });
};
