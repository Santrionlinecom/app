<script lang="ts">
	export let org;
	export let roles: Array<{ value: string; label: string }> = [];
	export let form;
</script>

<section class="max-w-3xl mx-auto py-10 px-4 space-y-6">
	<header class="space-y-2 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Pendaftaran Anggota</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">{org?.name}</h1>
		<p class="text-slate-600">Pendaftaran akan menunggu persetujuan admin lembaga.</p>
	</header>

	<form method="POST" class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
		<div class="form-control">
			<label class="label" for="name">
				<span class="label-text font-medium">Nama Lengkap</span>
			</label>
			<input id="name" name="name" class="input input-bordered" required />
		</div>

		<div class="form-control">
			<label class="label" for="email">
				<span class="label-text font-medium">Email</span>
			</label>
			<input id="email" name="email" type="email" class="input input-bordered" required />
		</div>

		<div class="form-control">
			<label class="label" for="password">
				<span class="label-text font-medium">Password</span>
			</label>
			<input id="password" name="password" type="password" class="input input-bordered" minlength="6" required />
		</div>

		<div class="form-control">
			<label class="label" for="role">
				<span class="label-text font-medium">Peran</span>
			</label>
			<select id="role" name="role" class="select select-bordered" required>
				{#each roles as role}
					<option value={role.value}>{role.label}</option>
				{/each}
			</select>
		</div>

		{#if form?.error}
			<div class="alert alert-error text-sm">{form.error}</div>
		{/if}

		<button class="btn btn-primary w-full">Daftar Anggota</button>
	</form>
</section>
