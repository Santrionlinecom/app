/**
 * Fondasi animasi SantriOnline.
 *
 * Prinsip:
 * 1. Hanya menganimasikan `transform` dan `opacity` — properti yang ditangani GPU,
 *    sehingga tidak memicu layout/paint ulang dan tetap ringan di HP kelas menengah.
 * 2. Selalu menghormati `prefers-reduced-motion`. Bila pengguna meminta gerak
 *    minimal, elemen langsung tampil pada kondisi akhir tanpa animasi.
 * 3. Konten tetap terbaca tanpa JavaScript: elemen tidak pernah disembunyikan
 *    lewat CSS statis. Penyembunyian hanya dilakukan oleh JS setelah action jalan.
 */
import { animate, inView } from 'motion';

/** True bila pengguna/perangkat meminta pengurangan gerak. */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type RevealOptions = {
	/** Jeda sebelum animasi mulai, dalam milidetik. */
	delay?: number;
	/** Jarak geser awal dalam piksel. */
	distance?: number;
	/** Arah masuk elemen. */
	direction?: 'up' | 'down' | 'left' | 'right' | 'none';
	/** Durasi animasi dalam detik. */
	duration?: number;
	/** Bila true, animasi diputar ulang setiap kali elemen masuk layar. */
	repeat?: boolean;
};

/**
 * Memunculkan elemen saat masuk viewport.
 *
 * Elemen hanya disembunyikan setelah action ini berjalan, jadi bila JavaScript
 * mati konten tetap terlihat penuh.
 */
export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	const { delay = 0, distance = 16, direction = 'up', duration = 0.5, repeat = false } = options;

	if (prefersReducedMotion()) {
		node.style.opacity = '1';
		return { destroy() {} };
	}

	const offset =
		direction === 'up'
			? `translateY(${distance}px)`
			: direction === 'down'
				? `translateY(-${distance}px)`
				: direction === 'left'
					? `translateX(${distance}px)`
					: direction === 'right'
						? `translateX(-${distance}px)`
						: 'none';

	node.style.opacity = '0';
	if (offset !== 'none') node.style.transform = offset;
	node.style.willChange = 'transform, opacity';

	const stop = inView(
		node,
		() => {
			animate(
				node,
				{ opacity: [0, 1], transform: [offset, 'translate(0px, 0px)'] },
				{ duration, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }
			).finished.then(() => {
				// Lepaskan hint GPU supaya tidak menahan memori setelah selesai.
				node.style.willChange = 'auto';
			});
			if (!repeat) stop();
		},
		{ margin: '0px 0px -10% 0px' }
	);

	return {
		destroy() {
			stop();
			node.style.willChange = 'auto';
		}
	};
}

export type CountUpOptions = {
	/** Nilai akhir yang dituju. */
	value: number;
	/** Durasi hitung naik dalam detik. */
	duration?: number;
	/** Pemformat angka; default memakai locale Indonesia. */
	format?: (value: number) => string;
};

/**
 * Menghitung angka naik dari nol saat elemen terlihat.
 *
 * Nilai akhir selalu ditulis persis, sehingga angka yang dibaca pengguna
 * tidak pernah meleset akibat pembulatan animasi.
 */
export function countUp(node: HTMLElement, options: CountUpOptions) {
	const formatDefault = (v: number) => new Intl.NumberFormat('id-ID').format(Math.round(v));
	let current = options;

	const settle = () => {
		const format = current.format ?? formatDefault;
		node.textContent = format(current.value);
	};

	if (prefersReducedMotion() || !Number.isFinite(current.value)) {
		settle();
		return {
			update(next: CountUpOptions) {
				current = next;
				settle();
			},
			destroy() {}
		};
	}

	let stopped = false;
	const run = () => {
		const format = current.format ?? formatDefault;
		const target = current.value;
		const duration = (current.duration ?? 1) * 1000;
		const start = performance.now();

		const tick = (now: number) => {
			if (stopped) return;
			const progress = Math.min(1, (now - start) / duration);
			// easeOutExpo: cepat di awal, melambat di akhir.
			const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
			node.textContent = format(target * eased);
			if (progress < 1) requestAnimationFrame(tick);
			else settle();
		};
		requestAnimationFrame(tick);
	};

	node.textContent = (current.format ?? formatDefault)(0);
	const stop = inView(
		node,
		() => {
			run();
			stop();
		},
		{ margin: '0px 0px -5% 0px' }
	);

	return {
		update(next: CountUpOptions) {
			current = next;
			settle();
		},
		destroy() {
			stopped = true;
			stop();
		}
	};
}

/**
 * Sorotan lembut mengikuti kursor.
 *
 * Hanya memperbarui custom property CSS, jadi tidak memicu re-render Svelte.
 * Dimatikan otomatis pada perangkat sentuh dan saat reduced-motion aktif.
 */
export function spotlight(node: HTMLElement) {
	if (prefersReducedMotion()) return { destroy() {} };
	if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
		return { destroy() {} };
	}

	const onMove = (event: PointerEvent) => {
		const rect = node.getBoundingClientRect();
		node.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
		node.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
	};
	const onLeave = () => node.style.removeProperty('--spot-x');

	node.addEventListener('pointermove', onMove, { passive: true });
	node.addEventListener('pointerleave', onLeave, { passive: true });

	return {
		destroy() {
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', onLeave);
		}
	};
}

/**
 * Menganimasikan penambahan, penghapusan, dan perpindahan anak elemen.
 * Dimuat malas agar tidak menambah beban bundel awal.
 */
export function autoAnimate(node: HTMLElement, enabled = true) {
	if (!enabled || prefersReducedMotion()) return { destroy() {} };

	let cleanup: (() => void) | null = null;
	import('@formkit/auto-animate')
		.then(({ default: init }) => {
			const controller = init(node, { duration: 220, easing: 'ease-out' });
			cleanup = () => controller?.destroy?.();
		})
		.catch(() => {
			/* Animasi bersifat pemanis; kegagalan muat tidak boleh merusak halaman. */
		});

	return {
		destroy() {
			cleanup?.();
		}
	};
}
