<script lang="ts">
	interface Props {
		label?: string;
		code: string;
		language?: string;
	}

	let { label = 'Code', code, language }: Props = $props();

	let copied = $state(false);
	let copyTimeout = 0;

	async function copyCode(): Promise<void> {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			window.clearTimeout(copyTimeout);
			copyTimeout = window.setTimeout(() => {
				copied = false;
			}, 1800);
		} catch {
			const textarea = document.createElement('textarea');
			textarea.value = code;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			copied = true;
			window.clearTimeout(copyTimeout);
			copyTimeout = window.setTimeout(() => {
				copied = false;
			}, 1800);
		}
	}
</script>

<div
	class="overflow-hidden rounded-xl border"
	style="border-color: var(--hub-border); background: var(--hub-surface-2);"
>
	<div
		class="flex items-center justify-between gap-3 border-b px-4 py-2 text-xs"
		style="border-color: var(--hub-border); color: var(--hub-muted);"
	>
		<div class="flex items-center gap-2">
			<span class="font-medium" style="color: var(--hub-text);">{label}</span>
			{#if language}
				<span
					class="rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase"
					style="background: var(--hub-surface); color: var(--hub-muted);">{language}</span
				>
			{/if}
		</div>
		<button
			type="button"
			onclick={copyCode}
			class="rounded-md border px-2.5 py-1 text-[11px] font-medium transition hover:opacity-90"
			style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface);"
		>
			{copied ? 'Copied' : 'Copy'}
		</button>
	</div>
	<pre class="overflow-x-auto p-4 text-sm leading-6"><code style="color: var(--hub-text);"
			>{code}</code
		></pre>
</div>
