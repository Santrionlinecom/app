<script lang="ts">
	import Turnstile from '$lib/components/Turnstile.svelte';
	import GoogleAuthButton from '$lib/components/GoogleAuthButton.svelte';
	import { reveal } from '$lib/motion';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form;

	let showPassword = false;
	$: googleHref = data.redirectPath
		? `/auth/google?redirect=${encodeURIComponent(data.redirectPath)}`
		: '/auth/google';
</script>

<svelte:head>
	<title>Masuk | SantriOnline</title>
</svelte:head>

<div class="auth-page flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto mb-6 w-full max-w-md text-center" use:reveal={{ delay: 0, distance: 14 }}>
		<div class="mb-3 flex items-center justify-center">
			<img src="/logo-santri.png" alt="SantriOnline" class="h-12 w-auto" loading="lazy" />
		</div>
		<h2 class="font-display text-3xl font-bold tracking-tight text-so-green">Masuk ke Akun</h2>
		<p class="mt-2 text-sm text-so-muted">
			Atau
			<a
				href="/register"
				class="font-semibold text-so-green underline decoration-so-gold decoration-2 underline-offset-2 hover:text-so-green-2"
			>
				daftar akun baru
			</a>
		</p>
	</div>

	<div class="mx-auto w-full max-w-md" use:reveal={{ delay: 80, distance: 16 }}>
		<div class="auth-card px-4 py-8 sm:px-10">
			{#if form?.message}
				<div
					role="alert"
					class="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mt-0.5 h-5 w-5 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
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

				<div class="w-full">
					<label class="mb-1.5 block text-sm font-semibold text-so-ink" for="password">
						Password
					</label>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							placeholder="••••••••"
							required
							class="auth-input pr-12"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-3 flex items-center text-so-muted transition-colors hover:text-so-green"
							aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
							on:click={() => (showPassword = !showPassword)}
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="1.75"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.364 18 12 18c1.473 0 2.767-.204 3.884-.567M9.88 9.88a3 3 0 104.243 4.243M6.228 6.228L3 3m18 18l-3.228-3.228M9.88 9.88l4.24 4.24M9.88 9.88L6.228 6.228m7.072 7.072L17.772 17.77M9.88 9.88l4.24 4.24"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M13.02 5.78A10.45 10.45 0 0112 6c-5.636 0-8.774 2.662-10.066 6 .555 1.46 1.48 2.736 2.746 3.733m15.233.624A10.451 10.451 0 0022.066 12c-.643-1.69-1.72-3.137-3.182-4.238"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="1.75"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							{/if}
						</button>
					</div>
					<div class="mt-2 flex justify-end">
						<a
							href="/reset-password"
							class="text-xs font-semibold text-so-muted transition-colors hover:text-so-green hover:underline"
						>
							Lupa password?
						</a>
					</div>
				</div>

				<Turnstile siteKey={data.turnstileSiteKey} />

				<button type="submit" class="auth-submit"> Masuk Sekarang </button>
			</form>

			<div class="relative my-7">
				<div class="absolute inset-0 flex items-center" aria-hidden="true">
					<div class="w-full border-t border-so-border"></div>
				</div>
				<div class="relative flex justify-center">
					<span class="bg-white px-3 text-xs uppercase tracking-wider text-so-muted">
						Atau masuk dengan
					</span>
				</div>
			</div>

			<GoogleAuthButton href={googleHref} label="Masuk dengan Google" />
		</div>
	</div>
</div>

<style>
	/* Latar bermerek: gradien halus, dirender sekali, tanpa animasi berkelanjutan. */
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

	/* Field diberi gaya lewat satu kelas agar tampilannya konsisten
	   tanpa mengubah atribut name/required yang dibaca server. */
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
