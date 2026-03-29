export const selectEarningsRowsByUsernameQuery = `
  SELECT
    c.transaction_id,
    c.timestamp,
    c.payout,
    c.verified,
    c.withdrawn,
    t.amount
  FROM conversions c
  LEFT JOIN transactions t
    ON t.transaction_id = c.transaction_id
  WHERE c.username = ?
  ORDER BY c.timestamp ASC, c.transaction_id ASC
`;
