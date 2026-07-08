<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type FormValues = {
		title: string;
		description: string;
		targetUrl: string;
		isActive: boolean;
	};

	const values = $derived(
		(form as { values?: FormValues } | null | undefined)?.values ?? {
			title: data.link.title,
			description: data.link.description,
			targetUrl: data.link.targetUrl,
			isActive: data.link.isActive
		}
	);
</script>

<svelte:head>
	<title>Edit {data.link.slug} | SantriOnline</title>
</svelte:head>

<section class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
	<a href={`/admin/shortlinks/${data.link.slug}`} class="text-sm font-semibold text-emerald-700 hover:text-emerald-700">Analytics</a>
	<div class="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
		<div>
			<p class="text-sm font-semibold text-slate-500">/{data.link.slug}</p>
			<h1 class="mt-1 text-2xl font-bold text-slate-950">Edit Shortlink</h1>
		</div>

		{#if form?.error}
			<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
				{form.error}
			</div>
		{/if}

		<form method="POST" class="mt-6 space-y-5">
			<div>
				<label for="title" class="block text-sm font-semibold text-slate-700">Title</label>
				<input
					id="title"
					name="title"
					required
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
					value={values.title}
				/>
			</div>

			<div>
				<label for="description" class="block text-sm font-semibold text-slate-700">Description</label>
				<textarea
					id="description"
					name="description"
					rows="3"
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
				>{values.description}</textarea>
			</div>

			<div>
				<label for="target_url" class="block text-sm font-semibold text-slate-700">Target URL</label>
				<input
					id="target_url"
					name="target_url"
					required
					type="url"
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
					value={values.targetUrl}
				/>
			</div>

			<label class="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
				<input name="is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-emerald-700" checked={values.isActive} />
				Aktif
			</label>

			<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<a
					href={`/admin/shortlinks/${data.link.slug}`}
					class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
				>
					Batal
				</a>
				<button
					type="submit"
					class="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
				>
					Simpan
				</button>
			</div>
		</form>
	</div>
</section>
