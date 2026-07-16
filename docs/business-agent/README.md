# SantriOnline Business Agent

Fondasi workflow bisnis untuk alur lead, discovery, quote, approval, order, pembayaran, dan lisensi.

## Prinsip keamanan

- D1 adalah system of record.
- Hermes bertindak sebagai maker (`hermes-business-agent`); Super Admin bertindak sebagai checker.
- Maker tidak dapat menyetujui request miliknya sendiri.
- Approval terikat ke SHA-256 payload quote dan memiliki masa kedaluwarsa.
- Midtrans adalah satu-satunya authority untuk status pembayaran.
- Audit event bersifat append-only melalui trigger D1.
- Side effect produksi tetap fail-closed melalui feature flag dan kill switch.

## Komponen yang aktif pada MVP

- State machine lead, quote, order, dan lisensi.
- Lead dan quote repository.
- Maker-checker quote approval.
- Order creation setelah approval.
- Audit event dan state transition.
- Idempotency table dan agent job queue.
- Super Admin API.
- Internal Hermes API dengan Bearer service token.

## Endpoint

### Super Admin

- `GET|POST /api/admin/business-agent/leads`
- `POST /api/admin/business-agent/leads/:id/transition`
- `GET|POST /api/admin/business-agent/quotes`
- `POST /api/admin/business-agent/quotes/:id/request-approval`
- `GET /api/admin/business-agent/approvals`
- `POST /api/admin/business-agent/approvals/:id`

### Hermes service identity

- `POST /api/internal/business-agent`

Setiap request wajib membawa:

- `Authorization: Bearer [REDACTED]`
- `Idempotency-Key: <opaque-identifier-16-128-karakter>`

Idempotency key terikat ke SHA-256 payload. Replay payload yang sama mengembalikan hasil lama; pemakaian key yang sama untuk payload berbeda ditolak.

Action yang tersedia:

- `create_lead`
- `transition_lead`
- `create_quote`
- `request_quote_approval`

## Aktivasi Hermes API

Default deployment adalah nonaktif.

1. Buat secret acak minimal 32 karakter.
2. Simpan sebagai Cloudflare Pages secret `BUSINESS_AGENT_SERVICE_TOKEN`.
3. Simpan token yang sama pada secret store Hermes, jangan di file proyek atau Obsidian.
4. Ubah `BUSINESS_AGENT_AGENT_API_ENABLED` menjadi `true` hanya setelah smoke test.
5. Jangan membuka kill switch `midtrans_invoice`, `telegram_approval`, atau `license_activation` pada fase ini.

## Kill switch awal

| Scope | Default |
|---|---|
| `global` | OFF — workflow internal diperbolehkan |
| `midtrans_invoice` | ON — tidak boleh membuat invoice |
| `telegram_approval` | ON — belum mengirim approval Telegram |
| `license_activation` | ON — belum mengaktifkan lisensi |

## Gate verifikasi

```bash
npm run test:business-agent
npm run test:payments
npm run check
npm run build
```

Migration:

```bash
npx wrangler d1 execute DB --remote --file=migrations/0049_business_agent.sql
```

## Batas MVP

Belum termasuk pembuatan invoice Midtrans, Telegram inline approval, R2 proposal, atau aktivasi lisensi. Komponen tersebut harus ditambahkan bertahap dengan sandbox, webhook idempotent, dan review keamanan sebelum kill switch dibuka.
