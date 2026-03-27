export interface ThemePalette {
	background: string;
	text: string;
	brand: string;
}

export interface ThemePreset {
	id: string;
	label: string;
	palette: ThemePalette;
}

export interface SavedThemePalette extends ThemePalette {
	id: string;
	name: string;
	createdAt: string;
}

export interface AppliedThemeVariables {
	'--hub-bg': string;
	'--hub-text': string;
	'--hub-muted': string;
	'--hub-brand': string;
	'--hub-surface': string;
	'--hub-surface-2': string;
	'--hub-border': string;
	'--hub-bg-rgb': string;
	'--hub-brand-rgb': string;
}

export const THEME_STORAGE_KEY = 'opencode-hub.theme.v1';

export const DEFAULT_THEME_PRESETS: ThemePreset[] = [
	{
		id: 'night-operator',
		label: 'Night Operator',
		palette: {
			background: '#0b1020',
			text: '#e5ecff',
			brand: '#22c55e'
		}
	},
	{
		id: 'graph-paper',
		label: 'Graph Paper',
		palette: {
			background: '#edf2f7',
			text: '#0b1220',
			brand: '#1d4ed8'
		}
	},
	{
		id: 'sandstone',
		label: 'Sandstone',
		palette: {
			background: '#f5f1e8',
			text: '#1f2937',
			brand: '#b45309'
		}
	},
	{
		id: 'nordic-frost',
		label: 'Nordic Frost',
		palette: {
			background: '#e8edf3',
			text: '#1f2937',
			brand: '#0f766e'
		}
	},
	{
		id: 'graphite-glow',
		label: 'Graphite Glow',
		palette: {
			background: '#101827',
			text: '#e2e8f0',
			brand: '#38bdf8'
		}
	}
];

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function toHex(value: number): string {
	return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
}

function normalizeHex(input: string): string {
	const value = input.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(value)) {
		return value.toLowerCase();
	}
	if (/^#[0-9a-fA-F]{3}$/.test(value)) {
		const [r, g, b] = value.slice(1).split('');
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}
	throw new Error('Color must be a valid hex value like #2563eb.');
}

function hexToRgb(hex: string): [number, number, number] {
	const value = normalizeHex(hex).slice(1);
	return [
		parseInt(value.slice(0, 2), 16),
		parseInt(value.slice(2, 4), 16),
		parseInt(value.slice(4, 6), 16)
	];
}

function rgbToHex(rgb: [number, number, number]): string {
	return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

function mix(
	first: [number, number, number],
	second: [number, number, number],
	ratio: number
): [number, number, number] {
	const weight = clamp(ratio, 0, 1);
	return [
		first[0] * (1 - weight) + second[0] * weight,
		first[1] * (1 - weight) + second[1] * weight,
		first[2] * (1 - weight) + second[2] * weight
	];
}

function toTriplet(rgb: [number, number, number]): string {
	return `${Math.round(rgb[0])} ${Math.round(rgb[1])} ${Math.round(rgb[2])}`;
}

export function normalizePalette(input: ThemePalette): ThemePalette {
	return {
		background: normalizeHex(input.background),
		text: normalizeHex(input.text),
		brand: normalizeHex(input.brand)
	};
}

export function buildThemeVariables(paletteInput: ThemePalette): AppliedThemeVariables {
	const palette = normalizePalette(paletteInput);
	const bg = hexToRgb(palette.background);
	const text = hexToRgb(palette.text);
	const brand = hexToRgb(palette.brand);

	const surface = mix(bg, text, 0.06);
	const elevated = mix(bg, text, 0.1);
	const border = mix(bg, text, 0.18);
	const muted = mix(bg, text, 0.42);

	return {
		'--hub-bg': palette.background,
		'--hub-text': palette.text,
		'--hub-brand': palette.brand,
		'--hub-surface': rgbToHex(surface),
		'--hub-surface-2': rgbToHex(elevated),
		'--hub-border': rgbToHex(border),
		'--hub-muted': rgbToHex(muted),
		'--hub-bg-rgb': toTriplet(bg),
		'--hub-brand-rgb': toTriplet(brand)
	};
}
