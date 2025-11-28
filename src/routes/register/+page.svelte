<script lang="ts">
    export let form;
    let showPassword = false;
</script>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 flex items-center py-12 px-4 sm:px-6 lg:px-10 font-sans">
    <div class="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div class="space-y-4">
            <div class="flex items-center gap-3">
                <img src="/logo-santri.png" alt="Santri Online" class="h-12 w-auto" loading="lazy" />
                <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-emerald-700">Santri Online</p>
                    <p class="text-sm text-slate-500">Belajar, setor, dan catat hafalan 30 juz terkurasi.</p>
                </div>
            </div>
            <h1 class="text-4xl font-extrabold text-slate-900 leading-tight">Buat Akun Baru</h1>
            <p class="text-base text-slate-600 max-w-xl">
                Daftar dan mulai catat setoran, progres hafalan, hingga sertifikat otomatis. Gratis untuk santri dan mudah dipantau ustadz/ustadzah.
            </p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div class="flex items-start gap-3 rounded-2xl bg-white/90 p-4 shadow-sm border border-emerald-100">
                    <span class="mt-0.5 text-emerald-600">✅</span>
                    <div>
                        <p class="font-semibold text-slate-900">Sertifikat Otomatis</p>
                        <p class="text-slate-500">Aktif ketika target hafalan & sesi setor tercapai.</p>
                    </div>
                </div>
                <div class="flex items-start gap-3 rounded-2xl bg-white/90 p-4 shadow-sm border border-emerald-100">
                    <span class="mt-0.5 text-emerald-600">✅</span>
                    <div>
                        <p class="font-semibold text-slate-900">Pantau Progres</p>
                        <p class="text-slate-500">Grafik harian, checklist surah, dan catatan ustadz.</p>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span class="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1">Gratis untuk santri</span>
                <span class="rounded-full bg-white px-3 py-1 border border-emerald-100">Login cepat Google</span>
                <span class="rounded-full bg-white px-3 py-1 border border-emerald-100">Dukung TPQ & pondok kecil</span>
            </div>
        </div>

        <div class="bg-white/90 backdrop-blur border border-emerald-100 shadow-xl rounded-2xl p-6 sm:p-8">
            <div class="text-center mb-6">
                <p class="text-sm text-slate-500">Sudah punya akun?
                    <a href="/auth" class="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">Masuk</a>
                </p>
            </div>

            {#if form?.message}
                <div role="alert" class="alert alert-error mb-6 text-sm py-3 rounded-lg shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{form.message}</span>
                </div>
            {/if}

            <form method="POST" class="space-y-4">
                <div class="form-control w-full">
                    <label class="label" for="username">
                        <span class="label-text text-slate-700 font-semibold">Nama Lengkap</span>
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Nama lengkap"
                        required
                        class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-emerald-500 h-12 rounded-xl"
                    />
                </div>

                <div class="form-control w-full">
                    <label class="label" for="email">
                        <span class="label-text text-slate-700 font-semibold">Email</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="nama@email.com"
                        required
                        class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-emerald-500 h-12 rounded-xl"
                    />
                </div>

                <div class="form-control w-full">
                    <label class="label" for="password">
                        <span class="label-text text-slate-700 font-semibold">Password</span>
                    </label>
                    <div class="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="min. 6 karakter"
                            required
                            class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-emerald-500 h-12 rounded-xl pr-12"
                        />
                        <button
                            type="button"
                            class="absolute inset-y-0 right-3 my-auto h-9 w-9 rounded-lg text-slate-500 hover:text-emerald-700 focus:outline-none"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                            on:click={() => (showPassword = !showPassword)}
                        >
                            {#if showPassword}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.477 10.48a3 3 0 014.242 4.24M9.88 4.36A9.1 9.1 0 0121 12a9.09 9.09 0 01-2.259 3.912m-3.36 2.348A8.78 8.78 0 0112 19c-5 0-9-5-9-7a8.75 8.75 0 012.863-3.97" />
                                </svg>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            {/if}
                        </button>
                    </div>
                    <p class="text-xs text-slate-400 mt-1">Gunakan kombinasi huruf, angka, dan simbol.</p>
                </div>

                <input type="hidden" name="role" value="santri" />

                <div class="pt-2">
                    <button type="submit" class="btn btn-primary w-full bg-emerald-600 border-none hover:bg-emerald-700 normal-case text-lg font-bold h-12 rounded-xl shadow-md hover:shadow-lg transition-all">
                        Daftar Sekarang
                    </button>
                </div>
            </form>

            <div class="relative mt-6 mb-4">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                    <div class="w-full border-t border-slate-200"></div>
                </div>
                <div class="relative flex justify-center">
                    <span class="px-2 bg-white text-sm text-slate-400 uppercase tracking-wider">Atau daftar dengan</span>
                </div>
            </div>

            <div class="space-y-3">
                <a href="/auth/google" class="btn btn-outline w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 normal-case text-base font-medium h-12 rounded-xl flex items-center justify-center gap-3 transition-all">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.33v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.11Z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.64l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23Z" />
                        <path fill="#FBBC05" d="M5.84 14.12a6.58 6.58 0 0 1 0-4.24V7.03H2.18a11 11 0 0 0 0 9.94l3.66-2.85Z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.66l3.15-3.15C17.46 1.04 14.97 0 12 0 7.42 0 3.44 2.69 1.84 6.64l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38Z" />
                    </svg>
                    <span>Daftar dengan Google</span>
                </a>
            </div>
        </div>
    </div>
</div>
