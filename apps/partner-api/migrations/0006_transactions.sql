CREATE TABLE IF NOT EXISTS transactions (
  transaction_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  amount TEXT,
  from_symbol TEXT,
  to_symbol TEXT,
  wallet_address TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_updated_at
ON transactions(updated_at DESC);
