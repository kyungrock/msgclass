-- shared banned words for reviews/profiles
CREATE TABLE IF NOT EXISTS banned_words_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  words TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO banned_words_config (id, words, updated_at)
VALUES (1, '야구,농구,수영,섹스', datetime('now'));
