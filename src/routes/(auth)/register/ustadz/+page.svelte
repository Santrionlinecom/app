<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';

	export let data: PageData;

	const { form, errors, enhance } = superForm(data.form);
	const fieldError = (value: unknown) => {
		if (!value) return undefined;
		if (Array.isArray(value)) return value[0];
		if (typeof value === 'string') return value;
		if (typeof value === 'object' && '_errors' in (value as object)) {
			const nested = (value as { _errors?: string[] })._errors;
			return nested?.[0];
		}
		return undefined;
	};

	const statusOptions = [
		{
			value: 'freelance',
			title: 'Freelancer / Pengajar Mandiri',
			desc: 'Guru privat, penulis, penceramah, atau kelas online mandiri.',
			accent: 'from-emerald-500 to-teal-500',
			icon: 'M12 4a4 4 0 100 8 4 4 0 000-8zm-6 14a6 6 0 0112 0v2H6v-2z'
		},
		{
			value: 'owner',
			title: 'Pemilik Lembaga / Perintis',
			desc: 'Punya TPQ, pondok, atau komunitas yang akan didaftarkan.',
			accent: 'from-sky-500 to-blue-600',
			icon: 'M4 10l8-5 8 5v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z'
		},
		{
			value: 'employee',
			title: 'Staf / Pengajar Lembaga',
			desc: 'Bergabung ke lembaga yang sudah terdaftar dengan kode unik.',
			accent: 'from-amber-500 to-orange-500',
			icon: 'M9 11a3 3 0 116 0 3 3 0 01-6 0zm-5 9a5 5 0 0110 0v1H4v-1zm11 1v-1a6 6 0 00-1.5-4h1.5a4 4 0 014 4v1h-4z'
		}
	];
</script>

<svelte:head>
	<title>Daftar Ustadz</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 py-12 px-4 sm:px-6 lg:px-10">
	<div class="mx-auto w-full max-w-4xl space-y-8">
		<header class="space-y-3 text-center">
			<p class="text-xs uppercase tracking-[0.25em] text-emerald-700">Santri Online</p>
			<h1 class="text-3xl md:text-4xl font-extrabold text-slate-900">Registrasi Ustadz / Pengajar</h1>
			<p class="text-base text-slate-600">
				Buat akun ustadz dan pilih status kerja agar alur pendaftaran sesuai kebutuhan Anda.
			</p>
		</header>

		<form method="POST" class="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm space-y-6" use:enhance>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<label class="text-sm font-semibold text-slate-700" for="fullName">Nama Lengkap</label>
					<input
						id="fullName"
						name="fullName"
						type="text"
						placeholder="Ustadz Ahmad"
						class="input input-bordered w-full bg-slate-50 focus:bg-white"
						bind:value={$form.fullName}
						autocomplete="name"
						required
					/>
					{#if fieldError($errors.fullName)}
						<p class="text-xs text-red-600">{fieldError($errors.fullName)}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label class="text-sm font-semibold text-slate-700" for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="ustadz@email.com"
						class="input input-bordered w-full bg-slate-50 focus:bg-white"
						bind:value={$form.email}
						autocomplete="email"
						required
					/>
					{#if fieldError($errors.email)}
						<p class="text-xs text-red-600">{fieldError($errors.email)}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label class="text-sm font-semibold text-slate-700" for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="Minimal 6 karakter"
						class="input input-bordered w-full bg-slate-50 focus:bg-white"
						bind:value={$form.password}
						autocomplete="new-password"
						required
					/>
					{#if fieldError($errors.password)}
						<p class="text-xs text-red-600">{fieldError($errors.password)}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label class="text-sm font-semibold text-slate-700" for="whatsapp">No. WhatsApp</label>
					<input
						id="whatsapp"
						name="whatsapp"
						type="tel"
						placeholder="08xxxxxxxxxx"
						class="input input-bordered w-full bg-slate-50 focus:bg-white"
						bind:value={$form.whatsapp}
						autocomplete="tel"
						required
					/>
					{#if fieldError($errors.whatsapp)}
						<p class="text-xs text-red-600">{fieldError($errors.whatsapp)}</p>
					{/if}
				</div>
			</div>

			<div class="space-y-3">
				<div>
					<p class="text-sm font-semibold text-slate-700">Status Pengajar</p>
					<p class="text-xs text-slate-500">Pilih salah satu agar sistem mengarahkan langkah berikutnya.</p>
				</div>

				<div class="grid gap-4 md:grid-cols-3">
					{#each statusOptions as option}
						<label
							class={`relative flex h-full cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition ${
								$form.workStatus === option.value
									? 'border-emerald-500 bg-emerald-50/60 shadow-lg'
									: 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow'
							}`}
						>
							<input
								class="sr-only"
								type="radio"
								name="workStatus"
								value={option.value}
								bind:group={$form.workStatus}
								required
							/>
							<div class={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${option.accent} text-white`}>
								<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.6">
									<path d={option.icon} stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<div class="space-y-1">
								<p class="text-sm font-semibold text-slate-900">{option.title}</p>
								<p class="text-xs text-slate-600">{option.desc}</p>
							</div>
							{#if $form.workStatus === option.value}
								<span class="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
									Dipilih
								</span>
							{/if}
						</label>
					{/each}
				</div>
				{#if fieldError($errors.workStatus)}
					<p class="text-xs text-red-600">{fieldError($errors.workStatus)}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<label class="text-sm font-semibold text-slate-700" for="expertise">Keahlian (opsional)</label>
				<textarea
					id="expertise"
					name="expertise"
					rows="3"
					placeholder="Contoh: Tahfidz, Fiqih, Nahwu"
					class="textarea textarea-bordered w-full bg-slate-50 focus:bg-white"
					bind:value={$form.expertise}
				></textarea>
				{#if fieldError($errors.expertise)}
					<p class="text-xs text-red-600">{fieldError($errors.expertise)}</p>
				{/if}
			</div>

			<button class="btn btn-primary w-full">Daftar Sebagai Ustadz</button>
		</form>

		<p class="text-center text-sm text-slate-500">
			Sudah punya akun? <a href="/auth" class="font-semibold text-emerald-700 hover:underline">Masuk di sini</a>
		</p>
	</div>
</div>
