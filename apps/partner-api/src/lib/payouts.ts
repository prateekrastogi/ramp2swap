import Decimal from 'decimal.js';
import {
  selectConversionPayoutInputsByUsernameQuery,
  selectConversionUsernamesByTransactionIdQuery,
  selectUsernamesWithNullPayoutsQuery,
  updateConversionPayoutQuery,
} from '../queries/payouts';

const DAY_MS = 24 * 60 * 60 * 1000;
const ROLLING_WINDOW_DAYS = 30;
const ROLLING_WINDOW_MS = ROLLING_WINDOW_DAYS * DAY_MS;

const FIRST_TIER_MAX_VOLUME = new Decimal(100_000);
const SECOND_TIER_MAX_VOLUME = new Decimal(1_000_000);
const FIRST_TIER_RATE = new Decimal(15).div(10_000);
const SECOND_TIER_RATE = new Decimal(20).div(10_000);
const THIRD_TIER_RATE = new Decimal(25).div(10_000);
const PAYOUT_DECIMAL_PLACES = 8;

type ConversionPayoutInputRow = {
  transaction_id: string;
  timestamp: number;
  amount: string | null;
};

type ConversionUsernameRow = {
  username: string | null;
};

type RollingVolumeEntry = {
  timestamp: number;
  amount: Decimal;
};

const normalizeUsername = (username: string) => username.trim();

const parseAmountDecimal = (amount: string | null) => {
  if (!amount) {
    return null;
  }

  try {
    const parsed = new Decimal(amount.trim());
    if (!parsed.isFinite() || parsed.isNegative()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const getCommissionRateFromPrecedingVolume = (precedingVolume: Decimal) => {
  if (precedingVolume.lt(FIRST_TIER_MAX_VOLUME)) {
    return FIRST_TIER_RATE;
  }

  if (precedingVolume.lt(SECOND_TIER_MAX_VOLUME)) {
    return SECOND_TIER_RATE;
  }

  return THIRD_TIER_RATE;
};

const formatPayoutForStorage = (amount: Decimal) => {
  const rounded = amount.toDecimalPlaces(PAYOUT_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
  const asText = rounded.toFixed(PAYOUT_DECIMAL_PLACES);
  return asText.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
};

const dedupeUsernames = (usernames: Array<string | null | undefined>) =>
  [...new Set(usernames.map((username) => username?.trim() ?? '').filter(Boolean))];

export const recalculateConversionPayoutsForUsername = async (
  db: D1Database,
  username: string,
) => {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return;
  }

  const result = await db
    .prepare(selectConversionPayoutInputsByUsernameQuery)
    .bind(normalizedUsername)
    .all<ConversionPayoutInputRow>();

  const rows = result.results ?? [];
  if (rows.length === 0) {
    return;
  }

  const rollingWindow: RollingVolumeEntry[] = [];
  let rollingVolume = new Decimal(0);

  const statements = rows.map((row) => {
    const windowStart = row.timestamp - ROLLING_WINDOW_MS;

    while (rollingWindow.length > 0 && rollingWindow[0].timestamp < windowStart) {
      const expired = rollingWindow.shift();
      if (expired) {
        rollingVolume = rollingVolume.minus(expired.amount);
      }
    }

    const amount = parseAmountDecimal(row.amount);
    let payout: string | null = null;

    if (amount) {
      payout = formatPayoutForStorage(
        amount.mul(getCommissionRateFromPrecedingVolume(rollingVolume)),
      );
      rollingWindow.push({
        timestamp: row.timestamp,
        amount,
      });
      rollingVolume = rollingVolume.plus(amount);
    }

    return db.prepare(updateConversionPayoutQuery).bind(payout, row.transaction_id);
  });

  await db.batch(statements);
};

export const recalculateConversionPayoutsForTransaction = async (
  db: D1Database,
  transactionId: string,
) => {
  const normalizedTransactionId = transactionId.trim();
  if (!normalizedTransactionId) {
    return;
  }

  const result = await db
    .prepare(selectConversionUsernamesByTransactionIdQuery)
    .bind(normalizedTransactionId)
    .all<ConversionUsernameRow>();

  const usernames = dedupeUsernames((result.results ?? []).map((row) => row.username));
  await Promise.all(
    usernames.map((username) => recalculateConversionPayoutsForUsername(db, username)),
  );
};

export const backfillMissingConversionPayouts = async (db: D1Database) => {
  const result = await db.prepare(selectUsernamesWithNullPayoutsQuery).all<ConversionUsernameRow>();
  const usernames = dedupeUsernames((result.results ?? []).map((row) => row.username));

  await Promise.all(
    usernames.map((username) => recalculateConversionPayoutsForUsername(db, username)),
  );
};
