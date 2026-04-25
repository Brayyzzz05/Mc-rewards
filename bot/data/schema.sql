-- Reference schema. The bot calls initDB() in core/database.js at startup
-- and creates these idempotently with CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS mc_verifications (
  discord_id           TEXT PRIMARY KEY,
  minecraft_username   TEXT NOT NULL,
  verified_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stats (
  discord_id        TEXT PRIMARY KEY,
  messages          INTEGER NOT NULL DEFAULT 0,
  rolls             INTEGER NOT NULL DEFAULT 0,
  luck_multiplier   NUMERIC(6,2) NOT NULL DEFAULT 1.00,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_logs (
  id                   SERIAL PRIMARY KEY,
  discord_id           TEXT,
  minecraft_username   TEXT,
  reward               TEXT,
  tier                 TEXT,
  time                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_transactions (
  id           SERIAL PRIMARY KEY,
  discord_id   TEXT,
  item         TEXT,
  amount       INTEGER,
  cost         INTEGER,
  time         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivered_rewards (
  id           SERIAL PRIMARY KEY,
  reward_hash  TEXT UNIQUE,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_queue (
  id                  SERIAL PRIMARY KEY,
  discord_id          TEXT,
  minecraft_username  TEXT,
  command             TEXT NOT NULL,
  reward_hash         TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  attempts            INTEGER NOT NULL DEFAULT 0,
  last_error          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT
);
