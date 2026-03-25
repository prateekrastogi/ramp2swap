CREATE TABLE IF NOT EXISTS auth_users (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);

CREATE TABLE IF NOT EXISTS settings (
  user_uid TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  withdrawal_address TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_uid) REFERENCES auth_users(uid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_settings_username ON settings(username);
