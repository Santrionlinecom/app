-- Normalize legacy superadmin role alias without separator
PRAGMA foreign_keys = ON;

UPDATE users
SET role = 'SUPER_ADMIN'
WHERE UPPER(REPLACE(REPLACE(TRIM(COALESCE(role, '')), '-', '_'), ' ', '_')) IN ('SUPER_ADMIN', 'SUPERADMIN')
  AND role != 'SUPER_ADMIN';
