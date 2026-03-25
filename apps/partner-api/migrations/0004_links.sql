CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_tag TEXT NOT NULL,
  generated_url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_uid) REFERENCES auth_users(uid) ON DELETE CASCADE,
  UNIQUE (user_uid, campaign_tag)
);

CREATE INDEX IF NOT EXISTS idx_links_user_uid_created_at ON links(user_uid, created_at DESC);
