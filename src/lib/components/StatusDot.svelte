<script lang="ts">
	import type { HealthState } from '$lib/types';

	interface Props {
		state: HealthState;
	}

	let { state }: Props = $props();

	const toneByState: Record<HealthState, string> = {
		online: 'bg-emerald-500',
		offline: 'bg-rose-500',
		degraded: 'bg-amber-500',
		unknown: 'bg-slate-400'
	};
</script>

<span class={`inline-block h-2.5 w-2.5 rounded-full ${toneByState[state]}`} aria-hidden="true"
></span>
