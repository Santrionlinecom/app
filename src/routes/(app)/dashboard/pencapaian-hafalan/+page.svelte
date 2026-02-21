<script lang="ts">
	import type { PageData } from './$types';
import { SURAH_DATA } from '$lib/surah-data';
	
	export let data: PageData;

	let activeTab: 'resmi' | 'mandiri' = 'resmi';

	const flagged = data.flagged ?? [];
	const summary = flagged.reduce(
		(acc, row) => {
			if (row.qualityStatus === 'merah') acc.merah += 1;
			else if (row.qualityStatus === 'kuning') acc.kuning += 1;
			else acc.pending += 1;
			return acc;
		},
		{ merah: 0, kuning: 0, pending: 0 }
	);

	const totalAyatResmi = data.hafalanResmi.reduce((sum: number, s: any) => sum + (s.total_ayat || 0), 0);
	const totalLancarResmi = data.hafalanResmi.reduce((sum: number, s: any) => sum + (s.lancar || 0), 0);

	const getSurahName = (num: number) => {
		return SURAH_DATA.find(s => s.number === num)?.name || `Surah ${num}`;
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};
</script>

<svelte:head>
	<title>Pencapaian Hafalan</title>
</svelte:head>

<div class="container">
	<div class="header-card">
		<div>
			<p class="header-subtitle">HAFALAN</p>
			<h1 class="header-title">Pencapaian Hafalan</h1>
			<p class="header-desc">Tracking setoran resmi dan muroja'ah mandiri</p>
		</div>
		<a href="/dashboard" class="btn-back">← Kembali</a>
	</div>

	<!-- Tabs -->
	<div class="tabs">
		<button 
			class="tab {activeTab === 'resmi' ? 'active' : ''}"
			on:click={() => activeTab = 'resmi'}
		>
			📚 Setoran Resmi
		</button>
		<button 
			class="tab {activeTab === 'mandiri' ? 'active' : ''}"
			on:click={() => activeTab = 'mandiri'}
		>
			📖 Muroja'ah Mandiri
		</button>
	</div>

	{#if activeTab === 'resmi'}
		<!-- Setoran Resmi -->
		<div class="content-section">
			<h2 class="section-title">Setoran Resmi ke Ustadz</h2>
			
			<div class="stats-grid">
				<div class="stat-card blue">
					<div class="stat-icon">📊</div>
					<div class="stat-value">{totalAyatResmi}</div>
					<div class="stat-label">Total Ayat Disetujui</div>
				</div>
				<div class="stat-card green">
					<div class="stat-icon">✓</div>
					<div class="stat-value">{totalLancarResmi}</div>
					<div class="stat-label">Lancar</div>
				</div>
				<div class="stat-card red">
					<div class="stat-icon">⚠</div>
					<div class="stat-value">{summary.merah}</div>
					<div class="stat-label">Perlu Perbaikan</div>
				</div>
				<div class="stat-card amber">
					<div class="stat-icon">⏳</div>
					<div class="stat-value">{summary.pending}</div>
					<div class="stat-label">Pending Review</div>
				</div>
			</div>

			<div class="card">
				<h3 class="card-title">Progress per Surah</h3>
				{#if data.hafalanResmi.length === 0}
					<div class="empty-state">
						<div class="empty-icon">📚</div>
						<p>Belum ada setoran yang disetujui</p>
					</div>
				{:else}
					<div class="table-container">
						<table class="data-table">
							<thead>
								<tr>
									<th>Surah</th>
									<th>Total Ayat</th>
									<th>Lancar</th>
									<th>Kurang Lancar</th>
									<th>Belum Lancar</th>
								</tr>
							</thead>
							<tbody>
								{#each data.hafalanResmi as surah}
									<tr>
										<td class="font-semibold">{getSurahName(surah.surah_number as number)}</td>
										<td class="text-center">{surah.total_ayat}</td>
										<td class="text-center">
											<span class="badge green">{surah.lancar || 0}</span>
										</td>
										<td class="text-center">
											<span class="badge amber">{surah.kurang_lancar || 0}</span>
										</td>
										<td class="text-center">
											<span class="badge red">{surah.belum_lancar || 0}</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			{#if flagged.length > 0}
				<div class="card">
					<h3 class="card-title">Ayat yang Perlu Perhatian</h3>
					<div class="table-container">
						<table class="data-table">
							<thead>
								<tr>
									<th>Surah</th>
									<th>Ayat</th>
									<th>Status</th>
									<th>Kualitas</th>
									<th>Tanggal</th>
								</tr>
							</thead>
							<tbody>
								{#each flagged as row}
									<tr>
										<td>{row.surahNumber}</td>
										<td class="text-center">{row.ayahNumber}</td>
										<td>{row.status}</td>
										<td>
											<span class="badge {row.qualityStatus === 'merah' ? 'red' : row.qualityStatus === 'kuning' ? 'amber' : 'gray'}">
												{row.qualityStatus || 'pending'}
											</span>
										</td>
										<td class="text-sm text-gray-600">
											{row.tanggalSetor ? formatDate(row.tanggalSetor) : '-'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Muroja'ah Mandiri -->
		<div class="content-section">
			<h2 class="section-title">Muroja'ah Mandiri</h2>
			
			<div class="stats-grid">
				<div class="stat-card blue">
					<div class="stat-icon">📖</div>
					<div class="stat-value">{data.murojaStats.total_muroja}</div>
					<div class="stat-label">Total Muroja'ah</div>
				</div>
				<div class="stat-card green">
					<div class="stat-icon">✓</div>
					<div class="stat-value">{data.murojaStats.lancar}</div>
					<div class="stat-label">Lancar</div>
				</div>
				<div class="stat-card amber">
					<div class="stat-icon">⚠</div>
					<div class="stat-value">{data.murojaStats.kurang_lancar}</div>
					<div class="stat-label">Kurang Lancar</div>
				</div>
				<div class="stat-card red">
					<div class="stat-icon">✗</div>
					<div class="stat-value">{data.murojaStats.belum_lancar}</div>
					<div class="stat-label">Belum Lancar</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header">
					<h3 class="card-title">Muroja'ah per Surah</h3>
					<a href="/dashboard/hafalan-mandiri" class="btn-link">+ Tambah Muroja'ah</a>
				</div>
				{#if data.murojaPerSurah.length === 0}
					<div class="empty-state">
						<div class="empty-icon">📖</div>
						<p>Belum ada muroja'ah mandiri</p>
						<a href="/dashboard/hafalan-mandiri" class="btn-primary">Mulai Muroja'ah</a>
					</div>
				{:else}
					<div class="table-container">
						<table class="data-table">
							<thead>
								<tr>
									<th>Surah</th>
									<th>Total Muroja'ah</th>
									<th>Terakhir Muroja'ah</th>
								</tr>
							</thead>
							<tbody>
								{#each data.murojaPerSurah as surah}
									<tr>
										<td class="font-semibold">{getSurahName(surah.surah_number as number)}</td>
										<td class="text-center">
											<span class="badge blue">{surah.total_muroja}x</span>
										</td>
										<td class="text-sm text-gray-600">
											{formatDate(surah.last_muroja as string)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<div class="info-card">
				<div class="info-icon">💡</div>
				<div>
					<p class="info-title">Tentang Muroja'ah Mandiri</p>
					<p class="info-text">
						Muroja'ah mandiri adalah tracking pribadi untuk memantau kualitas hafalan Anda di luar setoran resmi. 
						Data ini hanya untuk referensi pribadi dan tidak mempengaruhi setoran resmi ke ustadz.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.container {
		width: 100%;
		max-width: none;
		margin: 0;
		padding: 1rem 0;
	}

	.header-card {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		border-radius: 1.5rem;
		padding: 2rem;
		color: white;
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-subtitle {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		opacity: 0.9;
	}

	.header-title {
		font-size: 2rem;
		font-weight: 700;
		margin-top: 0.5rem;
	}

	.header-desc {
		font-size: 0.95rem;
		opacity: 0.9;
		margin-top: 0.5rem;
	}

	.btn-back {
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		border-radius: 0.5rem;
		font-weight: 600;
		text-decoration: none;
	}

	.btn-back:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		background: white;
		padding: 0.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.tab {
		flex: 1;
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab:hover {
		background: #f3f4f6;
	}

	.tab.active {
		background: #3b82f6;
		color: white;
	}

	.content-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		background: white;
		border: 2px solid;
		border-radius: 0.75rem;
		padding: 1.5rem;
		text-align: center;
	}

	.stat-card.blue {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.stat-card.green {
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
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 600;
		margin-top: 0.25rem;
	}

	.card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.btn-link {
		color: #3b82f6;
		font-weight: 600;
		text-decoration: none;
		font-size: 0.95rem;
	}

	.btn-link:hover {
		text-decoration: underline;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		text-decoration: none;
		display: inline-block;
		margin-top: 1rem;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.table-container {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table thead {
		background: #f9fafb;
	}

	.data-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}

	.data-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.95rem;
	}

	.data-table tbody tr:hover {
		background: #f9fafb;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.badge.green {
		background: #d1fae5;
		color: #065f46;
	}

	.badge.amber {
		background: #fef3c7;
		color: #92400e;
	}

	.badge.red {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge.blue {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge.gray {
		background: #f3f4f6;
		color: #374151;
	}

	.info-card {
		display: flex;
		gap: 1rem;
		background: #eff6ff;
		border: 2px solid #bfdbfe;
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.info-icon {
		font-size: 2rem;
	}

	.info-title {
		font-weight: 700;
		color: #1e40af;
		margin-bottom: 0.5rem;
	}

	.info-text {
		font-size: 0.95rem;
		color: #1e40af;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.tabs {
			flex-direction: column;
		}
	}
</style>
