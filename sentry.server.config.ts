// Cloudflare runtime initialization is wired in src/hooks.server.ts.
export const sentryServerConfig = {
	dsn: import.meta.env.PUBLIC_SENTRY_DSN,
	enabled: import.meta.env.PROD,
	tracesSampleRate: 0.1
};
