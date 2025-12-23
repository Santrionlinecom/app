<script lang="ts">
	import OrgRegisterView from '$lib/components/org/OrgRegisterView.svelte';
	export let form;
</script>

<svelte:head>
	<title>Daftar Rumah Tahfidz</title>
</svelte:head>

<OrgRegisterView title="Rumah Tahfidz" typePath="rumah-tahfidz" {form} />
