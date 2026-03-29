ALTER TABLE conversions
ADD COLUMN verification_attempt_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE conversions
ADD COLUMN verification_last_checked_at INTEGER;
