<script lang="ts">
	import OrgDetailView from '$lib/components/org/OrgDetailView.svelte';
	import OrgEducationPublic from '$lib/components/org/OrgEducationPublic.svelte';
	export let data;

	const orgName = data.org?.name ?? 'Pondok';
	const orgType = data.org?.type ?? data.typePath ?? 'pondok';
	const addressText = data.org?.address || data.org?.city || 'alamat belum tersedia';
	const mediaItems = data.media ?? [];
	const description = `Profil lengkap ${orgName}, alamat di ${addressText}. Terdaftar resmi di SantriOnline.`;
	const pageTitle = `${orgName} - ${orgType} | SantriOnline`;
	const ogImage = mediaItems.length
		? mediaItems[0].url
		: 'https://app.santrionline.com/logo-santri.png';
	const canonicalUrl = data.org?.slug
		? `https://app.santrionline.com/${data.typePath}/${data.org.slug}`
		: 'https://app.santrionline.com';
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImage} />
</svelte:head>

<OrgDetailView org={data.org} typePath={data.typePath} media={data.media} members={data.members} />
<OrgEducationPublic org={data.org} />
