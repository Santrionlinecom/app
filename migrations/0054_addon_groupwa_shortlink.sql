-- Ensure official WhatsApp group shortlink for addon onboarding exists.
-- Keep target_url editable via Super Admin shortlinks UI without code deploy.

INSERT OR IGNORE INTO short_links (
  slug,
  title,
  description,
  target_url,
  category,
  notes,
  is_active,
  created_by
)
VALUES (
  'groupwa',
  'Grup WhatsApp SantriOnline',
  'Link resmi grup WhatsApp untuk konfirmasi addon dan pendampingan lembaga.',
  'https://chat.whatsapp.com/FCg7ldImBU4DcH1OgaMxkO',
  'internal_app',
  'Dipakai di /addon sebagai /r/groupwa. Update target_url di shortlinks admin bila invite link berubah.',
  1,
  'system'
);

UPDATE short_links
SET
  title = 'Grup WhatsApp SantriOnline',
  description = 'Link resmi grup WhatsApp untuk konfirmasi addon dan pendampingan lembaga.',
  category = 'internal_app',
  notes = 'Dipakai di /addon sebagai /r/groupwa. Update target_url di shortlinks admin bila invite link berubah.',
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'groupwa';
