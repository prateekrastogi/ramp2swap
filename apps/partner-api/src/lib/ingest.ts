import {
  insertClickQuery,
  pruneClicksQuery,
  upsertConversionQuery,
  upsertTransactionQuery,
} from '../queries/ingest';
import {
  backfillMissingConversionPayouts,
  recalculateConversionPayoutsForTransaction,
} from './payouts';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLICK_RETENTION_DAYS = 91;
const CLICK_BUCKET_DAYS = 7;
const CLICK_BUCKET_MS = CLICK_BUCKET_DAYS * DAY_MS;
const CLICK_RETENTION_MS = CLICK_RETENTION_DAYS * DAY_MS;

const getWeekBucketStart = (timestamp: number) => Math.floor(timestamp / CLICK_BUCKET_MS) * CLICK_BUCKET_MS;

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

  await recalculateConversionPayoutsForTransaction(db, transactionId);
  await backfillMissingConversionPayouts(db);
};

export const saveClick = async (
  db: D1Database,
  {
    event,
    username,
    campaign,
    country,
    timestamp,
    now,
  }: {
    event: string;
    username: string | null;
    campaign: string | null;
    country: string | null;
    timestamp: number;
    now: number;
  },
) => {
  const retentionCutoff = now - CLICK_RETENTION_MS;
  const weekBucketStart = getWeekBucketStart(timestamp);

  await db.prepare(pruneClicksQuery).bind(retentionCutoff).run();
  await db
    .prepare(insertClickQuery)
    .bind(event, username, campaign, country, weekBucketStart, timestamp, now)
    .run();
};

export const saveConversion = async (
  db: D1Database,
  {
    transactionId,
    event,
    username,
    campaign,
    country,
    timestamp,
    verified,
    withdrawn,
  }: {
    transactionId: string;
    event: string;
    username: string | null;
    campaign: string | null;
    country: string | null;
    timestamp: number;
    verified: string | null;
    withdrawn: string | null;
  },
) => {
  await db
    .prepare(upsertConversionQuery)
    .bind(transactionId, event, username, campaign, country, timestamp, null, verified, withdrawn)
    .run();

  await recalculateConversionPayoutsForTransaction(db, transactionId);
  await backfillMissingConversionPayouts(db);
};
