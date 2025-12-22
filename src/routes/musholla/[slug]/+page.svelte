<script lang="ts">
	import OrgDetailView from '$lib/components/org/OrgDetailView.svelte';
	export let data;
</script>

<svelte:head>
	<title>{data.org?.name || 'Musholla'}</title>
</svelte:head>

<OrgDetailView org={data.org} typePath={data.typePath} />
