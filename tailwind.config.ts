import { fontFamily } from 'tailwindcss/defaultTheme';
import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';
import typography from '@tailwindcss/typography';

const config: Config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Plus Jakarta Sans', ...fontFamily.sans],
				display: ['Fraunces', 'Georgia', ...fontFamily.serif],
				arabic: ['Amiri', 'Scheherazade New', ...fontFamily.serif]
			},
			colors: {
				// Palet 2026-08 — samakan dengan santrionline.com (src/routes/layout.css).
				// so-gold hanya untuk teks di latar gelap; di latar terang pakai so-accent-ink.
				'so-green': '#123F34',
				'so-green-2': '#1B5546',
				'so-green-3': '#0C2C25',
				'so-gold': '#FCD34D',
				'so-gold-2': '#FDE68A',
				'so-accent-ink': '#065F46',
				'so-cream': '#F6F7F3',
				'so-surface': '#FFFFFF',
				'so-border': '#E2E5DD',
				'so-muted': '#475569',
				'so-ink': '#0F172A'
			},
			borderRadius: {
				so: '0.75rem',
				'so-lg': '1.5rem'
			},
			boxShadow: {
				soft: '0 18px 60px rgb(18 63 52 / 0.10)',
				card: '0 12px 34px rgb(18 63 52 / 0.08)'
			},
			spacing: {
				13: '3.25rem'
			},
			opacity: {
				6: '0.06',
				8: '0.08',
				14: '0.14',
				15: '0.15',
				18: '0.18',
				24: '0.24',
				65: '0.65',
				67: '0.67',
				78: '0.78',
				86: '0.86',
				92: '0.92'
			}
		}
	},
	plugins: [daisyui, typography]
};

export default config;
