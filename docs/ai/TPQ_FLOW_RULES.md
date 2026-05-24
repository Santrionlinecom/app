# TPQ Flow Rules

## Canonical Flow

Jalur TPQ akademik canonical:

1. `/tpq/akademik/setoran`
2. `/tpq/akademik/review`
3. `/tpq/akademik/riwayat`

Dashboard utama `/dashboard` menjadi satu pintu untuk ringkasan TPQ.

## Alias Lama

Alias lama tidak boleh menjadi UI utama:

- `/akademik`
- `/dashboard/setoran-hari-ini`
- `/dashboard/review-setoran`

Alias tersebut harus redirect role-aware atau tidak tampil di navigasi utama.

## Role

- Admin dan koordinator dapat melihat ringkasan lembaga dan review setoran.
- Ustadz/ustadzah dapat input setoran dan melihat riwayat santri yang diampu.
- Santri dan wali hanya melihat data miliknya atau data anak yang sah.
- Superadmin tidak otomatis menjadi scope semua data tanpa boundary yang jelas.

## Data Boundary

- Setoran resmi memakai jalur TPQ akademik.
- Hafalan mandiri/murojaah tidak boleh tercampur sebagai setoran resmi.
- Rapor, sertifikat, dan pencapaian harus konsisten dengan data akademik yang sudah disetujui.
- Agenda TPQ harus org-scoped.
