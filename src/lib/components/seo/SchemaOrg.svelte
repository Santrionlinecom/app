<script lang="ts">
	type SchemaType = 'website' | 'article' | 'organization' | 'breadcrumb';
	type BreadcrumbItem = { name: string; url: string };

	export let type: SchemaType = 'website';
	export let data: Record<string, any> = {};

	const baseUrl = 'https://app.santrionline.com';
	const absoluteUrl = (value: string) => {
		if (!value) return baseUrl;
		try {
			return new URL(value, baseUrl).toString();
		} catch {
			return baseUrl;
		}
	};

	$: websiteSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'SantriOnline',
		alternateName: ['Santri Online', 'SantriOnline.com'],
		url: baseUrl,
		description:
			'Platform ekosistem pesantren digital Indonesia untuk buku, kitab, hafalan, dan belajar Islam online.',
		inLanguage: 'id-ID',
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${baseUrl}/blog?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	};

	$: orgSchema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'SantriOnline',
		url: baseUrl,
		logo: {
			'@type': 'ImageObject',
			url: `${baseUrl}/logo.png`,
			width: 512,
			height: 512
		},
		sameAs: [
			'https://www.tiktok.com/@santrionline.com',
			'https://www.instagram.com/idsantrionline',
			'https://www.youtube.com/@websantri'
		],
		contactPoint: {
			'@type': 'ContactPoint',
			contactType: 'customer support',
			availableLanguage: 'Indonesian'
		}
	};

	$: articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: data.title || data.judul || '',
		description: data.meta_description || data.description || data.excerpt || '',
		image: data.thumbnail_url || data.image || `${baseUrl}/santrionline.png`,
		author: {
			'@type': 'Organization',
			name: 'SantriOnline'
		},
		publisher: {
			'@type': 'Organization',
			name: 'SantriOnline',
			logo: {
				'@type': 'ImageObject',
				url: `${baseUrl}/logo.png`
			}
		},
		datePublished: data.published_at || data.datePublished || data.created_at || new Date().toISOString(),
		dateModified: data.updated_at || data.dateModified || data.published_at || new Date().toISOString(),
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': absoluteUrl(data.url || data.canonicalUrl || '')
		},
		keywords: data.focus_keyword || data.seo_keyword || data.keywords || '',
		inLanguage: 'id-ID',
		articleSection: 'Dakwah Islam'
	};

	$: breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: ((data.breadcrumbs || []) as BreadcrumbItem[]).map((crumb, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: crumb.name,
			item: absoluteUrl(crumb.url)
		}))
	};

	$: schema =
		type === 'article'
			? articleSchema
			: type === 'organization'
				? orgSchema
				: type === 'breadcrumb'
					? breadcrumbSchema
					: websiteSchema;
	$: jsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
