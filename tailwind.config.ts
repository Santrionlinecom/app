import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {}
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        santri: {
          'primary': '#16a34a', // emerald-600
          'secondary': '#34d399', // emerald-300
          'accent': '#bbf7d0', // emerald-100
          'neutral': '#0f172a',
          'base-100': '#f8fafc',
          'info': '#0ea5e9',
          'success': '#22c55e',
          'warning': '#f59e0b',
          'error': '#ef4444'
        }
      },
      "light"
    ],
    darkTheme: "santri",
    base: true
  }
} as Config;
