<script>
	export let value = 62;
	export let label = 'Tercapai';
	export let size = 116;
	export let stroke = 12;

	$: radius = (size - stroke) / 2;
	$: circumference = 2 * Math.PI * radius;
	$: dash = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
</script>

<div class="relative inline-grid place-items-center" style={`width:${size}px;height:${size}px`}>
	<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} class="-rotate-90">
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="#EFEAE0"
			stroke-width={stroke}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="url(#goldGreen)"
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={dash}
		/>
		<defs>
			<linearGradient id="goldGreen" x1="0" x2="1" y1="0" y2="1">
				<stop offset="0%" stop-color="#C9A84C" />
				<stop offset="100%" stop-color="#1B4332" />
			</linearGradient>
		</defs>
	</svg>
	<div class="absolute text-center">
		<div class="font-display text-2xl font-bold text-so-green">{value}%</div>
		<div class="text-[11px] font-semibold text-so-muted">{label}</div>
	</div>
</div>
