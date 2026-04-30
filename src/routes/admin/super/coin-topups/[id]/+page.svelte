<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	// Get success/error from URL search params since form action redirects
	$: successParam = $page.url.searchParams.get('success');
	$: errorParam = $page.url.searchParams.get('error');

	const formatRupiah = (value: number) =>
		new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '-';
		return new Date(value).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'pending':
				return 'Menunggu';
			case 'approved':
				return 'Disetujui';
			case 'rejected':
				return 'Ditolak';
			default:
				return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'bg-amber-100 text-amber-700 border-amber-200';
			case 'approved':
				return 'bg-emerald-100 text-emerald-700 border-emerald-200';
			case 'rejected':
				return 'bg-red-100 text-red-700 border-red-200';
			default:
				return 'bg-slate-100 text-slate-700 border-slate-200';
		}
	};

	const parsePackageNote = (value: string | null | undefined) => {
		const note = value ?? '';
		const match = /^\[PAKET:\s*([^\]]+)\]\s*(.*)$/i.exec(note);
		if (!match) {
			return { packageName: null, userNote: note };
		}

		return {
			packageName: match[1].trim(),
			userNote: match[2].trim()
		};
	};

	$: req = data.request;
	$: isPending = req.status === 'pending';
	$: packageNote = parsePackageNote(req.userNote);
</script>

<svelte:head>
	<title>Detail Topup Koin - Admin SantriOnline</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<!-- Header -->
	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin Super</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">Detail Topup Koin</h1>
				<p class="mt-1 text-sm text-slate-500">Verifikasi request topup koin user.</p>
			</div>
			<a href="/admin/super/coin-topups" class="btn btn-outline">← Kembali ke Daftar</a>
		</div>
	</section>

	<!-- Error/Success Messages -->
	{#if errorParam}
		<div class="rounded-2xl border border-red-200 bg-red-50 p-4">
			<p class="text-sm font-medium text-red-600">{errorParam}</p>
		</div>
	{/if}

	{#if successParam === 'approved'}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
			<p class="text-sm font-medium text-emerald-600">Topup berhasil disetujui dan koin telah ditambahkan.</p>
		</div>
	{/if}

	<!-- Detail Card -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Request Info -->
		<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-lg font-semibold text-slate-900">Informasi Request</h2>
			
			<div class="mt-6 space-y-4">
				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Status</p>
					<span class="mt-1 inline-block rounded-full border px-4 py-1.5 text-sm font-medium {getStatusColor(req.status)}">
						{getStatusLabel(req.status)}
					</span>
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">User</p>
					<p class="mt-1 text-lg font-semibold text-slate-900">{req.userName ?? 'Unknown'}</p>
					<p class="text-sm text-slate-500">{req.userEmail ?? '-'}</p>
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Jumlah Koin</p>
					<p class="mt-1 text-3xl font-bold text-amber-600">{req.coinAmount.toLocaleString('id-ID')}</p>
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Jumlah Rupiah</p>
					<p class="mt-1 text-xl font-semibold text-slate-900">{formatRupiah(req.amountRupiah)}</p>
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Paket Topup</p>
					{#if packageNote.packageName}
						<p class="mt-1 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
							{packageNote.packageName}
						</p>
					{:else}
						<p class="mt-1 text-sm text-slate-700">Paket lama / tidak tercatat</p>
					{/if}
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Catatan User</p>
					<p class="mt-1 text-sm text-slate-700">{packageNote.userNote || '-'}</p>
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Bukti Transfer</p>
					{#if req.proofUrl}
						<a
							href={req.proofUrl}
							target="_blank"
							rel="noreferrer"
							class="mt-2 inline-flex break-all text-sm font-semibold text-emerald-700 hover:text-emerald-800"
						>
							Buka bukti transfer
						</a>
						<img
							src={req.proofUrl}
							alt={`Bukti transfer topup ${req.id}`}
							class="mt-3 max-h-96 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain"
						/>
					{:else}
						<p class="mt-1 text-sm text-slate-700">-</p>
					{/if}
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Tanggal Request</p>
					<p class="mt-1 text-sm text-slate-700">{formatDate(req.createdAt)}</p>
				</div>
			</div>
		</section>

		<!-- Wallet & Actions -->
		<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-lg font-semibold text-slate-900">Status Wallet</h2>
			
			<div class="mt-6 space-y-4">
				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Saldo Saat Ini</p>
					<p class="mt-1 text-3xl font-bold text-slate-900">{req.currentBalance.toLocaleString('id-ID')}</p>
				</div>

				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Setelah Disetujui</p>
					<p class="mt-1 text-3xl font-bold text-emerald-600">{(req.currentBalance + req.coinAmount).toLocaleString('id-ID')}</p>
				</div>

				{#if req.status !== 'pending'}
					<div>
						<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Catatan Admin</p>
						<p class="mt-1 text-sm text-slate-700">{req.adminNote ?? '-'}</p>
					</div>

					<div>
						<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Ditinjau Oleh</p>
						<p class="mt-1 text-sm text-slate-700">{req.reviewedBy ?? '-'}</p>
						<p class="text-xs text-slate-400">{formatDate(req.reviewedAt)}</p>
					</div>
				{/if}
			</div>

			<!-- Action Buttons -->
			{#if isPending}
				<div class="mt-8 space-y-4">
					<!-- Approve Form -->
					<form method="POST" action="?/approve" use:enhance>
						<button type="submit" class="btn btn-primary w-full">
							✓ Setuju & Tambahkan Koin
						</button>
					</form>

					<!-- Reject Form -->
					<form method="POST" action="?/reject" use:enhance class="space-y-3">
						<label for="admin_note" class="block text-sm font-medium text-slate-700">
							Catatan Penolakan (opsional)
						</label>
						<textarea
							id="admin_note"
							name="admin_note"
							rows="2"
							class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
							placeholder="Alasan penolakan..."
						></textarea>
						<button type="submit" class="btn btn-outline w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
							✕ Tolak Request
						</button>
					</form>
				</div>
			{:else}
				<div class="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
					<p class="text-sm text-slate-500">Request sudah diproses.</p>
					<a href="/admin/super/coin-topups" class="btn btn-outline mt-4">Kembali ke Daftar</a>
				</div>
			{/if}
		</section>
	</div>
</div>
