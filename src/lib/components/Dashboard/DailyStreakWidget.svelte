<script lang="ts">
    export let streakCount = 0;
    export let isCheckedToday = false;
    export let data: any;

    $: if (data?.streak) {
        streakCount = data.streak.count;
        isCheckedToday = data.streak.isCheckedToday;
    }
</script>

<div class="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                🔥
            </div>
            <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Streak Harian</p>
                <p class="text-lg font-bold text-emerald-800">{streakCount} Hari Berturut-turut!</p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <div class="text-[10px] font-bold uppercase {isCheckedToday ? 'text-emerald-600' : 'text-amber-600'}">
                {isCheckedToday ? 'Selesai' : 'Perlu Diselesaikan'}
            </div>
            <div class="h-3 w-3 rounded-full {isCheckedToday ? 'bg-emerald-500' : 'bg-amber-500'}"></div>
        </div>
    </div>
</div>
