<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;

    let certificates = (data.certificates ?? []).map((c) => ({
        ...c,
        downloadUrl: (c as any).downloadUrl || c.certificate_url
    }));
    let programTitle = 'Program Tahfiz Juz 30';
    let minAyat = 30;
    let minSessions = 8;
    let statusMessage = '';
    let loading = false;

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const d = new Date(value);
        return Number.isNaN(d.getTime())
            ? value
            : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(d);
    };

    const triggerCertificate = async () => {
        loading = true;
        statusMessage = '';
        try {
            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: programTitle, minAyat, minSessions })
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                statusMessage = payload?.error || 'Gagal membuat sertifikat.';
                return;
            }

            certificates = [
                {
                    id: payload.id,
                    santri_id: payload.santriId ?? data.user.id,
                    ustadz_id: payload.ustadzId ?? data.user.id,
                    title: payload.title || programTitle,
                    description: payload.summary || '',
                    issued_at: payload.issuedAt || new Date().toISOString(),
                    duration_days: data.stats.durationDays,
                    total_hifz_ayat: data.stats.totalHifzAyat,
                    total_doa: data.stats.totalDoa,
                    total_sessions: data.stats.totalSessions,
                    certificate_url: payload.downloadUrl,
                    downloadUrl: payload.downloadUrl
                },
                ...certificates
            ];
            statusMessage = 'Sertifikat berhasil dibuat dan siap diunduh.';
        } catch (err) {
            console.error(err);
            statusMessage = 'Terjadi kesalahan saat membuat sertifikat.';
        } finally {
            loading = false;
        }
    };
</script>

<svelte:head>
    <title>Sertifikat Santri</title>
</svelte:head>

<div class="space-y-6">
    <div class="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 px-6 py-8 shadow-xl text-white">
        <p class="text-xs uppercase tracking-[0.2em] text-white/80">Sertifikat Otomatis</p>
        <h1 class="mt-2 text-3xl font-semibold">Halo, {data.user?.username || data.user?.email}</h1>
        <p class="mt-2 max-w-3xl text-sm text-emerald-50">
            Saat syarat hafalan terpenuhi, sistem akan menyiapkan sertifikat dengan rangkuman capaian Anda.
            Tekan tombol di bawah untuk memicu pemeriksaan dan pembuatan file PDF.
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3 text-xs text-emerald-50">
            <span class="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Minimal {minAyat} ayat disetujui</span>
            <span class="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Minimal {minSessions} sesi setor</span>
            <span class="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Durasi dihitung otomatis</span>
        </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
        <div class="rounded-2xl border bg-white p-4 shadow-sm">
            <p class="text-xs uppercase tracking-wide text-slate-500">Ayat Disetujui</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{data.stats.totalHifzAyat}</p>
            <p class="text-xs text-slate-500">Total ayat hafalan tervalidasi.</p>
        </div>
        <div class="rounded-2xl border bg-white p-4 shadow-sm">
            <p class="text-xs uppercase tracking-wide text-slate-500">Doa Dikuasai</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{data.stats.totalDoa}</p>
            <p class="text-xs text-slate-500">Ditarik dari log doa (jika ada).</p>
        </div>
        <div class="rounded-2xl border bg-white p-4 shadow-sm">
            <p class="text-xs uppercase tracking-wide text-slate-500">Sesi Belajar</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{data.stats.totalSessions}</p>
            <p class="text-xs text-slate-500">Setor/murajaah unik per hari.</p>
        </div>
        <div class="rounded-2xl border bg-white p-4 shadow-sm">
            <p class="text-xs uppercase tracking-wide text-slate-500">Durasi</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{data.stats.durationDays || 0} hari</p>
            <p class="text-xs text-slate-500">Dari setoran pertama sampai terbaru.</p>
        </div>
    </div>

    <div class="grid gap-4 md:grid-cols-[2fr_3fr]">
        <div class="rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-2">
                <div>
                    <h2 class="text-lg font-semibold text-slate-900">Buat Sertifikat</h2>
                    <p class="text-sm text-slate-500">Sistem akan mengecek syarat otomatis.</p>
                </div>
                <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">PDF</span>
            </div>
            <div class="mt-4 space-y-3">
                <label class="flex flex-col gap-1 text-sm text-slate-700">
                    Judul Program
                    <input
                        class="input input-bordered h-11"
                        bind:value={programTitle}
                        placeholder="Program Tahfiz Juz 30"
                    />
                </label>
                <div class="grid gap-3 md:grid-cols-2">
                    <label class="flex flex-col gap-1 text-sm text-slate-700">
                        Target ayat minimal
                        <input
                            type="number"
                            min="1"
                            class="input input-bordered h-11"
                            bind:value={minAyat}
                        />
                    </label>
                    <label class="flex flex-col gap-1 text-sm text-slate-700">
                        Minimal sesi
                        <input
                            type="number"
                            min="1"
                            class="input input-bordered h-11"
                            bind:value={minSessions}
                        />
                    </label>
                </div>
                {#if statusMessage}
                    <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        {statusMessage}
                    </div>
                {/if}
                <button class="btn btn-primary w-full" on:click|preventDefault={triggerCertificate} disabled={loading}>
                    {loading ? 'Memproses...' : 'Cek & Buat Sertifikat'}
                </button>
            </div>
        </div>

        <div class="rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-2">
                <div>
                    <h2 class="text-lg font-semibold text-slate-900">Sertifikat Saya</h2>
                    <p class="text-sm text-slate-500">Unduh sertifikat yang sudah terbit.</p>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{certificates.length} file</span>
            </div>

            {#if certificates.length === 0}
                <div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
                    Belum ada sertifikat. Lengkapi hafalan dan klik tombol buat sertifikat.
                </div>
            {:else}
                <div class="mt-4 space-y-3">
                    {#each certificates as cert}
                        <div class="rounded-xl border px-4 py-3 shadow-sm hover:border-emerald-200">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{cert.title}</p>
                                    <p class="text-xs text-slate-500">Terbit: {formatDate((cert as any).issuedAt || cert.issued_at)}</p>
                                    <p class="text-xs text-slate-500">{cert.total_hifz_ayat} ayat • {cert.total_sessions} sesi • {cert.duration_days || 0} hari</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <a
                                        class="btn btn-sm variant-filled-primary"
                                        href={cert.downloadUrl || cert.certificate_url}
                                        target="_blank"
                                    >
                                        Unduh
                                    </a>
                                    <span class="rounded-full bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">PDF</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

