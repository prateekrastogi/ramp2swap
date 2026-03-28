import {
  insertClickQuery,
  upsertConversionQuery,
  upsertTransactionQuery,
} from '../queries/ingest';

export const saveTransaction = async (
  db: D1Database,
  {
    transactionId,
    status,
    amount,
    fromSymbol,
    toSymbol,
    walletAddress,
    timestamp,
    now,
  }: {
    transactionId: string;
    status: string;
    amount: string | null;
    fromSymbol: string | null;
    toSymbol: string | null;
    walletAddress: string | null;
    timestamp: number;
    now: number;
  },
) => {
  await db
    .prepare(upsertTransactionQuery)
    .bind(transactionId, status, amount, fromSymbol, toSymbol, walletAddress, timestamp, now, now)
    .run();
};

export const saveClick = async (
  db: D1Database,
  {
    event,
    username,
    campaign,
    timestamp,
    now,
  }: {
    event: string;
    username: string | null;
    campaign: string | null;
    timestamp: number;
    now: number;
  },
) => {
  await db
    .prepare(insertClickQuery)
    .bind(event, username, campaign, timestamp, now)
    .run();
};

export const saveConversion = async (
  db: D1Database,
  {
    transactionId,
    event,
    username,
    campaign,
    timestamp,
    payout,
  }: {
    transactionId: string;
    event: string;
    username: string | null;
    campaign: string | null;
    timestamp: number;
    payout: string | null;
  },
) => {
  await db
    .prepare(upsertConversionQuery)
    .bind(transactionId, event, username, campaign, timestamp, payout)
    .run();
};
