<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import StatusDot from '$lib/components/StatusDot.svelte';
	import OpenCodeWebSetupGuide from '$lib/components/help/OpenCodeWebSetupGuide.svelte';
	import ThemeEditor from '$lib/components/ThemeEditor.svelte';
	import ThemedSurface from '$lib/components/ui/ThemedSurface.svelte';
	import { buildAppExport, parseAppImport } from '$lib/client/server-transfer';
	import {
		DEFAULT_THEME_PRESETS,
		buildThemeVariables,
		type SavedThemePalette,
		type ThemePalette
	} from '$lib/theme';
	import {
		addServer,
		initializeServerRegistry,
		registryState,
		replaceRegistryState,
		removeServer,
		selectServer,
		updateServer
	} from '$lib/client/server-registry';
	import { saveThemeState } from '$lib/client/theme-repository';
	import type { OpencodeServer, PersistedState, ServerHealth, ServerInput } from '$lib/types';
	import type { PageData } from './$types';

	const POLL_INTERVAL_MS = 45000;
	const REFRESH_DEBOUNCE_MS = 600;

	let { data }: { data: PageData } = $props();

	let formOpen = $state(false);
	let formError = $state('');
	let editingServer = $state<OpencodeServer | null>(null);
	let formName = $state('');
	let formBaseUrl = $state('');
	let formDescription = $state('');
	let formHealthcheckUrl = $state('');
	let deletingServerId = $state<string | null>(null);
	let setupGuideOpen = $state(false);
	let topBarHidden = $state(false);
	let healthByServerId = $state<Record<string, ServerHealth | undefined>>({});
	let isRefreshing = $state(false);
	let lastRefreshAt = $state(0);
	let registry = $state<PersistedState>({ servers: [], selectedServerId: null });
	let transferNotice = $state('');
	let importInput = $state<HTMLInputElement | null>(null);
	let activeThemePresetId = $state<string | null>(DEFAULT_THEME_PRESETS[0]?.id ?? null);
	let activePalette = $state<ThemePalette>(
		DEFAULT_THEME_PRESETS[0]?.palette ?? {
			background: '#0b1020',
			text: '#e5ecff',
			brand: '#22c55e'
		}
	);
	let savedPalettes = $state<SavedThemePalette[]>([]);

	const servers = $derived(registry.servers);
	const selectedServerId = $derived(registry.selectedServerId);
	const selectedServer = $derived(
		registry.servers.find((server) => server.id === registry.selectedServerId) ?? null
	);
	const selectedHealth = $derived(selectedServer ? healthByServerId[selectedServer.id] : undefined);
	const insecureEmbedTarget = $derived.by(() => {
		if (!selectedServer) {
			return false;
		}

		try {
			const target = new URL(selectedServer.baseUrl);
			return target.protocol === 'http:';
		} catch {
			return false;
		}
	});
	const selectedEmbedMode = $derived(
		insecureEmbedTarget ? 'proxy' : (selectedHealth?.recommendedMode ?? 'direct')
	);
	const selfEmbeddingBlocked = $derived.by(() => {
		if (!browser || !selectedServer) {
			return false;
		}

		try {
			const target = new URL(selectedServer.baseUrl, window.location.origin);
			return target.origin === window.location.origin;
		} catch {
			return false;
		}
	});
	const selectedEmbedUrl = $derived.by(() => {
		if (!selectedServer) {
			return null;
		}

		if (selfEmbeddingBlocked) {
			return null;
		}

		if (selectedEmbedMode === 'proxy') {
			return `/api/proxy/${selectedServer.id}/`;
		}

		return selectedServer.baseUrl;
	});

	let intervalId = 0;

	onMount(() => {
		topBarHidden = localStorage.getItem('opencoder.topbar.hidden') === 'true';
		registry = data.appState.registry;
		activeThemePresetId = data.appState.theme.activeThemePresetId;
		activePalette = data.appState.theme.activePalette;
		savedPalettes = data.appState.theme.savedPalettes;
		applyTheme(activePalette);
		void initializeServerRegistry(data.appState.registry);

		const unsubscribe = registryState.subscribe((nextState) => {
			registry = nextState;
		});
		void refreshHealth(true);

		intervalId = window.setInterval(() => {
			void refreshHealth(false);
		}, POLL_INTERVAL_MS);

		return () => {
			unsubscribe();
			window.clearInterval(intervalId);
		};
	});

	async function refreshHealth(force: boolean): Promise<void> {
		if (isRefreshing) {
			return;
		}

		const now = Date.now();
		if (!force && now - lastRefreshAt < REFRESH_DEBOUNCE_MS) {
			return;
		}

		if (servers.length === 0) {
			lastRefreshAt = now;
			return;
		}

		isRefreshing = true;
		try {
			const checks = await Promise.all(
				servers.map(async (server) => {
					const response = await window.fetch(`/api/health/${server.id}`);
					if (!response.ok) {
						return {
							id: server.id,
							health: {
								state: 'offline',
								message: `Health check failed (${response.status}).`,
								lastCheckedAt: new Date().toISOString(),
								directEmbeddable: false,
								recommendedMode: 'proxy'
							} satisfies ServerHealth
						};
					}

					const payload = (await response.json()) as ServerHealth;
					return { id: server.id, health: payload };
				})
			);

			healthByServerId = Object.fromEntries(checks.map((item) => [item.id, item.health]));
		} catch {
			healthByServerId = Object.fromEntries(
				servers.map((server) => [
					server.id,
					{
						state: 'offline',
						message: 'Health polling failed.',
						lastCheckedAt: new Date().toISOString(),
						directEmbeddable: false,
						recommendedMode: 'proxy'
					} satisfies ServerHealth
				])
			);
		} finally {
			lastRefreshAt = now;
			isRefreshing = false;
		}
	}

	function openAddServer(): void {
		editingServer = null;
		formError = '';
		formName = '';
		formBaseUrl = '';
		formDescription = '';
		formHealthcheckUrl = '';
		formOpen = true;
	}

	function openEditServer(id: string): void {
		const server = servers.find((item) => item.id === id);
		if (!server) {
			return;
		}

		editingServer = server;
		formError = '';
		formName = server.name;
		formBaseUrl = server.baseUrl;
		formDescription = server.description ?? '';
		formHealthcheckUrl = server.healthcheckUrl ?? '';
		formOpen = true;
	}

	function closeForm(): void {
		formOpen = false;
		formError = '';
		editingServer = null;
	}

	function saveServer(input: ServerInput, editingId: string | null): void {
		try {
			if (editingId) {
				updateServer(editingId, input);
			} else {
				addServer(input);
			}

			closeForm();
			void refreshHealth(true);
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Could not save server.';
		}
	}

	function confirmDeleteServer(id: string): void {
		deletingServerId = id;
	}

	function deleteServerConfirmed(): void {
		if (!deletingServerId) {
			return;
		}

		removeServer(deletingServerId);
		deletingServerId = null;
		void refreshHealth(true);
	}

	function cancelDelete(): void {
		deletingServerId = null;
	}

	function triggerImport(): void {
		importInput?.click();
	}

	async function onImportFile(event: Event): Promise<void> {
		const target = event.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		target.value = '';

		if (!file) {
			return;
		}

		try {
			const text = await file.text();
			const imported = parseAppImport(text);
			replaceRegistryState(imported.registry);
			registry = imported.registry;
			activeThemePresetId = imported.theme.activeThemePresetId;
			activePalette = imported.theme.activePalette;
			savedPalettes = imported.theme.savedPalettes;
			applyTheme(activePalette);
			void saveThemeState(imported.theme).catch(() => {
				// The current browser stays updated; the next successful save will retry.
			});
			transferNotice = `Imported full app state with ${imported.registry.servers.length} server(s).`;
			void refreshHealth(true);
		} catch (error) {
			transferNotice = error instanceof Error ? error.message : 'Import failed.';
		}
	}

	function exportServers(): void {
		const content = buildAppExport({
			registry,
			theme: {
				activeThemePresetId,
				activePalette,
				savedPalettes
			}
		});
		const blob = new Blob([content], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `opencode-hub-state-${new Date().toISOString().slice(0, 10)}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
		transferNotice = `Exported full app state with ${servers.length} server(s).`;
	}

	function lastCheckedValue(id: string): string {
		const checked = healthByServerId[id]?.lastCheckedAt;
		return checked ? new Date(checked).toLocaleTimeString() : 'Never';
	}

	function selectedServerBaseUrl(id: string): string {
		return servers.find((item) => item.id === id)?.baseUrl ?? '';
	}

	function selectedServerName(id: string): string {
		return servers.find((item) => item.id === id)?.name ?? '';
	}

	function setTopBarHidden(hidden: boolean): void {
		topBarHidden = hidden;
		if (browser) {
			localStorage.setItem('opencoder.topbar.hidden', String(hidden));
		}
	}

	function submitServerForm(event: SubmitEvent): void {
		event.preventDefault();
		saveServer(
			{
				name: formName,
				baseUrl: formBaseUrl,
				description: formDescription,
				healthcheckUrl: formHealthcheckUrl
			},
			editingServer?.id ?? null
		);
	}

	function persistTheme(): void {
		void saveThemeState({
			activeThemePresetId,
			activePalette,
			savedPalettes
		}).catch(() => {
			// The current browser stays updated; the next successful save will retry.
		});
	}

	function applyTheme(palette: ThemePalette): void {
		if (!browser) {
			return;
		}

		const vars = buildThemeVariables(palette);
		for (const [key, value] of Object.entries(vars)) {
			document.documentElement.style.setProperty(key, value);
		}
	}

	function handleApplyThemePreset(id: string): void {
		const preset = DEFAULT_THEME_PRESETS.find((item) => item.id === id);
		if (!preset) {
			return;
		}

		activeThemePresetId = id;
		activePalette = preset.palette;
		applyTheme(activePalette);
		persistTheme();
	}

	function handlePreviewThemePalette(palette: ThemePalette): void {
		activeThemePresetId = null;
		activePalette = palette;
		applyTheme(activePalette);
		persistTheme();
	}

	function handleSaveThemePalette(name: string, palette: ThemePalette): void {
		const cleanName = name.trim() || `Scheme ${savedPalettes.length + 1}`;
		savedPalettes = [
			{
				id: crypto.randomUUID(),
				name: cleanName,
				createdAt: new Date().toISOString(),
				...palette
			},
			...savedPalettes
		].slice(0, 20);

		activeThemePresetId = null;
		activePalette = palette;
		applyTheme(activePalette);
		persistTheme();
	}

	function handleApplySavedThemePalette(id: string): void {
		const saved = savedPalettes.find((item) => item.id === id);
		if (!saved) {
			return;
		}

		activeThemePresetId = null;
		activePalette = {
			background: saved.background,
			text: saved.text,
			brand: saved.brand
		};
		applyTheme(activePalette);
		persistTheme();
	}

	function handleDeleteSavedThemePalette(id: string): void {
		savedPalettes = savedPalettes.filter((item) => item.id !== id);
		persistTheme();
	}

	function handleResetTheme(): void {
		const fallback = DEFAULT_THEME_PRESETS[0];
		if (!fallback) {
			return;
		}

		activeThemePresetId = fallback.id;
		activePalette = fallback.palette;
		applyTheme(activePalette);
		persistTheme();
	}

	function isRemoteBaseUrl(value: string): boolean {
		const trimmed = value.trim();
		if (!trimmed) {
			return false;
		}

		try {
			const parsed = new URL(trimmed);
			if (!['http:', 'https:'].includes(parsed.protocol)) {
				return false;
			}
			return !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname.toLowerCase());
		} catch {
			return false;
		}
	}
</script>

{#if topBarHidden}
	<button
		type="button"
		onclick={() => setTopBarHidden(false)}
		class="fixed top-4 left-4 z-30 rounded-full border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur"
		style="border-color: var(--hub-border); background: color-mix(in srgb, var(--hub-surface) 92%, transparent); color: var(--hub-text);"
	>
		Show bar
	</button>
{/if}

<header
	class={`fixed inset-x-0 top-0 z-20 transition-transform duration-300 ${topBarHidden ? '-translate-y-[110%]' : 'translate-y-0'}`}
>
	<div class="mx-auto max-w-[1200px] px-3 pt-3 md:px-5 md:pt-4">
		<div
			class="overflow-hidden rounded-[1.75rem] border shadow-2xl backdrop-blur"
			style="border-color: color-mix(in srgb, var(--hub-border) 72%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--hub-surface) 94%, transparent), color-mix(in srgb, var(--hub-surface-2) 88%, transparent));"
		>
			<div class="flex flex-col gap-4 p-4 md:p-5">
				<div class="flex items-start justify-between gap-3">
					<a
						class="flex min-w-0 items-center gap-3 rounded-2xl focus:ring-2 focus:outline-none"
						href="https://github.com/Studi0beta/opencoder"
						rel="noreferrer noopener"
						target="_blank"
					>
						<img src="/logo.svg" alt="" class="h-11 w-11 rounded-2xl object-contain" />
						<div class="min-w-0">
							<div class="text-[11px] tracking-[0.32em] uppercase" style="color: var(--hub-muted);">
								Stack Focus
							</div>
							<h1 class="text-lg font-semibold md:text-xl" style="color: var(--hub-text);">
								Opencoder
							</h1>
							<p class="truncate text-xs md:text-sm" style="color: var(--hub-muted);">
								One place to keep every OpenCode server in sight.
							</p>
						</div>
					</a>

					<button
						type="button"
						onclick={() => setTopBarHidden(true)}
						class="rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[0.2em] uppercase"
						style="border-color: var(--hub-border); color: var(--hub-muted); background: color-mix(in srgb, var(--hub-surface) 85%, transparent);"
					>
						Hide
					</button>
				</div>

				<div class="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_auto] md:items-end">
					<div class="space-y-2">
						<p
							class="block text-[11px] tracking-[0.28em] uppercase"
							style="color: var(--hub-muted);"
						>
							Selected server
						</p>
						<div
							class="flex items-center gap-2 rounded-2xl border px-3 py-3"
							style="border-color: var(--hub-border); background: color-mix(in srgb, var(--hub-bg) 22%, var(--hub-surface));"
						>
							{#if selectedServer}
								<StatusDot state={selectedHealth?.state ?? 'unknown'} />
							{/if}
							<select
								class="w-full min-w-0 bg-transparent text-sm font-medium outline-none md:text-base"
								style="color: var(--hub-text);"
								disabled={servers.length === 0}
								value={selectedServerId ?? ''}
								onchange={(event) => selectServer((event.currentTarget as HTMLSelectElement).value)}
							>
								{#if servers.length === 0}
									<option value="">No servers yet</option>
								{:else}
									{#each servers as server (server.id)}
										<option value={server.id}>{server.name}</option>
									{/each}
								{/if}
							</select>
						</div>
						{#if selectedServerId}
							<div
								class="space-y-1 rounded-2xl border px-3 py-2 text-xs"
								style="border-color: var(--hub-border); background: color-mix(in srgb, var(--hub-surface) 72%, transparent); color: var(--hub-muted);"
							>
								<div class="truncate">
									<span class="font-semibold" style="color: var(--hub-text);"
										>{selectedServerName(selectedServerId)}</span
									>
									<span class="px-1">·</span>
									<span class="font-mono">{selectedServerBaseUrl(selectedServerId)}</span>
								</div>
								<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
									<span>Checked {lastCheckedValue(selectedServerId)}</span>
									<button
										type="button"
										class="font-medium"
										style="color: var(--hub-text);"
										onclick={() => openEditServer(selectedServerId)}>Edit</button
									>
									<button
										type="button"
										class="font-medium text-rose-300"
										onclick={() => confirmDeleteServer(selectedServerId)}>Delete</button
									>
								</div>
							</div>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
						<ThemeEditor
							presets={DEFAULT_THEME_PRESETS}
							activePresetId={activeThemePresetId}
							{activePalette}
							{savedPalettes}
							onApplyPreset={handleApplyThemePreset}
							onPreviewPalette={handlePreviewThemePalette}
							onSavePalette={handleSaveThemePalette}
							onApplySavedPalette={handleApplySavedThemePalette}
							onDeleteSavedPalette={handleDeleteSavedThemePalette}
							onReset={handleResetTheme}
						/>
						<button
							type="button"
							onclick={() => (setupGuideOpen = true)}
							class="rounded-2xl border px-3 py-2 text-xs font-medium"
							style="border-color: var(--hub-border); color: var(--hub-text); background: color-mix(in srgb, var(--hub-surface) 80%, transparent);"
							>Help</button
						>
						<button
							type="button"
							onclick={triggerImport}
							class="rounded-2xl border px-3 py-2 text-xs font-medium"
							style="border-color: var(--hub-border); color: var(--hub-text); background: color-mix(in srgb, var(--hub-surface) 80%, transparent);"
							>Import</button
						>
						<button
							type="button"
							onclick={exportServers}
							class="rounded-2xl border px-3 py-2 text-xs font-medium"
							style="border-color: var(--hub-border); color: var(--hub-text); background: color-mix(in srgb, var(--hub-surface) 80%, transparent);"
							>Export</button
						>
						<button
							type="button"
							onclick={() => void refreshHealth(true)}
							class="rounded-2xl border px-3 py-2 text-xs font-medium"
							style="border-color: var(--hub-border); color: var(--hub-text); background: color-mix(in srgb, var(--hub-surface) 80%, transparent);"
							>Refresh</button
						>
						<button
							type="button"
							onclick={openAddServer}
							class="col-span-2 rounded-2xl px-4 py-2 text-xs font-semibold md:col-span-1"
							style="background: var(--hub-brand); color: var(--hub-bg);">Add server</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</header>

<input
	bind:this={importInput}
	type="file"
	accept="application/json"
	class="hidden"
	onchange={onImportFile}
/>

<main
	class={`transition-[padding] duration-300 ${topBarHidden ? 'pt-6 md:pt-8' : 'pt-64 md:pt-52'}`}
>
	<div
		class={`mx-auto min-h-0 max-w-[1200px] px-3 md:px-5 ${
			topBarHidden
				? 'h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2rem)]'
				: 'h-[calc(100dvh-16rem)] md:h-[calc(100dvh-13rem)]'
		}`}
	>
		{#if !selectedServer}
			<section
				class="flex h-full min-h-0 items-center justify-center rounded-xl border border-dashed p-10 text-center"
				style="border-color: var(--hub-border); background: color-mix(in srgb, var(--hub-surface) 84%, transparent);"
			>
				<div class="max-w-lg space-y-3">
					<h2 class="text-2xl font-semibold" style="color: var(--hub-text);">
						Add your first opencode server
					</h2>
					<p class="text-sm" style="color: var(--hub-muted);">
						Save one or more server endpoints in the top bar, then switch instantly between them.
					</p>
					<button
						type="button"
						onmousedown={openAddServer}
						onclick={openAddServer}
						class="rounded-lg px-5 py-2 text-sm font-medium transition hover:opacity-90"
						style="background: var(--hub-brand); color: var(--hub-bg);"
					>
						Add server
					</button>
				</div>
			</section>
		{:else}
			<section
				class="flex h-full min-h-0 w-full flex-col overflow-hidden border"
				style="border-color: var(--hub-border); background: color-mix(in srgb, var(--hub-surface) 96%, white);"
			>
				{#if transferNotice}
					<div
						class="border-b px-4 py-2 text-xs"
						style="border-color: var(--hub-border); background: var(--hub-surface-2); color: var(--hub-muted);"
					>
						{transferNotice}
					</div>
				{/if}
				<div
					class="flex items-center justify-between border-b px-4 py-2 text-xs"
					style="border-color: var(--hub-border); color: var(--hub-muted);"
				>
					<div class="truncate pr-2">
						{#if selectedHealth}
							<span class="font-medium" style="color: var(--hub-text);">{selectedHealth.state}</span
							>
							- {selectedHealth.message}
						{:else}
							Pending first health check...
						{/if}
					</div>
					<div class="min-w-fit">
						mode: <span class="font-medium" style="color: var(--hub-text);"
							>{selectedEmbedMode}</span
						>
					</div>
				</div>
				{#if selectedEmbedMode === 'proxy'}
					<div class="border-b border-slate-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
						Realtime WebSocket features may require opening the server directly in a new tab.
					</div>
				{/if}

				{#if selfEmbeddingBlocked}
					<div class="flex flex-1 items-center justify-center p-8 text-center">
						<div
							class="max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
						>
							This server points to the current Opencoder origin. Self-embedding is blocked to avoid
							nested recursive UIs.
						</div>
					</div>
				{:else if selectedEmbedUrl}
					<iframe
						title={`Embedded ${selectedServer.name}`}
						src={selectedEmbedUrl}
						class="h-full min-h-0 w-full flex-1"
						style="background: var(--hub-bg); border-top: 1px solid var(--hub-border); border-bottom: 1px solid var(--hub-border);"
						referrerpolicy="no-referrer"
						sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-downloads"
					></iframe>
				{/if}

				<div
					class="flex items-center justify-between border-t px-4 py-2 text-xs"
					style="border-color: var(--hub-border); color: var(--hub-muted);"
				>
					<span>If embedding fails, open the remote UI directly.</span>
					<a
						href={selectedServer.baseUrl}
						target="_blank"
						rel="external noreferrer noopener"
						class="font-medium hover:opacity-90"
						style="color: var(--hub-text);"
					>
						Open in new tab
					</a>
				</div>
			</section>
		{/if}
	</div>
</main>

<ThemedSurface
	open={formOpen}
	title={editingServer ? 'Edit server' : 'Add opencode server'}
	eyebrow="Server details"
	description="Server URLs are normalized and validated before save."
	onClose={closeForm}
>
	<div
		class="mb-4 flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
		style="border-color: var(--hub-border); background: var(--hub-surface);"
	>
		<p class="text-xs" style="color: var(--hub-muted);">
			Need help setting up OpenCode Web on your server? View OpenCode Web setup instructions.
		</p>
		<button
			type="button"
			onclick={() => {
				setupGuideOpen = true;
			}}
			class="rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-90"
			style="background: var(--hub-brand); color: var(--hub-bg);"
		>
			View OpenCode Web setup instructions
		</button>
	</div>

	<form class="space-y-4" onsubmit={submitServerForm}>
		<div class="grid gap-4 md:grid-cols-2">
			<label class="space-y-1 text-sm" style="color: var(--hub-muted);">
				<span class="font-medium" style="color: var(--hub-text);">Name</span>
				<input
					required
					maxlength="80"
					bind:value={formName}
					class="w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition outline-none focus:ring-2"
					style="border-color: var(--hub-border); background: var(--hub-surface); color: var(--hub-text);"
					placeholder="Primary"
				/>
			</label>
			<label class="space-y-1 text-sm" style="color: var(--hub-muted);">
				<span class="font-medium" style="color: var(--hub-text);">Base URL</span>
				<input
					required
					bind:value={formBaseUrl}
					class="w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition outline-none focus:ring-2"
					style="border-color: var(--hub-border); background: var(--hub-surface); color: var(--hub-text);"
					placeholder="https://opencode.example.com"
				/>
				{#if isRemoteBaseUrl(formBaseUrl)}
					<p class="text-xs" style="color: var(--hub-muted);">
						Before adding a remote server, make sure OpenCode Web is running and protected with a
						password.
					</p>
				{/if}
			</label>
		</div>

		<label class="block space-y-1 text-sm" style="color: var(--hub-muted);">
			<span class="font-medium" style="color: var(--hub-text);">Healthcheck URL (optional)</span>
			<input
				bind:value={formHealthcheckUrl}
				class="w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition outline-none focus:ring-2"
				style="border-color: var(--hub-border); background: var(--hub-surface); color: var(--hub-text);"
				placeholder="https://opencode.example.com/health"
			/>
		</label>

		<label class="block space-y-1 text-sm" style="color: var(--hub-muted);">
			<span class="font-medium" style="color: var(--hub-text);">Description (optional)</span>
			<textarea
				rows="3"
				maxlength="240"
				bind:value={formDescription}
				class="w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition outline-none focus:ring-2"
				style="border-color: var(--hub-border); background: var(--hub-surface); color: var(--hub-text);"
				placeholder="Team cluster"
			></textarea>
		</label>

		{#if formError}
			<p class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
				{formError}
			</p>
		{/if}

		<div
			class="flex items-center justify-end gap-2 border-t pt-4"
			style="border-color: var(--hub-border);"
		>
			<button
				type="button"
				onclick={closeForm}
				class="rounded-lg border px-4 py-2 text-sm transition hover:opacity-90 focus:ring-2 focus:outline-none"
				style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface);"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 focus:ring-2 focus:outline-none"
				style="background: var(--hub-brand); color: var(--hub-bg);"
			>
				{editingServer ? 'Save changes' : 'Add server'}
			</button>
		</div>
	</form>
</ThemedSurface>

<OpenCodeWebSetupGuide
	open={setupGuideOpen}
	onClose={() => {
		setupGuideOpen = false;
	}}
/>

<ThemedSurface
	open={!!deletingServerId}
	title="Delete server?"
	eyebrow="Danger zone"
	description="This removes the server from your local list and clears proxy access for it."
	onClose={cancelDelete}
>
	<div class="flex justify-end gap-2">
		<button
			type="button"
			onclick={cancelDelete}
			class="rounded-lg border px-4 py-2 text-sm transition hover:opacity-90"
			style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface);"
		>
			Cancel
		</button>
		<button
			type="button"
			onclick={deleteServerConfirmed}
			class="rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90"
			style="background: #dc2626; color: white;"
		>
			Delete
		</button>
	</div>
</ThemedSurface>
