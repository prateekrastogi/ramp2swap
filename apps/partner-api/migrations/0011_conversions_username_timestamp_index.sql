CREATE INDEX IF NOT EXISTS idx_conversions_username_timestamp_transaction
ON conversions(username, timestamp ASC, transaction_id ASC);
