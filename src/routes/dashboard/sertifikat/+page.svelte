<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;

    let selectedSantri = data.santri?.[0]?.id || '';
    let stats = data.selectedStats;
    let certificates = data.certificates || [];
    let programTitle = 'Program Tahfiz Juz 30';
    let minAyat = 30;
    let minSessions = 8;
    let message = '';
    let loading = false;

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const d = new Date(value);
        return Number.isNaN(d.getTime())
            ? value
            : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(d);
    };

    const refreshStats = async (santriId: string) => {
        if (!santriId) return;
        try {
            const res = await fetch(`/api/certificates?userId=${santriId}&withStats=1`);
            const payload = await res.json().catch(() => ({}));
            if (payload?.stats) {
                stats = payload.stats;
            }
        } catch (err) {
            console.error('Failed to load stats', err);
        }
    };

    const generateCertificate = async () => {
        if (!selectedSantri) return;
        loading = true;
        message = '';
        try {
            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedSantri,
                    title: programTitle,
                    minAyat,
                    minSessions
                })
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                message = payload?.error || 'Gagal membuat sertifikat.';
                return;
            }

            certificates = [
                {
                    id: payload.id,
                    santri_id: payload.santriId ?? selectedSantri,
                    ustadz_id: payload.ustadzId ?? '',
                    title: payload.title || programTitle,
                    description: payload.summary || '',
                    issued_at: payload.issuedAt || new Date().toISOString(),
                    duration_days: stats?.durationDays ?? 0,
                    total_hifz_ayat: stats?.totalHifzAyat ?? 0,
                    total_doa: stats?.totalDoa ?? 0,
                    total_sessions: stats?.totalSessions ?? 0,
                    certificate_url: payload.downloadUrl,
                    downloadUrl: payload.downloadUrl,
                    santriName:
                        data.santri.find((s: { id: string; label: string }) => s.id === selectedSantri)?.label || payload.santriId || 'Santri',
                    ustadzName: 'Pembimbing'
                },
                ...certificates
            ];
            message = 'Sertifikat berhasil diterbitkan.';
        } catch (err) {
            console.error(err);
            message = 'Terjadi kesalahan saat membuat sertifikat.';
        } finally {
            loading = false;
        }
    };

    $: if (selectedSantri) {
        refreshStats(selectedSantri);
    }
</script>

<svelte:head>
    <title>Sertifikat Santri</title>
</svelte:head>

<div class="space-y-6">
    <div class="rounded-3xl border bg-gradient-to-r from-slate-900 via-emerald-700 to-emerald-500 px-6 py-7 text-white shadow-xl">
        <p class="text-xs uppercase tracking-[0.25em] text-white/70">Panel Sertifikat</p>
        <h1 class="mt-2 text-3xl font-semibold">Terbitkan Sertifikat Santri</h1>
        <p class="mt-2 max-w-3xl text-sm text-emerald-50">
            Hitung capaian hafalan santri, pastikan memenuhi syarat, lalu terbitkan sertifikat PDF otomatis.
            File tersimpan di R2 dan dapat diunduh oleh santri.
        </p>
    </div>

    <div class="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <div class="rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-2">
                <div>
                    <h2 class="text-lg font-semibold text-slate-900">Pilih Santri</h2>
                    <p class="text-sm text-slate-500">Lihat syarat dan terbitkan sertifikat.</p>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Admin/Ustadz</span>
            </div>

            <div class="mt-4 space-y-3">
                <label class="flex flex-col gap-1 text-sm text-slate-700">
                    Santri
                    <select class="select select-bordered" bind:value={selectedSantri}>
                        {#each data.santri as item}
                            <option value={item.id}>{item.label}</option>
                        {/each}
                    </select>
                </label>
                <label class="flex flex-col gap-1 text-sm text-slate-700">
                    Judul Program
                    <input class="input input-bordered h-11" bind:value={programTitle} />
                </label>
                <div class="grid gap-3 md:grid-cols-2">
                    <label class="flex flex-col gap-1 text-sm text-slate-700">
                        Minimal ayat disetujui
                        <input type="number" class="input input-bordered h-11" bind:value={minAyat} min="1" />
                    </label>
                    <label class="flex flex-col gap-1 text-sm text-slate-700">
                        Minimal sesi belajar
                        <input type="number" class="input input-bordered h-11" bind:value={minSessions} min="1" />
                    </label>
                </div>

                {#if stats}
                    <div class="grid grid-cols-2 gap-2 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                        <div class="space-y-1">
                            <p class="text-xs uppercase tracking-wide text-slate-500">Ayat Disetujui</p>
                            <p class="text-lg font-semibold text-slate-900">{stats.totalHifzAyat}</p>
                            <p class="text-[11px] text-slate-500">Doa: {stats.totalDoa}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-xs uppercase tracking-wide text-slate-500">Sesi & Durasi</p>
                            <p class="text-lg font-semibold text-slate-900">{stats.totalSessions} sesi</p>
                            <p class="text-[11px] text-slate-500">{stats.durationDays || 0} hari total</p>
                        </div>
                    </div>
                {/if}

                {#if message}
                    <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>
                {/if}
                <button class="btn btn-primary w-full" on:click|preventDefault={generateCertificate} disabled={loading}>
                    {loading ? 'Memproses...' : 'Terbitkan Sertifikat'}
                </button>
            </div>
        </div>

        <div class="rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-2">
                <div>
                    <h2 class="text-lg font-semibold text-slate-900">Sertifikat Terbaru</h2>
                    <p class="text-sm text-slate-500">Daftar 50 sertifikat terakhir.</p>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{certificates.length} file</span>
            </div>

            {#if certificates.length === 0}
                <div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
                    Belum ada sertifikat diterbitkan.
                </div>
            {:else}
                <div class="mt-4 space-y-3">
                    {#each certificates as cert}
                        <div class="rounded-xl border px-4 py-3 shadow-sm hover:border-emerald-200">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{cert.title}</p>
                                    <p class="text-xs text-slate-500">Santri: {cert.santriName || cert.santri_id}</p>
                                    <p class="text-xs text-slate-500">Ustadz: {cert.ustadzName || '-'}</p>
                                    <p class="text-[11px] text-slate-500">Terbit: {formatDate((cert as any).issuedAt || cert.issued_at)}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <a class="btn btn-sm btn-primary" href={cert.downloadUrl || cert.certificate_url} target="_blank">
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
