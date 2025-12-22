<script lang="ts">
	import OrgRegisterView from '$lib/components/org/OrgRegisterView.svelte';
	export let form;
</script>

<svelte:head>
	<title>Daftar Musholla</title>
</svelte:head>

<OrgRegisterView title="Musholla" typePath="musholla" {form} />
