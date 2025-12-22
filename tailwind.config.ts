import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			fontFamily: {
				sans: [...fontFamily.sans]
			}
		},
	},
	plugins: [daisyui],
};

export default config;
