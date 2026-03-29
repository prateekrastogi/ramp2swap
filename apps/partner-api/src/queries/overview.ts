export const selectClickCountByUsernameAndRangeQuery = `
  SELECT COUNT(*) AS total
  FROM clicks
  WHERE username = ?
    AND timestamp >= ?
    AND timestamp < ?
`;

export const selectConversionAmountRowsByUsernameQuery = `
  SELECT
    c.timestamp,
    t.amount
  FROM conversions c
  LEFT JOIN transactions t
    ON t.transaction_id = c.transaction_id
  WHERE c.username = ?
  ORDER BY c.timestamp ASC, c.transaction_id ASC
`;
