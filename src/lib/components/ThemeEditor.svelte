<script lang="ts">
	import type { SavedThemePalette, ThemePalette, ThemePreset } from '$lib/theme';

	interface Props {
		presets: ThemePreset[];
		activePresetId: string | null;
		activePalette: ThemePalette;
		savedPalettes: SavedThemePalette[];
		onApplyPreset: (id: string) => void;
		onPreviewPalette: (palette: ThemePalette) => void;
		onSavePalette: (name: string, palette: ThemePalette) => void;
		onApplySavedPalette: (id: string) => void;
		onDeleteSavedPalette: (id: string) => void;
		onReset: () => void;
	}

	let {
		presets,
		activePresetId,
		activePalette,
		savedPalettes,
		onApplyPreset,
		onPreviewPalette,
		onSavePalette,
		onApplySavedPalette,
		onDeleteSavedPalette,
		onReset
	}: Props = $props();

	let open = $state(false);
	let draft = $state<ThemePalette>({ background: '#0b1020', text: '#e5ecff', brand: '#22c55e' });
	let schemeName = $state('My scheme');
	let colorPickStatus = $state('');

	$effect(() => {
		draft = activePalette;
	});

	function openPanel(): void {
		draft = activePalette;
		schemeName = `Scheme ${savedPalettes.length + 1}`;
		open = true;
	}

	function suggestComplementaryPalette(baseHex: string): ThemePalette {
		const hex = /^#[0-9a-fA-F]{6}$/.test(baseHex)
			? baseHex
			: /^#[0-9a-fA-F]{3}$/.test(baseHex)
				? `#${baseHex[1]}${baseHex[1]}${baseHex[2]}${baseHex[2]}${baseHex[3]}${baseHex[3]}`
				: activePalette.background;

		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);

		const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		const text = luminance > 140 ? '#0f172a' : '#e2e8f0';
		const brand = `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`;

		return {
			background: hex,
			text,
			brand
		};
	}

	async function pickColor(field: keyof ThemePalette): Promise<void> {
		if (typeof window === 'undefined') {
			return;
		}

		const EyeDropperCtor = (
			window as Window & {
				EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
			}
		).EyeDropper;

		if (!EyeDropperCtor) {
			colorPickStatus = 'Color dropper is not supported in this browser.';
			return;
		}

		try {
			colorPickStatus = '';
			const result = await new EyeDropperCtor().open();
			draft = { ...draft, [field]: result.sRGBHex };
		} catch {
			// User cancelled or browser blocked the picker.
		}
	}
</script>

<div class="relative">
	<button
		type="button"
		onclick={() => (open ? (open = false) : openPanel())}
		class="rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition hover:opacity-90 focus:ring-2 focus:outline-none"
		style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface);"
	>
		Theme
	</button>

	{#if open}
		<div
			class="absolute top-11 right-0 z-40 w-[22rem] rounded-xl border p-3 shadow-lg"
			style="border-color: var(--hub-border); background: var(--hub-surface);"
		>
			<p class="text-sm font-semibold" style="color: var(--hub-text);">Themes & colors</p>
			<p class="mt-1 text-xs" style="color: var(--hub-muted);">
				Pick a preset or tune your own palette.
			</p>

			<div class="mt-3">
				<p class="mb-1 text-xs font-medium" style="color: var(--hub-muted);">Preset themes</p>
				<div class="grid grid-cols-2 gap-1.5">
					{#each presets as preset (preset.id)}
						<button
							type="button"
							onclick={() => onApplyPreset(preset.id)}
							class="rounded-md border px-2 py-1.5 text-xs transition"
							style={`border-color: var(--hub-border); color: ${activePresetId === preset.id ? 'var(--hub-brand)' : 'var(--hub-text)'}; background: ${activePresetId === preset.id ? 'var(--hub-surface-2)' : 'transparent'};`}
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="mt-3 space-y-2">
				<label
					class="flex items-center justify-between gap-2 text-xs"
					style="color: var(--hub-muted);"
				>
					<span>Background</span>
					<div class="flex items-center gap-2">
						<input type="color" bind:value={draft.background} class="h-7 w-8 rounded border p-0" />
						<button
							type="button"
							onclick={() => pickColor('background')}
							class="h-7 rounded border px-2 text-[11px]"
							style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface-2);"
							title="Pick a color from the screen"
						>
							Pick
						</button>
						<input
							type="text"
							bind:value={draft.background}
							class="h-7 w-24 rounded border px-2 text-xs"
							style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface-2);"
						/>
					</div>
				</label>
				<label
					class="flex items-center justify-between gap-2 text-xs"
					style="color: var(--hub-muted);"
				>
					<span>Text</span>
					<div class="flex items-center gap-2">
						<input type="color" bind:value={draft.text} class="h-7 w-8 rounded border p-0" />
						<button
							type="button"
							onclick={() => pickColor('text')}
							class="h-7 rounded border px-2 text-[11px]"
							style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface-2);"
							title="Pick a color from the screen"
						>
							Pick
						</button>
						<input
							type="text"
							bind:value={draft.text}
							class="h-7 w-24 rounded border px-2 text-xs"
							style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface-2);"
						/>
					</div>
				</label>
				<label
					class="flex items-center justify-between gap-2 text-xs"
					style="color: var(--hub-muted);"
				>
					<span>Brand</span>
					<div class="flex items-center gap-2">
						<input type="color" bind:value={draft.brand} class="h-7 w-8 rounded border p-0" />
						<button
							type="button"
							onclick={() => pickColor('brand')}
							class="h-7 rounded border px-2 text-[11px]"
							style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface-2);"
							title="Pick a color from the screen"
						>
							Pick
						</button>
						<input
							type="text"
							bind:value={draft.brand}
							class="h-7 w-24 rounded border px-2 text-xs"
							style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface-2);"
						/>
					</div>
				</label>
			</div>

			<div class="mt-3 flex items-center gap-2">
				<input
					type="text"
					bind:value={schemeName}
					placeholder="Scheme name"
					class="h-8 flex-1 rounded border px-2 text-xs"
					style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface-2);"
				/>
			</div>

			<div class="mt-3 flex flex-wrap gap-2">
				<button
					type="button"
					onclick={() => {
						draft = suggestComplementaryPalette(draft.background);
						onPreviewPalette(draft);
					}}
					class="rounded-md border px-2.5 py-1.5 text-xs"
					style="border-color: var(--hub-border); color: var(--hub-text);"
				>
					Auto complement
				</button>
				<button
					type="button"
					onclick={() => {
						onReset();
						open = false;
					}}
					class="rounded-md border px-2.5 py-1.5 text-xs"
					style="border-color: var(--hub-border); color: var(--hub-muted);"
				>
					Reset
				</button>
				<button
					type="button"
					onclick={() => onPreviewPalette(draft)}
					class="ml-auto rounded-md border px-2.5 py-1.5 text-xs"
					style="border-color: var(--hub-border); color: var(--hub-text);"
				>
					Preview
				</button>
				<button
					type="button"
					onclick={() => {
						onSavePalette(schemeName, draft);
						open = false;
					}}
					class="rounded-md px-3 py-1.5 text-xs font-semibold"
					style="background: var(--hub-brand); color: var(--hub-bg);"
				>
					Save
				</button>
			</div>

			{#if colorPickStatus}
				<p class="mt-2 text-xs" style="color: var(--hub-muted);">{colorPickStatus}</p>
			{/if}

			<div class="mt-3 border-t pt-3" style="border-color: var(--hub-border);">
				<p class="mb-1 text-xs font-medium" style="color: var(--hub-muted);">Saved schemes</p>
				{#if savedPalettes.length === 0}
					<p class="text-xs" style="color: var(--hub-muted);">No saved schemes yet.</p>
				{:else}
					<div class="max-h-36 space-y-1 overflow-auto pr-1">
						{#each savedPalettes as item (item.id)}
							<div
								class="flex items-center gap-2 rounded-md border p-1.5"
								style="border-color: var(--hub-border);"
							>
								<button
									type="button"
									onclick={() => {
										onApplySavedPalette(item.id);
										open = false;
									}}
									class="flex-1 truncate rounded px-2 py-1 text-left text-xs"
									style="color: var(--hub-text);"
								>
									{item.name}
								</button>
								<button
									type="button"
									onclick={() => onDeleteSavedPalette(item.id)}
									class="rounded px-2 py-1 text-xs"
									style="color: #be123c;"
								>
									Delete
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
