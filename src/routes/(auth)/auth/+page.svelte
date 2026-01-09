<script lang="ts">
    export let form;

    let showPassword = false;
</script>

<div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div class="flex justify-center items-center gap-2 text-green-700 font-bold text-2xl mb-2">
            <img src="/logo-santri.png" alt="Santri Online" class="h-12 w-auto" loading="lazy" />
        </div>
        <h2 class="text-3xl font-extrabold text-slate-900">
            Masuk ke Akun
        </h2>
        <p class="mt-2 text-sm text-slate-600">
            Atau 
            <a href="/register" class="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                daftar akun baru
            </a>
        </p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
            
            {#if form?.message}
                <div role="alert" class="alert alert-error mb-6 text-sm py-3 rounded-lg shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{form.message}</span>
                </div>
            {/if}

            <form method="POST" class="space-y-5">
                
                <div class="form-control w-full">
                    <label class="label" for="email">
                        <span class="label-text text-slate-700 font-medium">Email</span>
                    </label>
                    <input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="nama@email.com" 
                        required 
                        class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-blue-500 h-12 rounded-lg" 
                    />
                </div>

                <div class="form-control w-full">
                    <label class="label" for="password">
                        <span class="label-text text-slate-700 font-medium">Password</span>
                    </label>
                    <div class="relative">
                        <input 
                            id="password" 
                            name="password" 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="********" 
                            required 
                            class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-blue-500 h-12 rounded-lg pr-12" 
                        />
                        <button
                            type="button"
                            class="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            on:click={() => (showPassword = !showPassword)}
                        >
                            {#if showPassword}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.364 18 12 18c1.473 0 2.767-.204 3.884-.567M9.88 9.88a3 3 0 104.243 4.243M6.228 6.228L3 3m18 18l-3.228-3.228M9.88 9.88l4.24 4.24M9.88 9.88L6.228 6.228m7.072 7.072L17.772 17.77M9.88 9.88l4.24 4.24" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.02 5.78A10.45 10.45 0 0112 6c-5.636 0-8.774 2.662-10.066 6 .555 1.46 1.48 2.736 2.746 3.733m15.233.624A10.451 10.451 0 0022.066 12c-.643-1.69-1.72-3.137-3.182-4.238" />
                                </svg>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            {/if}
                        </button>
                    </div>
                    <div class="label justify-end">
                        <a href="/reset-password" class="label-text-alt link link-hover text-blue-600">Lupa password?</a>
                    </div>
                </div>

                <div>
                    <button type="submit" class="btn btn-primary w-full bg-green-700 border-none hover:bg-green-800 normal-case text-lg font-bold h-12 rounded-xl shadow-md hover:shadow-lg transition-all">
                        Masuk Sekarang
                    </button>
                </div>
            </form>

            <div class="relative mt-8 mb-6">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                    <div class="w-full border-t border-slate-200"></div>
                </div>
                <div class="relative flex justify-center">
                    <span class="px-2 bg-white text-sm text-slate-400 uppercase tracking-wider">Atau masuk dengan</span>
                </div>
            </div>

            <div>
                <a href="/auth/google" class="btn btn-outline w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 normal-case text-base font-medium h-12 rounded-xl flex items-center justify-center gap-3 transition-all">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.33v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.11Z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.64l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23Z" />
                        <path fill="#FBBC05" d="M5.84 14.12a6.58 6.58 0 0 1 0-4.24V7.03H2.18a11 11 0 0 0 0 9.94l3.66-2.85Z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.66l3.15-3.15C17.46 1.04 14.97 0 12 0 7.42 0 3.44 2.69 1.84 6.64l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38Z" />
                    </svg>
                    <span>Masuk dengan Google</span>
                </a>
            </div>
        </div>
    </div>
</div>
