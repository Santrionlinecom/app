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
				'so-green': '#1B4332',
				'so-green-2': '#2D6A4F',
				'so-green-3': '#0F2F24',
				'so-gold': '#C9A84C',
				'so-gold-2': '#E8C97A',
				'so-cream': '#FAF8F3',
				'so-surface': '#FFFFFF',
				'so-border': '#E8E4DC',
				'so-muted': '#6B7280',
				'so-ink': '#1A1A1A'
			},
			borderRadius: {
				so: '12px',
				'so-lg': '20px'
			},
			boxShadow: {
				soft: '0 18px 60px rgb(27 67 50 / 0.10)',
				card: '0 12px 34px rgb(27 67 50 / 0.08)'
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
