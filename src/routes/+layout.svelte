<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Opencode Hub</title>
	<meta name="description" content="Central access hub for opencode servers." />
</svelte:head>
{@render children()}
