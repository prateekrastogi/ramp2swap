import {
  selectPendingConversionVerificationQuery,
  selectTransactionVerificationStatusQuery,
  updateConversionVerificationStateQuery,
} from '../queries/conversion-verification';

const PENDING_VERIFICATION_DELAY_MS = 72 * 60 * 60 * 1000;
const VERIFICATION_RETRY_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 4;

type PendingVerificationRow = {
  transaction_id: string;
  verified: string | null;
  verification_attempt_count: number | null;
  verification_last_checked_at: number | null;
};

type TransactionStatusRow = {
  status: string | null;
};

const isVerifiedTrue = (value: string | null) => value?.trim().toLowerCase() === 'true';

const isCompletedStatus = (status: string | null) => {
  const normalized = status?.trim().toLowerCase() ?? '';

  return (
    normalized === 'completed' ||
    normalized === 'complete' ||
    normalized === 'success' ||
    normalized === 'succeeded'
  );
};

export const verifyTransaction = async (
  db: D1Database,
  transactionId: string,
): Promise<boolean> => {
  const normalizedTransactionId = transactionId.trim();
  if (!normalizedTransactionId) {
    return false;
  }

  const result = await db
    .prepare(selectTransactionVerificationStatusQuery)
    .bind(normalizedTransactionId)
    .first<TransactionStatusRow>();

  return isCompletedStatus(result?.status ?? null);
};

export const processPendingConversionVerifications = async (
  db: D1Database,
  now: number,
) => {
  const eligibleBeforeTimestamp = now - PENDING_VERIFICATION_DELAY_MS;
  const retryEligibleBefore = now - VERIFICATION_RETRY_INTERVAL_MS;

  const result = await db
    .prepare(selectPendingConversionVerificationQuery)
    .bind(
      eligibleBeforeTimestamp,
      MAX_VERIFICATION_ATTEMPTS,
      retryEligibleBefore,
    )
    .all<PendingVerificationRow>();

  const rows = result.results ?? [];
  if (rows.length === 0) {
    return;
  }

  for (const row of rows) {
    if (isVerifiedTrue(row.verified)) {
      continue;
    }

    const attemptCount = row.verification_attempt_count ?? 0;
    if (attemptCount >= MAX_VERIFICATION_ATTEMPTS) {
      continue;
    }

    const verified = await verifyTransaction(db, row.transaction_id);

    await db
      .prepare(updateConversionVerificationStateQuery)
      .bind(verified ? 'true' : 'false', attemptCount + 1, now, row.transaction_id)
      .run();
  }
};
