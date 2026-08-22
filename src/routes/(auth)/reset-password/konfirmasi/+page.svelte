<!-- src/routes/(auth)/reset-password/konfirmasi/+page.svelte -->
<script lang="ts">
	import { reveal } from '$lib/motion';
	import { page } from '$app/stores';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	// Token dibaca ulang dari URL setiap render, tidak disimpan di state —
	// supaya nilainya tidak ikut tersalin ke tempat lain.
	$: token = $page.url.searchParams.get('token') ?? '';

	let password = '';
	let konfirmasi = '';

	$: terlaluPendek = password.length > 0 && password.length < 6;
	$: tidakSama = konfirmasi.length > 0 && password !== konfirmasi;
	$: siapKirim = password.length >= 6 && password === konfirmasi;
</script>

<svelte:head>
	<title>Buat Password Baru | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="auth-page flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto mb-6 w-full max-w-md text-center" use:reveal={{ delay: 0, distance: 14 }}>
		<div class="mb-3 flex items-center justify-center">
			<img src="/logo-santri.png" alt="SantriOnline" class="h-12 w-auto" loading="lazy" />
		</div>
		<h2 class="font-display text-3xl font-bold tracking-tight text-so-green">Buat Password Baru</h2>
	</div>

	<div class="mx-auto w-full max-w-md" use:reveal={{ delay: 80, distance: 16 }}>
		<div class="auth-card px-4 py-8 sm:px-10">
			{#if form?.success}
				<div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-900">
					{form.message}
				</div>
				<a href="/auth" class="auth-submit mt-6">Masuk Sekarang</a>

			{:else if !data.tokenSah}
				<!--
					Tautan mati diberi tahu SEBELUM pengguna mengetik password
					dua kali — bukan setelahnya.
				-->
				<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
					<p class="font-bold">Tautan tidak berlaku</p>
					<p class="mt-2 leading-6">
						Tautan reset sudah kedaluwarsa, sudah pernah dipakai, atau tidak dikenali.
						Tautan hanya berlaku 60 menit dan sekali pakai.
					</p>
				</div>
				<a href="/reset-password" class="auth-submit mt-6">Minta Tautan Baru</a>

			{:else}
				{#if form?.message}
					<div role="alert" class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
						{form.message}
					</div>
				{/if}

				<form method="POST" class="space-y-5">
					<input type="hidden" name="token" value={token} />

					<div class="w-full">
						<label class="mb-1.5 block text-sm font-semibold text-so-ink" for="password">
							Password baru
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="new-password"
							bind:value={password}
							placeholder="Minimal 6 karakter"
							required
							class="auth-input"
						/>
						{#if terlaluPendek}
							<p class="mt-1.5 text-xs font-semibold text-red-700">Password minimal 6 karakter.</p>
						{/if}
					</div>

					<div class="w-full">
						<label class="mb-1.5 block text-sm font-semibold text-so-ink" for="konfirmasi">
							Ulangi password baru
						</label>
						<input
							id="konfirmasi"
							name="konfirmasi"
							type="password"
							autocomplete="new-password"
							bind:value={konfirmasi}
							placeholder="Ketik ulang password"
							required
							class="auth-input"
						/>
						{#if tidakSama}
							<p class="mt-1.5 text-xs font-semibold text-red-700">Konfirmasi password tidak sama.</p>
						{/if}
					</div>

					<p class="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
						Setelah password diganti, Anda akan dikeluarkan dari semua perangkat dan
						perlu masuk kembali.
					</p>

					<Turnstile siteKey={$page.data.turnstileSiteKey ?? ''} />

					<button type="submit" class="auth-submit" disabled={!siapKirim}>
						Simpan Password Baru
					</button>
				</form>
			{/if}

			<div class="mt-6 text-center text-sm">
				<a href="/auth" class="font-semibold text-so-green hover:underline">Kembali ke halaman masuk</a>
			</div>
		</div>
	</div>
</div>

<style>
	.auth-page {
		background: linear-gradient(180deg, #faf8f3, #f3f1ea);
	}

	.auth-card {
		border: 1px solid var(--color-so-border, #e8e4dc);
		border-radius: var(--radius-so-lg, 20px);
		background: #ffffff;
		box-shadow: var(--shadow-card, 0 12px 34px rgb(27 67 50 / 0.08));
	}

	:global(.auth-card .auth-input) {
		display: block;
		width: 100%;
		height: 3rem;
		padding: 0 0.875rem;
		border: 1px solid var(--color-so-border, #e8e4dc);
		border-radius: 0.75rem;
		background-color: rgb(250 248 243 / 0.6);
		color: var(--color-so-ink, #1a1a1a);
		font-size: 0.95rem;
	}

	:global(.auth-card .auth-input:focus) {
		outline: none;
		background-color: #ffffff;
		border-color: var(--color-so-gold, #c9a84c);
		box-shadow: 0 0 0 4px rgb(201 168 76 / 0.18);
	}

	:global(.auth-card .auth-submit) {
		display: flex;
		width: 100%;
		min-height: 3rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		background: var(--color-so-green, #1b4332);
		color: #ffffff;
		font-weight: 700;
		font-size: 0.95rem;
		text-decoration: none;
		transition: background-color 0.18s ease;
	}

	:global(.auth-card .auth-submit:hover:not(:disabled)) {
		background: #143b2a;
	}

	:global(.auth-card .auth-submit:disabled) {
		background: #cbd5e1;
		cursor: not-allowed;
	}
</style>
