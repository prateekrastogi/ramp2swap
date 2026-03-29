export const selectConversionPayoutInputsByUsernameQuery = `
  SELECT
    c.transaction_id,
    c.timestamp,
    t.amount
  FROM conversions c
  LEFT JOIN transactions t
    ON t.transaction_id = c.transaction_id
  WHERE c.username = ?
  ORDER BY c.timestamp ASC, c.transaction_id ASC
`;

export const selectConversionUsernamesByTransactionIdQuery = `
  SELECT DISTINCT username
  FROM conversions
  WHERE transaction_id = ?
    AND username IS NOT NULL
    AND TRIM(username) <> ''
`;

export const selectUsernamesWithNullPayoutsQuery = `
  SELECT DISTINCT username
  FROM conversions
  WHERE payout IS NULL
    AND username IS NOT NULL
    AND TRIM(username) <> ''
`;

export const updateConversionPayoutQuery = `
  UPDATE conversions
  SET payout = ?
  WHERE transaction_id = ?
`;
