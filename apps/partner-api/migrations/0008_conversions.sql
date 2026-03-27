CREATE TABLE IF NOT EXISTS conversions (
  transaction_id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  username TEXT,
  campaign TEXT,
  timestamp INTEGER NOT NULL,
  payout TEXT
);

CREATE INDEX IF NOT EXISTS idx_conversions_timestamp
ON conversions(timestamp DESC);
