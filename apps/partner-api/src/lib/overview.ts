import Decimal from 'decimal.js';
import { getPartnerEarningsSummary } from './earnings';
import {
  selectClickCountByUsernameAndRangeQuery,
  selectConversionAmountRowsByUsernameQuery,
} from '../queries/overview';

const DAY_MS = 24 * 60 * 60 * 1000;
const CURRENT_PERIOD_MS = 30 * DAY_MS;
const PRIOR_PERIOD_MS = 60 * DAY_MS;

type CountRow = {
  total: number | string;
};

type ConversionAmountRow = {
  timestamp: number;
  amount: string | null;
};

export type OverviewMetricSummary = {
  id: 'total-clicks' | 'conversions' | 'volume-driven' | 'commission-balance';
  label: string;
  value: string;
  detail: string;
  delta: string;
  accent?: 'mint';
};

type OverviewSummary = {
  username: string;
  metrics: OverviewMetricSummary[];
};

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const COMPACT_USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0) || 0;

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

const formatCount = (value: number) => COUNT_FORMATTER.format(value);

const formatUsdCompact = (value: Decimal) =>
  COMPACT_USD_FORMATTER.format(Number(value.toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toString()));

const formatDeltaPercentage = (current: Decimal, prior: Decimal) => {
  if (prior.eq(0)) {
    if (current.eq(0)) {
      return '0.0% vs prior period';
    }

    return '+100.0% vs prior period';
  }

  const pct = current.minus(prior).div(prior).mul(100);
  const rounded = pct.toDecimalPlaces(1, Decimal.ROUND_HALF_UP);
  const sign = rounded.gte(0) ? '+' : '';
  return `${sign}${rounded.toFixed(1)}% vs prior period`;
};

const isInRange = (timestamp: number, start: number, end: number) =>
  timestamp >= start && timestamp < end;

const queryCountForRange = async (
  db: D1Database,
  username: string,
  start: number,
  end: number,
) => {
  const row = await db
    .prepare(selectClickCountByUsernameAndRangeQuery)
    .bind(username, start, end)
    .first<CountRow>();

  return toNumber(row?.total);
};

export const getPartnerOverviewSummary = async (
  db: D1Database,
  {
    username,
    now = Date.now(),
  }: {
    username: string;
    now?: number;
  },
): Promise<OverviewSummary> => {
  const normalizedUsername = username.trim();
  const currentPeriodStart = now - CURRENT_PERIOD_MS;
  const priorPeriodStart = now - PRIOR_PERIOD_MS;
  const rangeEnd = now + 1;

  const [currentClicks, priorClicks, conversionRows, earningsSummary] = await Promise.all([
    queryCountForRange(db, normalizedUsername, currentPeriodStart, rangeEnd),
    queryCountForRange(db, normalizedUsername, priorPeriodStart, currentPeriodStart),
    db
      .prepare(selectConversionAmountRowsByUsernameQuery)
      .bind(normalizedUsername)
      .all<ConversionAmountRow>()
      .then((result) => result.results ?? []),
    getPartnerEarningsSummary(db, { username: normalizedUsername, now }),
  ]);

  let currentConversions = 0;
  let priorConversions = 0;
  let currentVolume = new Decimal(0);
  let priorVolume = new Decimal(0);

  for (const row of conversionRows) {
    const amount = parseDecimal(row.amount);

    if (isInRange(row.timestamp, currentPeriodStart, rangeEnd)) {
      currentConversions += 1;
      if (amount) {
        currentVolume = currentVolume.plus(amount);
      }
      continue;
    }

    if (isInRange(row.timestamp, priorPeriodStart, currentPeriodStart)) {
      priorConversions += 1;
      if (amount) {
        priorVolume = priorVolume.plus(amount);
      }
    }
  }

  return {
    username: normalizedUsername,
    metrics: [
      {
        id: 'total-clicks',
        label: 'Total Clicks',
        value: formatCount(currentClicks),
        detail: 'Last 30 days across all referral links',
        delta: formatDeltaPercentage(new Decimal(currentClicks), new Decimal(priorClicks)),
      },
      {
        id: 'conversions',
        label: 'Conversions',
        value: formatCount(currentConversions),
        detail: 'Completed ramp transactions attributed',
        delta: formatDeltaPercentage(new Decimal(currentConversions), new Decimal(priorConversions)),
      },
      {
        id: 'volume-driven',
        label: 'Volume Driven',
        value: formatUsdCompact(currentVolume),
        detail: 'Total partner-driven fiat to crypto volume',
        delta: formatDeltaPercentage(currentVolume, priorVolume),
      },
      {
        id: 'commission-balance',
        label: 'Commission Balance',
        value: earningsSummary.currentBalance,
        detail: 'Available plus pending commission earnings',
        delta: `${earningsSummary.availableBalance} available now`,
        accent: 'mint',
      },
    ],
  };
};
