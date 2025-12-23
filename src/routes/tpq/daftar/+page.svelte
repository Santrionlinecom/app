<script lang="ts">
	import OrgRegisterView from '$lib/components/org/OrgRegisterView.svelte';
	export let form;
</script>

<svelte:head>
	<title>Daftar TPQ</title>
</svelte:head>

<OrgRegisterView title="TPQ" typePath="tpq" {form} />
