CREATE TABLE IF NOT EXISTS auth_otps (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  resend_after INTEGER NOT NULL,
  attempts_remaining INTEGER NOT NULL,
  requested_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at ON auth_otps(expires_at);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_verified_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON auth_sessions(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
