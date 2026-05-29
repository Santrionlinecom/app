import type { SSEEvent } from '$lib/types/sosmed';

export const encodeSse = (event: SSEEvent['type'], data: unknown) =>
	`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const writeSse = async (
	writer: WritableStreamDefaultWriter<Uint8Array>,
	encoder: TextEncoder,
	event: SSEEvent['type'],
	data: unknown
) => {
	await writer.write(encoder.encode(encodeSse(event, data)));
};
