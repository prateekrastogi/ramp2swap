import Decimal from 'decimal.js';
import {
  insertSettlementRequestQuery,
  selectWithdrawableConversionsByUsernameQuery,
  updateConversionWithdrawnByTransactionIdQuery,
} from '../queries/settlement-request';

const PENDING_WINDOW_MS = 72 * 60 * 60 * 1000;
const MIN_WITHDRAWAL_AMOUNT = new Decimal(10);
const PAYOUT_DECIMAL_PLACES = 8;

type WithdrawableConversionRow = {
  transaction_id: string;
  payout: string | null;
};

const parseDecimal = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new Decimal(value.trim());
    if (!parsed.isFinite() || parsed.isNegative()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const formatAmountForStorage = (amount: Decimal) => {
  const rounded = amount.toDecimalPlaces(PAYOUT_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
  const asText = rounded.toFixed(PAYOUT_DECIMAL_PLACES);
  return asText.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
};

const formatSettlementDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('/');
};

export class WithdrawalRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'WithdrawalRequestError';
    this.status = status;
  }
}

export const requestPartnerSettlement = async (
  db: D1Database,
  {
    username,
    withdrawalAddress,
    now = Date.now(),
  }: {
    username: string;
    withdrawalAddress: string;
    now?: number;
  },
) => {
  const normalizedUsername = username.trim();
  const normalizedWithdrawalAddress = withdrawalAddress.trim();

  if (!normalizedUsername) {
    throw new WithdrawalRequestError('Username is required.', 400);
  }

  if (!normalizedWithdrawalAddress) {
    throw new WithdrawalRequestError('Set a withdrawal address before requesting a withdrawal.', 400);
  }

  const pendingCutoff = now - PENDING_WINDOW_MS;
  const result = await db
    .prepare(selectWithdrawableConversionsByUsernameQuery)
    .bind(normalizedUsername, pendingCutoff)
    .all<WithdrawableConversionRow>();

  const rows = result.results ?? [];
  let total = new Decimal(0);

  for (const row of rows) {
    const payout = parseDecimal(row.payout);
    if (payout) {
      total = total.plus(payout);
    }
  }

  if (total.lt(MIN_WITHDRAWAL_AMOUNT)) {
    throw new WithdrawalRequestError('Available balance must be at least $10.00 to request a withdrawal.', 400);
  }

  const amountText = formatAmountForStorage(total);
  const settlementDate = formatSettlementDate(now);

  const statements = [
    db
      .prepare(insertSettlementRequestQuery)
      .bind(normalizedUsername, amountText, settlementDate, normalizedWithdrawalAddress, 'pending'),
    ...rows.map((row) =>
      db.prepare(updateConversionWithdrawnByTransactionIdQuery).bind(row.transaction_id),
    ),
  ];

  await db.batch(statements);

  return {
    username: normalizedUsername,
    amount: amountText,
    date: settlementDate,
    status: 'pending' as const,
    walletAddress: normalizedWithdrawalAddress,
  };
};
