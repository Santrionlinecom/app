<script lang="ts">
	import OrgRegisterView from '$lib/components/org/OrgRegisterView.svelte';
	export let form;
</script>

<svelte:head>
	<title>Daftar Pondok Pesantren</title>
</svelte:head>

<OrgRegisterView title="Pondok Pesantren" typePath="pondok" {form} />
