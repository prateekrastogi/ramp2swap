export const selectWithdrawableConversionsByUsernameQuery = `
  SELECT
    transaction_id,
    payout
  FROM conversions
  WHERE username = ?
    AND timestamp < ?
    AND LOWER(TRIM(COALESCE(verified, ''))) = 'true'
    AND LOWER(TRIM(COALESCE(withdrawn, 'false'))) <> 'true'
    AND payout IS NOT NULL
  ORDER BY timestamp ASC, transaction_id ASC
`;

export const insertSettlementRequestQuery = `
  INSERT INTO settlements (
    username,
    amount,
    date,
    wallet_address,
    status
  )
  VALUES (?, ?, ?, ?, ?)
`;

export const updateConversionWithdrawnByTransactionIdQuery = `
  UPDATE conversions
  SET withdrawn = 'true'
  WHERE transaction_id = ?
`;
