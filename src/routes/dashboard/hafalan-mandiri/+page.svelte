<script lang="ts">
import type { PageData } from './$types';
import { enhance } from '$app/forms';

export let data: PageData;

let showAddForm = false;
let selectedSurah = '';
	let ayahStart = '';
	let ayahEnd = '';
let quality = 'lancar';
let notes = '';
let murojaDate = new Date().toISOString().split('T')[0];
let filterQuality = '';
let checkedSurahs = new Set<number>(data.checkedSurahs || []);
const juzSegments = data.juzSegments || [];
const overallPercent = Math.min(
	100,
	Math.round(((data.stats.approvedAyah || 0) / (data.stats.totalAyah || 1)) * 10000) / 100
);
let toggling = new Set<number>();

	const qualityLabels: Record<string, string> = {
		lancar: 'Lancar',
		kurang_lancar: 'Kurang Lancar',
		belum_lancar: 'Belum Lancar'
	};

	const qualityColors: Record<string, string> = {
		lancar: 'bg-emerald-100 text-emerald-800 border-emerald-300',
		kurang_lancar: 'bg-amber-100 text-amber-800 border-amber-300',
		belum_lancar: 'bg-red-100 text-red-800 border-red-300'
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	};

	const getSurahName = (num: number) => {
		return data.surahs.find(s => s.number === num)?.name || `Surah ${num}`;
	};

	const resetForm = () => {
		showAddForm = false;
		selectedSurah = '';
		ayahStart = '';
		ayahEnd = '';
		quality = 'lancar';
		notes = '';
		murojaDate = new Date().toISOString().split('T')[0];
	};

	$: filteredMuroja = filterQuality 
		? data.muroja.filter((m: any) => m.quality === filterQuality)
		: data.muroja;

	$: selectedSurahData = data.surahs.find(s => s.number === parseInt(selectedSurah));

	const toggleSurah = async (surahNumber: number) => {
		const currently = checkedSurahs.has(surahNumber);
		const formData = new FormData();
		formData.set('surahNumber', String(surahNumber));
		formData.set('checked', (!currently).toString());
		toggling.add(surahNumber);
		toggling = new Set(toggling);
		try {
			const res = await fetch('?/toggleSurah', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) throw new Error('Gagal menyimpan centang surah');
			if (currently) {
				checkedSurahs.delete(surahNumber);
				checkedSurahs = new Set(checkedSurahs);
			} else {
				checkedSurahs = new Set([...checkedSurahs, surahNumber]);
			}
		} catch (err) {
			alert((err as Error).message);
		} finally {
			toggling.delete(surahNumber);
			toggling = new Set(toggling);
		}
	};
</script>

<div class="container">
	<div class="header">
		<div>
			<h1 class="title">📖 Hafalan Mandiri</h1>
			<p class="subtitle">Tracking muroja'ah dan kualitas hafalan Anda</p>
		</div>
		<button on:click={() => showAddForm = !showAddForm} class="btn-add">
			{showAddForm ? '✕ Tutup' : '+ Tambah Muroja\'ah'}
		</button>
	</div>

	<div class="stats-grid">
		<button on:click={() => filterQuality = ''} class="stat-card {!filterQuality ? 'ring-2 ring-blue-500' : ''}">
			<div class="stat-icon">📊</div>
			<div class="stat-value">{data.stats.total}</div>
			<div class="stat-label">Total Hafalan</div>
		</button>
		<button on:click={() => filterQuality = 'lancar'} class="stat-card emerald {filterQuality === 'lancar' ? 'ring-2 ring-emerald-500' : ''}">
			<div class="stat-icon">✓</div>
			<div class="stat-value">{data.stats.lancar}</div>
			<div class="stat-label">Lancar</div>
		</button>
		<button on:click={() => filterQuality = 'kurang_lancar'} class="stat-card amber {filterQuality === 'kurang_lancar' ? 'ring-2 ring-amber-500' : ''}">
			<div class="stat-icon">⚠</div>
			<div class="stat-value">{data.stats.kurangLancar}</div>
			<div class="stat-label">Kurang Lancar</div>
		</button>
		<button on:click={() => filterQuality = 'belum_lancar'} class="stat-card red {filterQuality === 'belum_lancar' ? 'ring-2 ring-red-500' : ''}">
			<div class="stat-icon">✗</div>
			<div class="stat-value">{data.stats.belumLancar}</div>
			<div class="stat-label">Belum Lancar</div>
		</button>
	</div>

	{#if data.stats.belumLancar > 0}
		<div class="alert-card">
			<span class="alert-icon">💡</span>
			<div>
				<p class="alert-title">Tips Muroja'ah</p>
				<p class="alert-text">Anda memiliki {data.stats.belumLancar} hafalan yang belum lancar. Fokuskan muroja'ah pada bagian tersebut!</p>
			</div>
		</div>
	{/if}

	<div class="progress-card">
		<div>
			<p class="progress-title">Bagan Hafalan 30 Juz</p>
			<p class="progress-sub">Estimasi setara juz dari ayat yang disetujui</p>
		</div>
		<div class="overall-ring" aria-label={`Progress keseluruhan ${overallPercent}%`}>
			<div
				class="ring"
				style={`background: conic-gradient(#10b981 ${overallPercent}%, #e5e7eb 0);`}
			>
				<div class="ring-inner">
					<div class="ring-value">{overallPercent}%</div>
					<div class="ring-label">Total</div>
				</div>
			</div>
		</div>
		<div class="juz-grid">
			{#each juzSegments as seg}
				<div class="juz-pill">
					<div
						class="juz-circle"
						style={`background: conic-gradient(#22c55e ${seg.fill * 100}%, #eef2ff 0);`}
						aria-label={`Juz ${seg.index} progres ${Math.round(seg.fill * 100)}%`}
						title={`Juz ${seg.index} · ${Math.round(seg.fill * 100)}%`}
					>
						<span>{seg.index}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="checklist-card">
		<div class="section-header">
			<h2 class="section-title">Checklist Surah Hafal (Mandiri)</h2>
			<p class="section-subtitle">Centang surah yang selesai Anda hafalkan sendiri.</p>
		</div>
		<div class="surah-grid">
			{#each data.surahs as surah}
				<button
					type="button"
					class={`surah-pill ${checkedSurahs.has(surah.number) ? 'checked' : ''}`}
					on:click={() => toggleSurah(surah.number)}
					disabled={toggling.has(surah.number)}
				>
					<span class="circle">{checkedSurahs.has(surah.number) ? '●' : '○'}</span>
					<span class="surah-name">{surah.number}. {surah.name}</span>
					<span class="surah-ayah">{surah.totalAyah} ayat</span>
				</button>
			{/each}
		</div>
	</div>

	{#if showAddForm}
		<div class="form-card">
			<h3 class="form-title">Tambah Muroja'ah Baru</h3>
			<form method="POST" action="?/addMuroja" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						resetForm();
						location.reload();
					}
				};
			}}>
				<div class="form-grid">
					<div class="form-group">
						<label for="surah">Surah</label>
						<select id="surah" name="surahNumber" bind:value={selectedSurah} required>
							<option value="">Pilih Surah</option>
							{#each data.surahs as surah}
								<option value={surah.number}>{surah.number}. {surah.name} ({surah.totalAyah} ayat)</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label for="ayahStart">Ayat Mulai</label>
						<input id="ayahStart" type="number" name="ayahStart" bind:value={ayahStart} min="1" max={selectedSurahData?.totalAyah || 999} required />
					</div>
					<div class="form-group">
						<label for="ayahEnd">Ayat Selesai</label>
						<input id="ayahEnd" type="number" name="ayahEnd" bind:value={ayahEnd} min="1" max={selectedSurahData?.totalAyah || 999} required />
					</div>
					<div class="form-group">
						<label for="quality">Kualitas</label>
						<select id="quality" name="quality" bind:value={quality} required>
							<option value="lancar">✓ Lancar</option>
							<option value="kurang_lancar">⚠ Kurang Lancar</option>
							<option value="belum_lancar">✗ Belum Lancar</option>
						</select>
					</div>
					<div class="form-group">
						<label for="murojaDate">Tanggal</label>
						<input id="murojaDate" type="date" name="murojaDate" bind:value={murojaDate} required />
					</div>
				</div>
				<div class="form-group">
					<label for="notes">Catatan (Opsional)</label>
					<textarea id="notes" name="notes" bind:value={notes} rows="2" placeholder="Contoh: Sering lupa di ayat 15, perlu diulang..."></textarea>
				</div>
				<div class="form-actions">
					<button type="button" on:click={resetForm} class="btn-cancel">Batal</button>
					<button type="submit" class="btn-submit">Simpan Muroja'ah</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="section">
		<div class="section-header">
			<h2 class="section-title">Riwayat Muroja'ah</h2>
			{#if filterQuality}
				<button on:click={() => filterQuality = ''} class="btn-clear-filter">
					✕ Hapus Filter
				</button>
			{/if}
		</div>
		
		{#if filteredMuroja.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📖</div>
				<p class="empty-text">
					{filterQuality ? 'Tidak ada muroja\'ah dengan kualitas ini' : 'Belum ada riwayat muroja\'ah'}
				</p>
				{#if !filterQuality}
					<button on:click={() => showAddForm = true} class="btn-add-first">
						+ Tambah Muroja'ah Pertama
					</button>
				{/if}
			</div>
		{:else}
			<div class="muroja-list">
				{#each filteredMuroja as m}
					<div class="muroja-card">
						<div class="muroja-header">
							<div>
								<h3 class="muroja-surah">{getSurahName(m.surah_number)}</h3>
								<p class="muroja-ayah">Ayat {m.ayah_start} - {m.ayah_end}</p>
							</div>
							<span class="quality-badge {qualityColors[m.quality]}">
								{qualityLabels[m.quality]}
							</span>
						</div>
						<p class="muroja-date">📅 {formatDate(m.muroja_date)}</p>
						{#if m.notes}
							<p class="muroja-notes">{m.notes}</p>
						{/if}
						<form method="POST" action="?/deleteMuroja" use:enhance>
							<input type="hidden" name="id" value={m.id} />
							<button type="submit" class="btn-delete">🗑️ Hapus</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.title {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #6b7280;
	}

	.btn-add {
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-add:hover {
		background: #2563eb;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.25rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.stat-card.emerald {
		border-color: #10b981;
		background: #d1fae5;
	}

	.stat-card.amber {
		border-color: #f59e0b;
		background: #fef3c7;
	}

	.stat-card.red {
		border-color: #ef4444;
		background: #fee2e2;
	}

	.stat-icon {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
	}

	.stat-label {
		font-size: 0.8rem;
		color: #6b7280;
		font-weight: 600;
	}

	.alert-card {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		background: #fef3c7;
		border: 2px solid #f59e0b;
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.alert-icon {
		font-size: 1.5rem;
	}

	.alert-title {
		font-weight: 700;
		color: #92400e;
		margin-bottom: 0.25rem;
	}

	.alert-text {
		font-size: 0.875rem;
		color: #92400e;
	}

	.progress-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		align-items: center;
	}

	.progress-title {
		font-weight: 700;
		color: #111827;
	}

	.progress-sub {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.overall-ring {
		display: flex;
		justify-content: center;
	}

	.ring {
		width: 140px;
		height: 140px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		box-shadow: 0 10px 30px rgba(16, 185, 129, 0.12);
	}

	.ring-inner {
		width: 100px;
		height: 100px;
		border-radius: 999px;
		background: white;
		display: grid;
		place-items: center;
		text-align: center;
	}

	.ring-value {
		font-weight: 800;
		font-size: 1.1rem;
		color: #047857;
	}

	.ring-label {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.juz-grid {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
		gap: 0.5rem;
	}

	.juz-pill {
		display: flex;
		justify-content: center;
	}

	.juz-circle {
		width: 60px;
		height: 60px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		font-weight: 700;
		color: #0f172a;
	}

	.checklist-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.section-subtitle {
		color: #6b7280;
		font-size: 0.95rem;
		margin-top: 0.2rem;
	}

	.surah-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.surah-pill {
		border: 1px solid #e5e7eb;
		border-radius: 999px;
		padding: 0.65rem 0.8rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #f8fafc;
		color: #0f172a;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.surah-pill:hover {
		border-color: #a5b4fc;
		background: #eef2ff;
	}

	.surah-pill.checked {
		border-color: #10b981;
		background: #ecfdf3;
		color: #065f46;
	}

	.surah-pill:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.circle {
		font-size: 1rem;
	}

	.surah-name {
		font-weight: 600;
		flex: 1;
		text-align: left;
	}

	.surah-ayah {
		font-size: 0.75rem;
		color: #64748b;
	}

	.form-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.form-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #1f2937;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.625rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.95rem;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.btn-cancel {
		padding: 0.625rem 1.5rem;
		background: white;
		border: 2px solid #d1d5db;
		color: #374151;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-cancel:hover {
		background: #f3f4f6;
	}

	.btn-submit {
		padding: 0.625rem 1.5rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-submit:hover {
		background: #059669;
	}

	.section {
		margin-top: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.btn-clear-filter {
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.btn-clear-filter:hover {
		background: #e5e7eb;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: #f9fafb;
		border-radius: 0.75rem;
		border: 2px dashed #d1d5db;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-text {
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.btn-add-first {
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-add-first:hover {
		background: #2563eb;
	}

	.muroja-list {
		display: grid;
		gap: 1rem;
	}

	.muroja-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.muroja-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.muroja-surah {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
	}

	.muroja-ayah {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.quality-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		border: 1px solid;
	}

	.muroja-date {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.muroja-notes {
		font-size: 0.875rem;
		color: #4b5563;
		background: #f9fafb;
		padding: 0.75rem;
		border-radius: 0.375rem;
		margin-bottom: 0.75rem;
	}

	.btn-delete {
		padding: 0.5rem 1rem;
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-delete:hover {
		background: #fecaca;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
