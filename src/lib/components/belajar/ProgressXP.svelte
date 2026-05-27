<script lang="ts">
	export let xp_sekarang = 0;
	export let xp_target = 100;
	export let streak_hari = 0;

	$: xp = Math.max(0, Number(xp_sekarang ?? 0));
	$: target = Math.max(100, Number(xp_target ?? 100));
	$: level = Math.floor(xp / 100) + 1;
	$: levelBase = Math.floor(xp / 100) * 100;
	$: levelProgress = Math.min(100, Math.round(((xp - levelBase) / 100) * 100));
	$: targetLabel = Math.max(target, levelBase + 100);
</script>

<section class="rounded-xl border border-[#1B4332]/10 bg-[#FAF8F3] p-4 shadow-sm">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<p class="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]">Level {level}</p>
			<p class="mt-1 text-2xl font-extrabold text-[#1B4332]">{xp} XP</p>
		</div>
		<div class="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#1B4332] shadow-sm">
			🔥 {streak_hari} hari
		</div>
	</div>

	<div class="mt-4">
		<div class="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
			<span>{xp - levelBase}/100 XP level ini</span>
			<span>Target {targetLabel} XP</span>
		</div>
		<div class="h-4 overflow-hidden rounded-full bg-white">
			<div
				class="h-full rounded-full bg-[#C9A84C] transition-all duration-500"
				style={`width: ${levelProgress}%`}
			></div>
		</div>
	</div>
</section>
