import Decimal from 'decimal.js';
import { selectEarningsRowsByUsernameQuery } from '../queries/earnings';

const DAY_MS = 24 * 60 * 60 * 1000;
const ROLLING_WINDOW_MS = 30 * DAY_MS;
const PENDING_WINDOW_MS = 72 * 60 * 60 * 1000;
const FIRST_TIER_MAX_VOLUME = new Decimal(100_000);
const SECOND_TIER_MAX_VOLUME = new Decimal(1_000_000);

type EarningsRow = {
  transaction_id: string;
  timestamp: number;
  payout: string | null;
  verified: string | null;
  withdrawn: string | null;
  amount: string | null;
};

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

const formatUsd = (value: Decimal) => USD_FORMATTER.format(Number(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()));

const isTrueFlag = (value: string | null) => value?.trim().toLowerCase() === 'true';

const getCommissionBpsFromPrecedingVolume = (precedingVolume: Decimal) => {
  if (precedingVolume.lt(FIRST_TIER_MAX_VOLUME)) {
    return 15;
  }

  if (precedingVolume.lt(SECOND_TIER_MAX_VOLUME)) {
    return 20;
  }

  return 25;
};

export const getPartnerEarningsSummary = async (
  db: D1Database,
  {
    username,
    now = Date.now(),
  }: {
    username: string;
    now?: number;
  },
) => {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    return {
      username: normalizedUsername,
      currentCommissionBps: 15,
      currentBalance: '$0.00',
      pendingBalance: '$0.00',
      availableBalance: '$0.00',
      totalEarnings: '$0.00',
    };
  }

  const result = await db
    .prepare(selectEarningsRowsByUsernameQuery)
    .bind(normalizedUsername)
    .all<EarningsRow>();

  const rows = result.results ?? [];
  const pendingCutoff = now - PENDING_WINDOW_MS;
  const rollingWindowCutoff = now - ROLLING_WINDOW_MS;

  let totalEarnings = new Decimal(0);
  let pendingBalance = new Decimal(0);
  let availableBalance = new Decimal(0);
  let currentRollingVolume = new Decimal(0);

  for (const row of rows) {
    const payout = parseDecimal(row.payout);
    if (payout) {
      if (row.timestamp >= pendingCutoff) {
        pendingBalance = pendingBalance.plus(payout);
      } else {
        if (isTrueFlag(row.verified)) {
          totalEarnings = totalEarnings.plus(payout);
        }

        if (isTrueFlag(row.verified) && !isTrueFlag(row.withdrawn)) {
          availableBalance = availableBalance.plus(payout);
        }
      }
    }

    if (row.timestamp >= rollingWindowCutoff) {
      const amount = parseDecimal(row.amount);
      if (amount) {
        currentRollingVolume = currentRollingVolume.plus(amount);
      }
    }
  }

  return {
    username: normalizedUsername,
    currentCommissionBps: getCommissionBpsFromPrecedingVolume(currentRollingVolume),
    currentBalance: formatUsd(pendingBalance.plus(availableBalance)),
    pendingBalance: formatUsd(pendingBalance),
    availableBalance: formatUsd(availableBalance),
    totalEarnings: formatUsd(totalEarnings),
  };
};
