CREATE TABLE IF NOT EXISTS clicks (
  event TEXT NOT NULL,
  username TEXT,
  campaign TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clicks_created_at
ON clicks(created_at DESC);
