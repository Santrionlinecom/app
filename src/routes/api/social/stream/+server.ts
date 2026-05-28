import type { RequestHandler } from './$types';
import { listSocialPosts, requireSocialContext } from '$lib/server/social';

const encoder = new TextEncoder();

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const context = requireSocialContext(locals);
	if (!context.ok) return context.error;

	let lastSeen = url.searchParams.get('after') || new Date().toISOString();

	const stream = new ReadableStream({
		start(controller) {
			const send = (payload: unknown) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
			};

			const poll = async () => {
				try {
					const posts = await listSocialPosts(context.db, context.user, {
						limit: 20,
						after: lastSeen
					});

					if (posts.length > 0) {
						lastSeen = posts.reduce(
							(latest, post) => (post.created_at > latest ? post.created_at : latest),
							lastSeen
						);
						send({ type: 'new_posts', posts });
					} else {
						controller.enqueue(encoder.encode(': keep-alive\n\n'));
					}
				} catch (err) {
					console.error('GET /api/social/stream poll error', err);
					send({ type: 'error', message: 'Stream sosial sementara bermasalah' });
				}
			};

			const interval = setInterval(poll, 4000);
			void poll();

			request.signal.addEventListener(
				'abort',
				() => {
					clearInterval(interval);
					try {
						controller.close();
					} catch {
						// Stream may already be closed by the runtime.
					}
				},
				{ once: true }
			);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
