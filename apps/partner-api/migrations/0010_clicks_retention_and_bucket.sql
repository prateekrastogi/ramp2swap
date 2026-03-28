ALTER TABLE clicks
ADD COLUMN week_bucket_start INTEGER;

UPDATE clicks
SET week_bucket_start = CAST(timestamp / 604800000 AS INTEGER) * 604800000
WHERE week_bucket_start IS NULL;

DELETE FROM clicks
WHERE timestamp < (strftime('%s', 'now') * 1000) - 7862400000;

CREATE INDEX IF NOT EXISTS idx_clicks_timestamp
ON clicks(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_clicks_week_bucket_timestamp
ON clicks(week_bucket_start, timestamp DESC);
