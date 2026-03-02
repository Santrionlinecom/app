-- Migration: store plaintext streamer key for admin copy workflow
PRAGMA foreign_keys = ON;

ALTER TABLE streamer_licenses
ADD COLUMN license_key_plain TEXT NULL;
