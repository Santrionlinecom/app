import '../sentry.client.config';
import { handleErrorWithSentry } from '@sentry/sveltekit';

export const handleError = handleErrorWithSentry();
