<script lang="ts">
	import OrgPublicLandingView from '$lib/components/org/OrgPublicLandingView.svelte';
	export let data;
</script>

<svelte:head>
	<title>Daftar Musholla</title>
</svelte:head>

<OrgPublicLandingView title={data.title} subtitle={data.subtitle} typePath={data.typePath} orgs={data.orgs} />
