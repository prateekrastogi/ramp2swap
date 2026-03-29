export const selectPendingConversionVerificationQuery = `
  SELECT
    transaction_id,
    verified,
    verification_attempt_count,
    verification_last_checked_at
  FROM conversions
  WHERE timestamp <= ?
    AND (
      verified IS NULL
      OR (
        LOWER(TRIM(COALESCE(verified, ''))) = 'false'
        AND verification_attempt_count < ?
        AND (
          verification_last_checked_at IS NULL
          OR verification_last_checked_at <= ?
        )
      )
    )
  ORDER BY timestamp ASC, transaction_id ASC
`;

export const selectTransactionVerificationStatusQuery = `
  SELECT status
  FROM transactions
  WHERE transaction_id = ?
  LIMIT 1
`;

export const updateConversionVerificationStateQuery = `
  UPDATE conversions
  SET
    verified = ?,
    verification_attempt_count = ?,
    verification_last_checked_at = ?
  WHERE transaction_id = ?
`;
