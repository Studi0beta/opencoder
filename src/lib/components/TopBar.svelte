<script lang="ts">
	import StatusDot from '$lib/components/StatusDot.svelte';
	import type { OpencodeServer, ServerHealth } from '$lib/types';

	interface Props {
		servers: OpencodeServer[];
		selectedServerId: string | null;
		healthByServerId: Record<string, ServerHealth | undefined>;
		handleAdd: () => void;
		handleSelect: (id: string) => void;
		handleEdit: (id: string) => void;
		handleDelete: (id: string) => void;
		handleRefresh: () => void;
		handleImport: () => void;
		handleExport: () => void;
	}

	let {
		servers,
		selectedServerId,
		healthByServerId,
		handleAdd,
		handleSelect,
		handleEdit,
		handleDelete,
		handleRefresh,
		handleImport,
		handleExport
	}: Props = $props();

	function lastCheckedValue(id: string): string {
		const checked = healthByServerId[id]?.lastCheckedAt;
		return checked ? new Date(checked).toLocaleTimeString() : 'Never';
	}

	function selectedServerBaseUrl(id: string): string {
		return servers.find((item) => item.id === id)?.baseUrl ?? '';
	}
</script>

<header class="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-3 md:px-5">
		<div class="mr-2 min-w-fit">
			<a
				class="flex items-center gap-2 rounded-md focus:ring-2 focus:outline-none"
				href="https://github.com/Studi0beta/opencoder"
				rel="noreferrer noopener"
				target="_blank"
			>
				<img src="/logo.svg" alt="" class="h-10 w-10 rounded-md object-contain" />
				<h1 class="text-sm font-semibold tracking-wide text-slate-900 md:text-base">Opencoder</h1>
			</a>
		</div>

		<div
			class="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]"
			style="scroll-padding-inline: 0.5rem;"
		>
			<div class="flex min-w-max items-center gap-2 py-1 pr-2 pl-2">
				{#if servers.length === 0}
					<span
						class="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500"
						>No servers yet</span
					>
				{:else}
					{#each servers as server (server.id)}
						{@const selected = selectedServerId === server.id}
						<button
							type="button"
							onclick={() => handleSelect(server.id)}
							class={`group inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:outline-none ${
								selected
									? 'border-slate-900 bg-slate-900 text-white shadow-sm'
									: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
							}`}
							aria-pressed={selected}
						>
							<StatusDot state={healthByServerId[server.id]?.state ?? 'unknown'} />
							<span class="max-w-40 truncate font-medium">{server.name}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={handleImport}
				class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
			>
				Import
			</button>
			<button
				type="button"
				onclick={handleExport}
				class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
			>
				Export
			</button>
			<button
				type="button"
				onclick={handleRefresh}
				class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
			>
				Refresh
			</button>
			<button
				type="button"
				onclick={handleAdd}
				class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none"
			>
				Add server
			</button>
		</div>
	</div>

	{#if selectedServerId}
		<div
			class="mx-auto flex h-8 max-w-[1800px] items-center justify-between border-t border-slate-200 px-3 text-[11px] text-slate-500 md:px-5"
		>
			<div class="truncate pr-2">{selectedServerBaseUrl(selectedServerId)}</div>
			<div class="flex min-w-fit items-center gap-2">
				<span>Checked: {lastCheckedValue(selectedServerId)}</span>
				<button
					type="button"
					class="text-slate-600 hover:text-slate-900"
					onclick={() => handleEdit(selectedServerId)}>Edit</button
				>
				<button
					type="button"
					class="text-rose-700 hover:text-rose-900"
					onclick={() => handleDelete(selectedServerId)}>Delete</button
				>
			</div>
		</div>
	{/if}
</header>
