<script lang="ts">
	import OrgMemberRegisterView from '$lib/components/org/OrgMemberRegisterView.svelte';
	export let data;
	export let form;
</script>

<svelte:head>
	<title>Daftar Musholla</title>
</svelte:head>

<OrgMemberRegisterView org={data.org} roles={data.roles} {form} />
