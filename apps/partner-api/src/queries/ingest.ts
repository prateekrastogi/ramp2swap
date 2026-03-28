export const upsertTransactionQuery = `
  INSERT INTO transactions (
    transaction_id,
    status,
    amount,
    from_symbol,
    to_symbol,
    wallet_address,
    timestamp,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(transaction_id) DO UPDATE SET
    status = excluded.status,
    amount = excluded.amount,
    from_symbol = excluded.from_symbol,
    to_symbol = excluded.to_symbol,
    wallet_address = excluded.wallet_address,
    timestamp = excluded.timestamp,
    updated_at = excluded.updated_at
`;

export const insertClickQuery = `
  INSERT INTO clicks (
    event,
    username,
    campaign,
    country,
    timestamp,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?)
`;

export const upsertConversionQuery = `
  INSERT INTO conversions (
    transaction_id,
    event,
    username,
    campaign,
    country,
    timestamp,
    payout
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(transaction_id) DO UPDATE SET
    event = excluded.event,
    username = excluded.username,
    campaign = excluded.campaign,
    country = excluded.country,
    timestamp = excluded.timestamp,
    payout = excluded.payout
`;
