<script lang="ts">
    export let form: { message?: string } | null = null;
</script>

<div class="px-6 py-8 max-w-md mx-auto">
    
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800 mb-2">Masuk</h1>
        <p class="text-slate-500 text-sm">Masuk menggunakan email dan password Anda atau lanjutkan dengan akun Google.</p>
    </div>

    {#if form?.message}
        <div role="alert" class="alert alert-error mb-4 text-sm py-2">
            <span>{form.message}</span>
        </div>
    {/if}

    <form method="POST" class="space-y-4">
        <div class="form-control w-full">
            <label class="label" for="email">
                <span class="label-text text-slate-600 font-medium">Email</span>
            </label>
            <input type="email" name="email" id="email" class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-blue-500 rounded-lg h-12" required />
        </div>

        <div class="form-control w-full">
            <label class="label" for="password">
                <span class="label-text text-slate-600 font-medium">Password</span>
            </label>
            <input type="password" name="password" id="password" class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-blue-500 rounded-lg h-12" required />
        </div>
        
        <button class="btn btn-primary w-full bg-blue-600 border-none hover:bg-blue-700 normal-case text-lg font-normal h-12 rounded-xl mt-4">
            Masuk
        </button>
    </form>

    <div class="divider text-xs text-slate-400 my-6">ATAU</div>

    <a href="/auth/google" class="btn btn-primary w-full bg-blue-600 border-none hover:bg-blue-700 normal-case text-lg font-normal h-12 rounded-xl">
        Lanjutkan dengan Google
    </a>

    <p class="text-center text-sm text-slate-600 mt-6">
        Belum punya akun? <a href="/register" class="text-slate-800 font-bold underline decoration-blue-600 underline-offset-2">Daftar</a>
    </p>
</div>
