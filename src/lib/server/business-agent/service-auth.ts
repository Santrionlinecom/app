type BusinessAgentServiceAuthInput = {
	authorization?: string | null;
	enabled: boolean;
	secret?: string | null;
};

const constantTimeEqual = (left: string, right: string) => {
	if (left.length !== right.length) return false;
	let mismatch = 0;
	for (let index = 0; index < left.length; index += 1) {
		mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
	}
	return mismatch === 0;
};

export const isBusinessAgentServiceAuthorized = ({
	authorization,
	enabled,
	secret
}: BusinessAgentServiceAuthInput) => {
	if (!enabled || !secret || secret.length < 32 || !authorization?.startsWith('Bearer ')) return false;
	const presented = authorization.slice('Bearer '.length);
	return constantTimeEqual(presented, secret);
};
