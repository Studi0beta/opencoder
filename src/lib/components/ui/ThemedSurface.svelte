<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		variant?: 'modal' | 'drawer';
		title: string;
		eyebrow?: string;
		description?: string;
		onClose: () => void;
		children?: Snippet;
	}

	let { open, variant = 'modal', title, eyebrow, description, onClose, children }: Props = $props();

	function backdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function onEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open}
	<div
		class={`fixed inset-0 z-40 ${variant === 'drawer' ? 'flex justify-end' : 'flex items-center justify-center'} bg-slate-950/55 p-2 sm:p-3 md:p-5`}
		role="dialog"
		aria-modal="true"
		aria-labelledby="themed-surface-title"
		tabindex="-1"
		onkeydown={onEscape}
		onclick={backdropClick}
	>
		<div
			class={`flex max-h-[calc(100vh-1rem)] w-full overflow-hidden border shadow-2xl sm:max-h-[calc(100vh-1.5rem)] ${variant === 'drawer' ? 'max-w-[52rem] flex-col md:rounded-l-2xl' : 'max-w-[min(100vw-1rem,48rem)] flex-col rounded-xl sm:rounded-2xl'}`}
			style="border-color: var(--hub-border); background: color-mix(in srgb, var(--hub-surface) 96%, white);"
		>
			<header
				class="flex items-start justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-5 sm:py-4"
				style="border-color: var(--hub-border);"
			>
				<div>
					{#if eyebrow}
						<p class="text-[11px] tracking-[0.24em] uppercase" style="color: var(--hub-muted);">
							{eyebrow}
						</p>
					{/if}
					<h2
						id="themed-surface-title"
						class="mt-1 text-xl font-semibold"
						style="color: var(--hub-text);"
					>
						{title}
					</h2>
					{#if description}
						<p class="mt-2 max-w-3xl text-sm" style="color: var(--hub-muted);">{description}</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg border px-3 py-2 text-sm font-medium transition hover:opacity-90"
					style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface);"
				>
					Close
				</button>
			</header>

			<div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
