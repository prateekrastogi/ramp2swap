export type AuthOtpRow = {
  email: string;
  code_hash: string;
  salt: string;
  expires_at: number;
  resend_after: number;
  attempts_remaining: number;
};

export type AuthSessionRow = {
  id: string;
  email: string;
  expires_at: number;
};

export const getActiveOtpCooldown = async (db: D1Database, email: string) =>
  db.prepare(
    'SELECT email, resend_after FROM auth_otps WHERE email = ? AND consumed_at IS NULL',
  )
    .bind(email)
    .first<{ email: string; resend_after: number }>();

export const upsertOtp = async (
  db: D1Database,
  {
    email,
    codeHash,
    salt,
    expiresAt,
    resendAfter,
    attemptsRemaining,
    requestedAt,
  }: {
    email: string;
    codeHash: string;
    salt: string;
    expiresAt: number;
    resendAfter: number;
    attemptsRemaining: number;
    requestedAt: number;
  },
) =>
  db.prepare(
    `
      INSERT INTO auth_otps (
        email,
        code_hash,
        salt,
        expires_at,
        resend_after,
        attempts_remaining,
        requested_at,
        consumed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(email) DO UPDATE SET
        code_hash = excluded.code_hash,
        salt = excluded.salt,
        expires_at = excluded.expires_at,
        resend_after = excluded.resend_after,
        attempts_remaining = excluded.attempts_remaining,
        requested_at = excluded.requested_at,
        consumed_at = NULL
    `,
  )
    .bind(email, codeHash, salt, expiresAt, resendAfter, attemptsRemaining, requestedAt)
    .run();

export const getPendingOtp = async (db: D1Database, email: string) =>
  db.prepare(
    `
      SELECT email, code_hash, salt, expires_at, resend_after, attempts_remaining
      FROM auth_otps
      WHERE email = ? AND consumed_at IS NULL
    `,
  )
    .bind(email)
    .first<AuthOtpRow>();

export const decrementOtpAttempts = async (db: D1Database, email: string) =>
  db.prepare(
    'UPDATE auth_otps SET attempts_remaining = attempts_remaining - 1 WHERE email = ?',
  )
    .bind(email)
    .run();

export const consumeOtpAndCreateSession = async (
  db: D1Database,
  {
    email,
    consumedAt,
    sessionId,
    sessionCreatedAt,
    sessionExpiresAt,
    sessionLastVerifiedAt,
  }: {
    email: string;
    consumedAt: number;
    sessionId: string;
    sessionCreatedAt: number;
    sessionExpiresAt: number;
    sessionLastVerifiedAt: number;
  },
) =>
  db.batch([
    db.prepare(
      `
        UPDATE auth_otps
        SET consumed_at = ?
        WHERE email = ?
      `,
    ).bind(consumedAt, email),
    db.prepare(
      `
        INSERT INTO auth_sessions (id, email, created_at, expires_at, last_verified_at, revoked_at)
        VALUES (?, ?, ?, ?, ?, NULL)
      `,
    ).bind(sessionId, email, sessionCreatedAt, sessionExpiresAt, sessionLastVerifiedAt),
  ]);

export const getActiveSessionById = async (db: D1Database, sessionId: string) =>
  db.prepare('SELECT id, email, expires_at FROM auth_sessions WHERE id = ? AND revoked_at IS NULL')
    .bind(sessionId)
    .first<AuthSessionRow>();

export const touchSessionVerification = async (
  db: D1Database,
  sessionId: string,
  verifiedAt: number,
) =>
  db.prepare('UPDATE auth_sessions SET last_verified_at = ? WHERE id = ?')
    .bind(verifiedAt, sessionId)
    .run();

export const revokeSession = async (db: D1Database, sessionId: string, revokedAt: number) =>
  db.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE id = ?')
    .bind(revokedAt, sessionId)
    .run();
