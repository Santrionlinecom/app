-- Langganan Web Push (PWA).
--
-- Satu pengguna bisa punya beberapa langganan: HP, tablet, laptop. Endpoint
-- adalah identitas unik dari push service, jadi dijadikan primary key.
--
-- Kolom p256dh dan auth adalah kunci enkripsi milik browser penerima
-- (RFC 8291). Tanpa keduanya payload tidak bisa dienkripsi.
--
-- failure_count dipakai untuk membersihkan langganan mati: push service
-- membalas 404/410 ketika pengguna menghapus PWA atau menolak izin.

CREATE TABLE IF NOT EXISTS push_subscriptions (
	endpoint TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	p256dh TEXT NOT NULL,
	auth TEXT NOT NULL,
	user_agent TEXT,
	failure_count INTEGER NOT NULL DEFAULT 0,
	last_error_code TEXT,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL,
	last_success_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
	ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_failure
	ON push_subscriptions(failure_count, updated_at);
