-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email       TEXT UNIQUE NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT DEFAULT 'owner',
  created_at  TEXT DEFAULT (datetime('now')),
  last_login  TEXT
);
