-- ═══════════════════════════════════════════════
-- ChessCF D1 Schema
-- Run: wrangler d1 execute chesscf-db --file=schema.sql
-- ═══════════════════════════════════════════════

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ── Users ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  handle        TEXT UNIQUE NOT NULL COLLATE NOCASE,
  email         TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT,                    -- null for SSO-only users
  password_salt TEXT,
  provider      TEXT NOT NULL DEFAULT 'local',  -- local | google | facebook
  provider_id   TEXT,                    -- OAuth subject ID
  elo           INTEGER NOT NULL DEFAULT 1200,
  elo_1         INTEGER NOT NULL DEFAULT 1200,  -- per-level ELO
  elo_2         INTEGER NOT NULL DEFAULT 1200,
  elo_3         INTEGER NOT NULL DEFAULT 1200,
  elo_4         INTEGER NOT NULL DEFAULT 1200,
  elo_5         INTEGER NOT NULL DEFAULT 1200,
  wins          INTEGER NOT NULL DEFAULT 0,
  losses        INTEGER NOT NULL DEFAULT 0,
  draws         INTEGER NOT NULL DEFAULT 0,
  verified      INTEGER NOT NULL DEFAULT 0,     -- 0 = unverified, 1 = verified
  country       TEXT DEFAULT 'UN',
  avatar_key    TEXT,                    -- R2 key for avatar image
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen     TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
CREATE INDEX IF NOT EXISTS idx_users_elo    ON users(elo DESC);

-- ── Sessions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip         TEXT,
  ua         TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ── Password reset tokens ────────────────────────
CREATE TABLE IF NOT EXISTS pw_resets (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0
);

-- ── Games ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  white_id     TEXT NOT NULL REFERENCES users(id),
  black_id     TEXT,                     -- null for AI games
  level        INTEGER NOT NULL DEFAULT 1,
  agent_id     TEXT,                     -- which AI agent (if PvE)
  pgn          TEXT,
  fen_final    TEXT,
  result       TEXT,                     -- white | black | draw
  end_reason   TEXT,                     -- checkmate | timeout | resign | draw | abort
  elo_delta    INTEGER DEFAULT 0,
  time_control INTEGER DEFAULT 600,
  moves_count  INTEGER DEFAULT 0,
  duration_s   INTEGER DEFAULT 0,
  started_at   TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_games_white   ON games(white_id);
CREATE INDEX IF NOT EXISTS idx_games_black   ON games(black_id);
CREATE INDEX IF NOT EXISTS idx_games_level   ON games(level);
CREATE INDEX IF NOT EXISTS idx_games_ended   ON games(ended_at DESC);

-- ── Moves (for analysis) ─────────────────────────
CREATE TABLE IF NOT EXISTS moves (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  move_num    INTEGER NOT NULL,
  san         TEXT NOT NULL,
  fen_after   TEXT,
  elapsed_ms  INTEGER,
  eval_cp     INTEGER,             -- centipawn eval (from Stockfish)
  is_blunder  INTEGER DEFAULT 0    -- flagged by analysis
);
CREATE INDEX IF NOT EXISTS idx_moves_game ON moves(game_id);

-- ── AI Agents ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,   -- pawn-e | nightcrawler | stratbot3 | shadowrook | apex5
  name            TEXT NOT NULL,
  level           INTEGER NOT NULL,
  elo             INTEGER NOT NULL DEFAULT 1200,
  games_played    INTEGER NOT NULL DEFAULT 0,
  wins            INTEGER NOT NULL DEFAULT 0,
  losses          INTEGER NOT NULL DEFAULT 0,
  draws           INTEGER NOT NULL DEFAULT 0,
  improvement_score REAL DEFAULT 0,
  style_aggression  REAL DEFAULT 0.5,
  style_positional  REAL DEFAULT 0.5,
  style_random      REAL DEFAULT 0.2,
  fav_opening     TEXT DEFAULT 'e4',
  last_trained_at TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Agent position memory ─────────────────────────
CREATE TABLE IF NOT EXISTS agent_positions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id    TEXT NOT NULL REFERENCES agents(id),
  fen         TEXT NOT NULL,
  best_move   TEXT NOT NULL,
  score_cp    INTEGER,
  game_id     TEXT REFERENCES games(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pos_agent ON agent_positions(agent_id);

-- ── Agent openings memory ─────────────────────────
CREATE TABLE IF NOT EXISTS agent_openings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id    TEXT NOT NULL REFERENCES agents(id),
  eco_code    TEXT,
  opening_name TEXT,
  times_played INTEGER DEFAULT 0,
  wins        INTEGER DEFAULT 0,
  losses      INTEGER DEFAULT 0,
  draws       INTEGER DEFAULT 0
);

-- ── Leaderboard snapshots (cached) ──────────────
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  level       INTEGER NOT NULL,
  rank_pos    INTEGER NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id),
  elo         INTEGER NOT NULL,
  games       INTEGER NOT NULL,
  wins        INTEGER NOT NULL,
  streak      INTEGER DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (level, rank_pos)
);

-- ── Seed AI Agents ────────────────────────────────
INSERT OR IGNORE INTO agents (id,name,level,elo,games_played,wins,losses,draws,style_aggression,style_positional,fav_opening)
VALUES
  ('pawn-e','PAWN-E',1,712,12441,5234,6891,316,0.2,0.5,'e4'),
  ('nightcrawler','NightCrawler',2,923,19203,8892,9841,470,0.7,0.3,'c5'),
  ('stratbot3','StratBot-3',3,1187,28441,14231,12890,1320,0.4,0.8,'d4'),
  ('shadowrook','ShadowRook',4,1423,38822,22109,14321,2392,0.95,0.2,'e4'),
  ('apex5','APEX-5',5,1698,52003,31447,17204,3352,0.5,0.95,'e4');
