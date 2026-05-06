<script lang="ts">
	type HafalanRaporStatus = 'belum' | 'proses' | 'lulus' | 'perlu_perbaikan';

	let { status = 'belum' } = $props<{ status?: HafalanRaporStatus | string | null }>();

	let label = $derived(
		status === 'lulus'
			? 'Lulus'
			: status === 'proses'
				? 'Proses'
				: status === 'perlu_perbaikan'
					? 'Perbaikan'
					: 'Belum'
	);
	let badgeClass = $derived(
		status === 'lulus'
			? 'badge-success'
			: status === 'proses'
				? 'badge-warning'
				: status === 'perlu_perbaikan'
					? 'badge-error'
					: 'badge-ghost'
	);
</script>

<span class={`badge ${badgeClass} badge-sm whitespace-nowrap`}>{label}</span>
