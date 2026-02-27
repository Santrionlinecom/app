-- Normalize legacy super admin role casing
PRAGMA foreign_keys = ON;

UPDATE users
SET role = 'SUPER_ADMIN'
WHERE UPPER(REPLACE(TRIM(COALESCE(role, '')), '-', '_')) = 'SUPER_ADMIN'
  AND role != 'SUPER_ADMIN';
