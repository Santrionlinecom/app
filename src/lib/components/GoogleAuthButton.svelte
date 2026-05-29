<script lang="ts">
	export let href = '/auth/google';
	export let label = 'Masuk dengan Google';
	export let className = '';
</script>

<a
	{href}
	class={`inline-flex min-h-[4.5rem] w-full items-center justify-center gap-5 rounded-[1.1rem] border border-slate-300 bg-white px-6 py-4 text-xl font-medium tracking-normal text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-100 ${className}`}
>
	<svg class="h-7 w-7 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
		<path
			fill="#4285F4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.33v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.11Z"
		/>
		<path
			fill="#34A853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.64l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23Z"
		/>
		<path
			fill="#FBBC05"
			d="M5.84 14.12a6.58 6.58 0 0 1 0-4.24V7.03H2.18a11 11 0 0 0 0 9.94l3.66-2.85Z"
		/>
		<path
			fill="#EA4335"
			d="M12 5.38c1.62 0 3.07.56 4.21 1.66l3.15-3.15C17.46 1.04 14.97 0 12 0 7.42 0 3.44 2.69 1.84 6.64l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38Z"
		/>
	</svg>
	<span>{label}</span>
</a>
