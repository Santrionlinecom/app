export const formatRelativeTime = (unixTimestamp: number) => {
	const now = Math.floor(Date.now() / 1000);
	const diff = Math.max(0, now - unixTimestamp);
	if (diff < 60) return 'baru saja';
	if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
	if (diff < 172800) return 'kemarin';
	return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(new Date(unixTimestamp * 1000));
};

export const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('') || 'SO';

export const avatarColor = (id: string) => {
	const colors = ['bg-emerald-600', 'bg-teal-600', 'bg-cyan-600', 'bg-lime-600', 'bg-amber-600', 'bg-sky-600'];
	const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return colors[hash % colors.length];
};
