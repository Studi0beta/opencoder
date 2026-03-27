<script lang="ts">
	import './layout.css';
	const favicon = '/logo.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Opencoder</title>
	<meta name="description" content="Central access hub for opencode servers." />
</svelte:head>
{@render children()}
