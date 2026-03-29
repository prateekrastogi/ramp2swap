import Decimal from 'decimal.js';
import { selectSettlementsByUsernameQuery } from '../queries/settlements';

type SettlementRow = {
  rowid: number;
  amount: string;
  date: string | null;
  wallet_address: string;
  status: string;
};

export type PartnerSettlementHistoryItem = {
  amount: string;
  status: 'paid' | 'pending';
  destination: string;
  meta: string;
  date: string;
};

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatUsd = (value: string) => {
  try {
    const decimal = new Decimal(value.trim());
    if (!decimal.isFinite()) {
      return '$0.00';
    }

    return USD_FORMATTER.format(Number(decimal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()));
  } catch {
    return '$0.00';
  }
};

const maskWalletAddress = (walletAddress: string) => {
  const trimmed = walletAddress.trim();
  if (!trimmed) {
    return 'Wallet unavailable';
  }

  return `Wallet •••${trimmed.slice(-4).toUpperCase()}`;
};

const normalizeSettlementStatus = (status: string): PartnerSettlementHistoryItem['status'] => {
  const normalized = status.trim().toLowerCase();
  return normalized === 'paid' ? 'paid' : 'pending';
};

const formatSettlementDate = (value: string | null) => {
  if (!value) {
    return '----/--/--';
  }

  const trimmed = value.trim();
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '----/--/--';
  }

  return [
    parsed.getUTCFullYear(),
    String(parsed.getUTCMonth() + 1).padStart(2, '0'),
    String(parsed.getUTCDate()).padStart(2, '0'),
  ].join('/');
};

export const listPartnerSettlements = async (
  db: D1Database,
  {
    username,
  }: {
    username: string;
  },
): Promise<PartnerSettlementHistoryItem[]> => {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    return [];
  }

  const result = await db
    .prepare(selectSettlementsByUsernameQuery)
    .bind(normalizedUsername)
    .all<SettlementRow>();

  return (result.results ?? []).map((row) => ({
    amount: formatUsd(row.amount),
    status: normalizeSettlementStatus(row.status),
    destination: maskWalletAddress(row.wallet_address),
    meta: 'USDC',
    date: formatSettlementDate(row.date),
  }));
};
