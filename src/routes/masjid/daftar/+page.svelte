<script lang="ts">
	import OrgRegisterView from '$lib/components/org/OrgRegisterView.svelte';
	export let form;
</script>

<svelte:head>
	<title>Daftar Masjid</title>
</svelte:head>

<OrgRegisterView title="Masjid" typePath="masjid" {form} />
