import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { isBusinessAgentServiceAuthorized } from './service-auth.ts';

test('agent service authentication fails closed when disabled or unconfigured', () => {
	assert.equal(
		isBusinessAgentServiceAuthorized({ authorization: 'Bearer synthetic-secret-with-at-least-32-chars', enabled: false, secret: 'synthetic-secret-with-at-least-32-chars' }),
		false
	);
	assert.equal(
		isBusinessAgentServiceAuthorized({ authorization: 'Bearer synthetic-secret-with-at-least-32-chars', enabled: true, secret: undefined }),
		false
	);
});

test('agent service authentication requires exact bearer token', () => {
	assert.equal(
		isBusinessAgentServiceAuthorized({ authorization: 'Bearer synthetic-secret-with-at-least-32-chars', enabled: true, secret: 'synthetic-secret-with-at-least-32-chars' }),
		true
	);
	assert.equal(
		isBusinessAgentServiceAuthorized({ authorization: 'Bearer wrong-secret', enabled: true, secret: 'synthetic-secret-with-at-least-32-chars' }),
		false
	);
});
