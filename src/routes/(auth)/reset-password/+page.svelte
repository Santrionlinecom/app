<script lang="ts">
	import { reveal } from '$lib/motion';
	import { page } from '$app/stores';
	import Turnstile from '$lib/components/Turnstile.svelte';

	export let form;
</script>

<svelte:head>
	<title>Reset Password | SantriOnline</title>
</svelte:head>

<div class="auth-page flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto mb-6 w-full max-w-md text-center" use:reveal={{ delay: 0, distance: 14 }}>
		<div class="mb-3 flex items-center justify-center">
			<img src="/logo-santri.png" alt="SantriOnline" class="h-12 w-auto" loading="lazy" />
		</div>
		<h2 class="font-display text-3xl font-bold tracking-tight text-so-green">Reset Password</h2>
		<p class="mt-2 text-sm text-so-muted">
			Masukkan email yang terdaftar untuk menerima tautan reset password.
		</p>
	</div>

	<div class="mx-auto w-full max-w-md" use:reveal={{ delay: 80, distance: 16 }}>
		<div class="auth-card px-4 py-8 sm:px-10">
			{#if form?.message}
				<!-- Ikon disesuaikan dengan jenis pesan. Sebelumnya pesan sukses
				     ikut memakai ikon galat sehingga membingungkan. -->
				<div
					role="alert"
					class={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
						form?.success
							? 'border-emerald-200 bg-emerald-50 text-emerald-800'
							: 'border-rose-200 bg-rose-50 text-rose-700'
					}`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mt-0.5 h-5 w-5 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						{#if form?.success}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						{/if}
					</svg>
					<span>{form.message}</span>
				</div>
			{/if}

			<form method="POST" class="space-y-5">
				<div class="w-full">
					<label class="mb-1.5 block text-sm font-semibold text-so-ink" for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="nama@email.com"
						required
						class="auth-input"
					/>
				</div>

				<!--
					Turnstile: endpoint reset adalah sasaran empuk untuk
					membanjiri inbox orang lain — cukup kirim email korban
					berulang kali sampai inbox-nya penuh.
				-->
				<Turnstile siteKey={$page.data.turnstileSiteKey ?? ''} />

				<button type="submit" class="auth-submit">Kirim Tautan Reset</button>
			</form>

			<!--
				27 dari 41 akun masuk lewat Google tanpa password. Tanpa
				keterangan ini, mereka bisa menghabiskan waktu mereset
				password padahal cukup menekan tombol Google.
			-->
			<p class="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
				<strong class="text-slate-800">Biasa masuk dengan tombol Google?</strong>
				Anda tidak perlu reset password — cukup
				<a href="/auth" class="font-semibold text-so-green underline">masuk dengan Google</a>
				seperti biasa. Reset password hanya untuk yang masuk memakai email dan password.
			</p>

			<div class="mt-6 text-center text-sm">
				<a
					href="/auth"
					class="font-semibold text-so-green transition-colors hover:text-so-green-2 hover:underline"
				>
					Kembali ke halaman masuk
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.auth-page {
		background:
			radial-gradient(80% 60% at 50% -10%, rgb(201 168 76 / 0.12), transparent 60%),
			linear-gradient(180deg, #faf8f3, #f3f1ea);
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
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			background-color 0.18s ease;
	}

	:global(.auth-card .auth-input::placeholder) {
		color: #9aa0a6;
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
		border: 1px solid transparent;
		border-radius: 0.75rem;
		background: var(--color-so-green, #1b4332);
		color: #ffffff;
		font-size: 1rem;
		font-weight: 700;
		box-shadow: 0 10px 24px rgb(27 67 50 / 0.22);
		transition:
			transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
			background-color 0.18s ease,
			box-shadow 0.18s ease;
	}

	:global(.auth-card .auth-submit:hover) {
		transform: translateY(-1px);
		background: var(--color-so-green-2, #2d6a4f);
		box-shadow: 0 14px 30px rgb(27 67 50 / 0.28);
	}

	:global(.auth-card .auth-submit:focus-visible) {
		outline: 2px solid var(--color-so-gold, #c9a84c);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.auth-card .auth-input),
		:global(.auth-card .auth-submit) {
			transition: none;
		}
		:global(.auth-card .auth-submit:hover) {
			transform: none;
		}
	}
</style>
