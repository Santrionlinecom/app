<script lang="ts">
    import GoogleAuthButton from '$lib/components/GoogleAuthButton.svelte';

    export let form: { message?: string } | null = null;
</script>

<div class="px-6 py-8 max-w-md mx-auto">
    
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800 mb-2">Masuk</h1>
        <p class="text-slate-500 text-sm">Masuk menggunakan email dan password Anda atau lanjutkan dengan akun Google.</p>
    </div>

    {#if form?.message}
        <div role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <span>Mohon periksa kembali email dan password Anda</span>
        </div>
    {/if}

    <form method="POST" class="space-y-5">
        <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700" for="email">
                Email
            </label>
            <input 
                type="email" 
                name="email" 
                id="email" 
                class="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20" 
                placeholder="Contoh: email@domain.com"
                required 
            />
        </div>

        <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700" for="password">
                Password
            </label>
            <input 
                type="password" 
                name="password" 
                id="password" 
                class="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20" 
                placeholder="Masukkan password Anda"
                required 
            />
        </div>
        
        <button 
            class="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-600/40 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed" 
            type="submit"
        >
            Masuk
        </button>
    </form>

    <div class="divider text-xs text-slate-400 my-6">ATAU</div>

    <GoogleAuthButton href="/auth/google" label="Masuk dengan Google" />

    <p class="text-center text-sm text-slate-600 mt-6">
        Belum punya akun? <a href="/register" class="text-slate-800 font-bold underline decoration-blue-600 underline-offset-2">Daftar</a>
    </p>
</div>
