CREATE TABLE IF NOT EXISTS settlements (
  username TEXT NOT NULL,
  amount TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_settlements_username
ON settlements(username);
