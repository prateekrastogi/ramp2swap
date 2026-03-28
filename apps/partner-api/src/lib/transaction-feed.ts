import {
  createDeterministicUppercaseCode,
  createHumanReadableDeterministicCode,
} from './deterministic-codes';
import {
  buildSelectTransactionsByIdsQuery,
  MAX_TRANSACTION_FEED_ITEMS,
  selectConversionTransactionIdsByUsernameQuery,
} from '../queries/transaction-feed';

type ConversionReferenceRow = {
  transaction_id: string;
  timestamp: number;
};

type TransactionRow = {
  transaction_id: string;
  status: string;
  amount: string | null;
  from_symbol: string | null;
  to_symbol: string | null;
  wallet_address: string | null;
  timestamp: number;
};

export type PartnerTransactionFeedItem = {
  id: string;
  status: 'completed' | 'pending' | 'failed';
  amount: string;
  pair: string;
  timestamp: string;
  user: string;
};

const normalizeTransactionStatus = (status: string): PartnerTransactionFeedItem['status'] => {
  const normalizedStatus = status.trim().toLowerCase();

  if (
    normalizedStatus === 'completed' ||
    normalizedStatus === 'complete' ||
    normalizedStatus === 'success' ||
    normalizedStatus === 'succeeded'
  ) {
    return 'completed';
  }

  if (
    normalizedStatus === 'failed' ||
    normalizedStatus === 'failure' ||
    normalizedStatus === 'error' ||
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'canceled'
  ) {
    return 'failed';
  }

  return 'pending';
};

const formatUtcTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
};

const formatPair = (fromSymbol: string | null, toSymbol: string | null) => {
  const left = fromSymbol?.trim() || '--';
  const right = toSymbol?.trim() || '--';
  return `${left} -> ${right}`;
};

const formatAmount = (amount: string | null) => amount?.trim() || '--';

const buildTransactionCode = async (secret: string, transactionId: string) => {
  const code = await createDeterministicUppercaseCode(secret, 'transaction', transactionId, 8);
  return `TX-${code}`;
};

const buildUserCode = async (secret: string, walletAddress: string) => {
  const code = await createHumanReadableDeterministicCode(secret, 'wallet', walletAddress, 6);
  return `usr_${code}`;
};

export const listPartnerTransactionFeed = async (
  db: D1Database,
  {
    username,
    secret,
    limit = MAX_TRANSACTION_FEED_ITEMS,
  }: {
    username: string;
    secret: string;
    limit?: number;
  },
): Promise<PartnerTransactionFeedItem[]> => {
  const normalizedUsername = username.trim();
  const enforcedLimit = Math.max(1, Math.min(limit, MAX_TRANSACTION_FEED_ITEMS));
  if (!normalizedUsername) {
    return [];
  }

  const conversionRows = await db
    .prepare(selectConversionTransactionIdsByUsernameQuery)
    .bind(normalizedUsername, enforcedLimit)
    .all<ConversionReferenceRow>();

  const references = conversionRows.results ?? [];
  if (references.length === 0) {
    return [];
  }

  const placeholderList = references.map(() => '?').join(', ');
  const transactionsResult = await db
    .prepare(buildSelectTransactionsByIdsQuery(placeholderList))
    .bind(...references.map((reference) => reference.transaction_id))
    .all<TransactionRow>();

  const transactions = new Map(
    (transactionsResult.results ?? []).map((transaction) => [transaction.transaction_id, transaction]),
  );

  return Promise.all(
    references.flatMap(async (reference) => {
      const transaction = transactions.get(reference.transaction_id);
      if (!transaction) {
        return [];
      }

      return [
        {
          id: await buildTransactionCode(secret, transaction.transaction_id),
          status: normalizeTransactionStatus(transaction.status),
          amount: formatAmount(transaction.amount),
          pair: formatPair(transaction.from_symbol, transaction.to_symbol),
          timestamp: formatUtcTimestamp(transaction.timestamp ?? reference.timestamp),
          user: transaction.wallet_address
            ? await buildUserCode(secret, transaction.wallet_address)
            : 'unknown',
        },
      ];
    }),
  ).then((items) => items.flat());
};
