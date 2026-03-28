export const MAX_TRANSACTION_FEED_ITEMS = 100;

export const selectConversionTransactionIdsByUsernameQuery = `
  SELECT DISTINCT transaction_id, timestamp
  FROM conversions
  WHERE username = ?
  ORDER BY timestamp DESC, transaction_id DESC
  LIMIT ?
`;

export const buildSelectTransactionsByIdsQuery = (placeholderList: string) => `
  SELECT
    transaction_id,
    status,
    amount,
    from_symbol,
    to_symbol,
    wallet_address,
    timestamp
  FROM transactions
  WHERE transaction_id IN (${placeholderList})
`;
