export const selectSettlementsByUsernameQuery = `
  SELECT
    rowid,
    amount,
    date,
    wallet_address,
    status
  FROM settlements
  WHERE username = ?
  ORDER BY date DESC, rowid DESC
`;
