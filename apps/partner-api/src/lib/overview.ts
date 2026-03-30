import Decimal from 'decimal.js';
import { getPartnerEarningsSummary } from './earnings';
import {
  selectClickCountByUsernameAndRangeQuery,
  selectConversionAmountRowsByUsernameQuery,
  selectOldestClickTimestampByUsernameQuery,
  selectOldestConversionTimestampByUsernameQuery,
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

type TimestampRow = {
  timestamp: number | string | null;
};

export type OverviewMetricSummary = {
  id: 'total-clicks' | 'conversions' | 'volume-driven' | 'commission-balance';
  label: string;
  value: string;
  detail: string;
  delta: string | null;
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

const parseUsdDecimal = (value: string | null | undefined) => {
  if (!value) {
    return new Decimal(0);
  }

  const normalized = value.replace(/[^0-9.-]/g, '');
  if (!normalized) {
    return new Decimal(0);
  }

  try {
    const parsed = new Decimal(normalized);
    if (!parsed.isFinite()) {
      return new Decimal(0);
    }

    return parsed;
  } catch {
    return new Decimal(0);
  }
};

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

const hasFullPriorPeriodData = (oldestTimestamp: number | null, priorPeriodStart: number) =>
  oldestTimestamp !== null && oldestTimestamp <= priorPeriodStart;

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

  const [
    currentClicks,
    priorClicks,
    oldestClickTimestampRow,
    oldestConversionTimestampRow,
    conversionRows,
    earningsSummary,
  ] = await Promise.all([
    queryCountForRange(db, normalizedUsername, currentPeriodStart, rangeEnd),
    queryCountForRange(db, normalizedUsername, priorPeriodStart, currentPeriodStart),
    db
      .prepare(selectOldestClickTimestampByUsernameQuery)
      .bind(normalizedUsername)
      .first<TimestampRow>(),
    db
      .prepare(selectOldestConversionTimestampByUsernameQuery)
      .bind(normalizedUsername)
      .first<TimestampRow>(),
    db
      .prepare(selectConversionAmountRowsByUsernameQuery)
      .bind(normalizedUsername)
      .all<ConversionAmountRow>()
      .then((result) => result.results ?? []),
    getPartnerEarningsSummary(db, { username: normalizedUsername, now }),
  ]);

  const oldestClickTimestamp =
    oldestClickTimestampRow?.timestamp == null ? null : toNumber(oldestClickTimestampRow.timestamp);
  const oldestConversionTimestamp =
    oldestConversionTimestampRow?.timestamp == null
      ? null
      : toNumber(oldestConversionTimestampRow.timestamp);
  const canShowClicksDelta = hasFullPriorPeriodData(oldestClickTimestamp, priorPeriodStart);
  const canShowConversionsDelta = hasFullPriorPeriodData(oldestConversionTimestamp, priorPeriodStart);
  const pendingBalance = parseUsdDecimal(earningsSummary.pendingBalance);
  const availableBalance = parseUsdDecimal(earningsSummary.availableBalance);
  const hasCommissionBalance = pendingBalance.gt(0) || availableBalance.gt(0);

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
      ...(currentClicks > 0
        ? [
            {
              id: 'total-clicks' as const,
              label: 'Total Clicks',
              value: formatCount(currentClicks),
              detail: 'Last 30 days across all referral links',
              delta: canShowClicksDelta
                ? formatDeltaPercentage(new Decimal(currentClicks), new Decimal(priorClicks))
                : null,
            },
          ]
        : []),
      ...(currentConversions > 0
        ? [
            {
              id: 'conversions' as const,
              label: 'Conversions',
              value: formatCount(currentConversions),
              detail: 'Completed ramp transactions attributed',
              delta: canShowConversionsDelta
                ? formatDeltaPercentage(new Decimal(currentConversions), new Decimal(priorConversions))
                : null,
            },
          ]
        : []),
      ...(currentVolume.gt(0)
        ? [
            {
              id: 'volume-driven' as const,
              label: 'Volume Driven',
              value: formatUsdCompact(currentVolume),
              detail: 'Total partner-driven fiat to crypto volume',
              delta: canShowConversionsDelta ? formatDeltaPercentage(currentVolume, priorVolume) : null,
            },
          ]
        : []),
      ...(hasCommissionBalance
        ? [
            {
              id: 'commission-balance' as const,
              label: 'Commission Balance',
              value: earningsSummary.currentBalance,
              detail: 'Available plus pending commission earnings',
              delta: `${earningsSummary.availableBalance} available now`,
              accent: 'mint' as const,
            },
          ]
        : []),
    ],
  };
};
