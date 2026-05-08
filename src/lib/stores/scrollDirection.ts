import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type ScrollDirection = 'up' | 'down' | 'none';

export type ScrollDirectionState = {
	scrollY: number;
	direction: ScrollDirection;
	scrollingDown: boolean;
};

const initialState: ScrollDirectionState = {
	scrollY: 0,
	direction: 'none',
	scrollingDown: false
};

export const createScrollDirectionStore = (threshold = 10) => {
	const { subscribe, set } = writable<ScrollDirectionState>(initialState);
	let cleanup: (() => void) | null = null;
	let currentState = initialState;

	const start = () => {
		if (!browser || cleanup) {
			return cleanup ?? (() => {});
		}

		let lastScrollY = Math.max(0, window.scrollY);

		const publish = (state: ScrollDirectionState) => {
			currentState = state;
			set(state);
		};

		const handleScroll = () => {
			const currentScrollY = Math.max(0, window.scrollY);
			const delta = currentScrollY - lastScrollY;

			if (currentScrollY <= 0) {
				lastScrollY = 0;
				publish({
					scrollY: 0,
					direction: 'up',
					scrollingDown: false
				});
				return;
			}

			if (Math.abs(delta) < threshold) {
				publish({
					...currentState,
					scrollY: currentScrollY,
				});
				return;
			}

			const direction: ScrollDirection = delta > 0 ? 'down' : 'up';
			lastScrollY = currentScrollY;
			publish({
				scrollY: currentScrollY,
				direction,
				scrollingDown: direction === 'down' && currentScrollY > threshold
			});
		};

		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		cleanup = () => {
			window.removeEventListener('scroll', handleScroll);
			cleanup = null;
			currentState = initialState;
			set(initialState);
		};

		return cleanup;
	};

	const stop = () => {
		cleanup?.();
	};

	return {
		subscribe,
		start,
		stop
	};
};

export const scrollDirection = createScrollDirectionStore();
