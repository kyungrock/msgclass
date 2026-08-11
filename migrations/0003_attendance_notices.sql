CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
