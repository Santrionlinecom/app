# Unified Digital Product Licensing

Canonical API for desktop products (SantriPrint, SantriOCR, Santri Cleaner, Santri Subtitle, Santri Studio):

```text
POST /api/licenses/activate
POST /api/licenses/verify
POST /api/licenses/deactivate
```

Admin:

```text
/admin/licenses/generate   → buat key (plaintext once)
/admin/licenses/manage     → daftar, revoke, reactivate, reset device, expiry, search
/admin/licenses            → portal streamer LEGACY (bukan digital product)
```

## Products (slug)

| slug | name |
|---|---|
| `santriprint-pro` | SantriPrint Pro |
| `santri-ocr-pro` | SantriOCR Pro |
| `santri-cleaner-pro` | Santri Cleaner Pro |
| `santri-subtitle-pro` | Santri Subtitle Pro |
| `santri-studio-pro` | Santri Studio Pro (existing) |
| `santri-cleaner-free` / `santri-studio-free` | free tiers |

Migration seed: `migrations/0056_digital_license_catalog_expand.sql`.

## Key storage rule

- Generate stores **internal id** in `licenses.license_key` (e.g. `lic_<uuid>`).
- Lookup uses `licenses.license_key_hash` (HMAC-SHA256 with `LICENSE_KEY_HASH_SECRET`).
- Plaintext key is shown **once** at generate time and must not be re-readable from admin UI.
- Legacy rows may still have old plaintext-as-PK; do not invent migration that breaks existing activations without a planned cutover.

## Client contract (activate/verify/deactivate)

```json
{
  "licenseKey": "SP-PRO-XXXX-XXXX-XXXX",
  "deviceHash": "stable-device-fingerprint",
  "productSlug": "santriprint-pro",
  "deviceName": "Dell Latitude",
  "appVersion": "1.0.0"
}
```

Snake_case aliases accepted: `license_key`, `device_hash`, `product_slug`, `device_name`, `app_version`.

Response shape:

```json
{ "status": "active|not_found|revoked|expired|device_limit_reached|...", "plan": "pro", "expiresAt": null, "features": ["..."] }
```

## Desktop hardening (Rust/Tauri) — required before public sale

Do **not** store unlock state as editable JSON in `localStorage` with fields like `active`, `features`, `verifiedAt`.

Recommended local store (Tauri/Rust):

1. Persist **encrypted blob** via OS keyring / app data with machine-bound key material.
2. Store only: `license_key` (or secure ref), `device_hash`, `product_slug`, `last_verify_at`, `last_status`, `grace_until`.
3. Feature flags and plan must be re-derived from last successful **server** verify payload, signed/HMAC’d locally if cached.
4. Online verify on launch + periodic (e.g. every 12–24h).
5. Offline grace: max 72 hours (product policy) after last successful verify; then lock pro features.
6. On `revoked` / `expired` / `device_limit_reached`: clear pro features immediately.
7. Move validation helpers to Rust commands; Svelte only displays state returned by Rust.

## Launch order

1. Harden one license system (this doc).
2. Launch **SantriPrint** first.
3. Then **SantriOCR**.
4. Do not revive all archives at once.

## E2E checklist

```text
generate → D1 row (hash only) → activate → verify → device limit
→ deactivate → revoke → expired → offline grace (client)
```

Unit coverage: `src/lib/server/domains/digital-store/licenses/license-lifecycle.test.ts`.
