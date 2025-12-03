<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	const profile = data.profile;
</script>

<svelte:head>
	<title>Profil & Pengaturan</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
	<div class="mx-auto max-w-4xl px-4">
		<!-- Hero Profile -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl mb-8">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 flex items-center gap-6">
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-5xl">
					{profile?.gender === 'wanita' ? '👩' : '👨'}
				</div>
				<div>
					<h1 class="text-4xl font-bold mb-2">{profile?.username || profile?.email}</h1>
					<div class="flex flex-wrap gap-3">
						<span class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm">
							📧 {profile?.email}
						</span>
						<span class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm">
							👤 {profile?.role || 'santri'}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Forms Grid -->
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Update Profile -->
			<form method="POST" action="?/updateProfile" class="rounded-3xl border-2 border-blue-200 bg-white p-6 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-4xl">✏️</span>
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Ubah Profil</h2>
						<p class="text-sm text-gray-600">Atur nama dan informasi pribadi</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="profile-email" class="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
						<input id="profile-email" class="input input-bordered w-full bg-gray-50" value={profile?.email} readonly />
					</div>

					<div>
						<label for="profile-name" class="block text-sm font-semibold text-gray-700 mb-2">👤 Nama Lengkap</label>
						<input id="profile-name" name="displayName" class="input input-bordered w-full" value={profile?.username ?? ''} placeholder="Masukkan nama lengkap" />
					</div>

					<div>
						<label for="profile-gender" class="block text-sm font-semibold text-gray-700 mb-2">⚧️ Jenis Kelamin</label>
						<select id="profile-gender" name="gender" class="select select-bordered w-full" value={profile?.gender || ''}>
							<option value="">Pilih jenis kelamin</option>
							<option value="pria">👨 Laki-laki</option>
							<option value="wanita">👩 Perempuan</option>
						</select>
					</div>

					<div>
						<label for="profile-username" class="block text-sm font-semibold text-gray-700 mb-2">🆔 Username</label>
						<input id="profile-username" name="handle" class="input input-bordered w-full" value={profile?.id ?? ''} placeholder="username_unik" />
						<p class="text-xs text-gray-500 mt-1">Gunakan huruf, angka, atau underscore</p>
					</div>

					{#if form?.success && form?.type === undefined}
						<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
							<p class="text-green-800 font-semibold">✅ Profil berhasil diperbarui!</p>
						</div>
					{:else if form?.message && form?.type === undefined}
						<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
							<p class="text-red-800">❌ {form.message}</p>
						</div>
					{/if}

					<button type="submit" class="btn w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg">
						💾 Simpan Profil
					</button>
				</div>
			</form>

			<!-- Update Password -->
			<form method="POST" action="?/updatePassword" class="rounded-3xl border-2 border-purple-200 bg-white p-6 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-4xl">🔒</span>
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Ubah Password</h2>
						<p class="text-sm text-gray-600">Minimal 6 karakter untuk keamanan</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="password-new" class="block text-sm font-semibold text-gray-700 mb-2">🔑 Password Baru</label>
						<input id="password-new" name="password" type="password" class="input input-bordered w-full" required minlength="6" placeholder="Masukkan password baru" />
					</div>

					<div>
						<label for="password-confirm" class="block text-sm font-semibold text-gray-700 mb-2">✅ Konfirmasi Password</label>
						<input id="password-confirm" name="confirm" type="password" class="input input-bordered w-full" required minlength="6" placeholder="Ulangi password baru" />
					</div>

					{#if form?.success && form?.type === 'password'}
						<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
							<p class="text-green-800 font-semibold">✅ Password berhasil diperbarui!</p>
						</div>
					{:else if form?.message && form?.type === 'password'}
						<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
							<p class="text-red-800">❌ {form.message}</p>
						</div>
					{/if}

					<button type="submit" class="btn w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg">
						🔐 Simpan Password
					</button>
				</div>
			</form>

			<!-- Update WhatsApp -->
			<form method="POST" action="?/updateWhatsapp" class="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-4xl">📱</span>
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Nomor WhatsApp</h2>
						<p class="text-sm text-gray-600">Gunakan nomor aktif untuk pengingat</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="profile-whatsapp" class="block text-sm font-semibold text-gray-700 mb-2">📲 Nomor WhatsApp</label>
						<input
							id="profile-whatsapp"
							name="whatsapp"
							type="tel"
							inputmode="tel"
							placeholder="Contoh 087854545274"
							class="input input-bordered w-full"
							value={profile?.whatsapp ?? ''}
							required
						/>
						<p class="text-xs text-gray-500 mt-1">Angka saja, 9-15 digit (boleh diawali +62)</p>
					</div>

					{#if form?.success && form?.type === 'whatsapp'}
						<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
							<p class="text-green-800 font-semibold">✅ Nomor WhatsApp tersimpan!</p>
						</div>
					{:else if form?.message && form?.type === 'whatsapp'}
						<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
							<p class="text-red-800">❌ {form.message}</p>
						</div>
					{/if}

					<button type="submit" class="btn w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg">
						💾 Simpan Nomor
					</button>
				</div>
			</form>
		</div>

		<!-- Quick Actions -->
		<div class="mt-8 grid gap-4 md:grid-cols-3">
			<a href="/dashboard" class="rounded-2xl border-2 border-blue-200 bg-white p-6 text-center hover:shadow-lg transition">
				<span class="text-4xl mb-2 block">📊</span>
				<h3 class="font-bold text-gray-900">Dashboard</h3>
				<p class="text-sm text-gray-600">Lihat progres hafalan</p>
			</a>
			<a href="/kalender" class="rounded-2xl border-2 border-purple-200 bg-white p-6 text-center hover:shadow-lg transition">
				<span class="text-4xl mb-2 block">📅</span>
				<h3 class="font-bold text-gray-900">Kalender</h3>
				<p class="text-sm text-gray-600">Jadwal & catatan</p>
			</a>
			<form method="POST" action="/logout" class="rounded-2xl border-2 border-red-200 bg-white p-6 text-center hover:shadow-lg transition">
				<button type="submit" class="w-full">
					<span class="text-4xl mb-2 block">🚪</span>
					<h3 class="font-bold text-red-600">Logout</h3>
					<p class="text-sm text-gray-600">Keluar dari akun</p>
				</button>
			</form>
		</div>
	</div>
</div>
