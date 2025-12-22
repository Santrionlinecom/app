<script lang="ts">
	import OrgListView from '$lib/components/org/OrgListView.svelte';
	export let data;
</script>

<svelte:head>
	<title>Daftar Musholla</title>
</svelte:head>

<OrgListView title={data.title} subtitle={data.subtitle} typePath={data.typePath} orgs={data.orgs} />
