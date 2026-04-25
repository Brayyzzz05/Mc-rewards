import pg from "pg";
import dotenv from "dotenv";
import { logError, logInfo } from "../utils/logger.js";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false
});

pool.on("error", (err) => logError("PG POOL", err));

function needsSsl(url) {
  if (!url) return false;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  return true;
}

export async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_verifications (
        discord_id           TEXT PRIMARY KEY,
        minecraft_username   TEXT NOT NULL,
        verified_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='mc_verifications' AND column_name='verified_at'
        ) THEN
          ALTER TABLE mc_verifications ADD COLUMN verified_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        discord_id        TEXT PRIMARY KEY,
        messages          INTEGER NOT NULL DEFAULT 0,
        rolls             INTEGER NOT NULL DEFAULT 0,
        luck_multiplier   NUMERIC(6,2) NOT NULL DEFAULT 1.00,
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='user_stats' AND column_name='spins'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='user_stats' AND column_name='rolls'
        ) THEN
          ALTER TABLE user_stats RENAME COLUMN spins TO rolls;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='user_stats' AND column_name='luck'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='user_stats' AND column_name='luck_multiplier'
        ) THEN
          ALTER TABLE user_stats ADD COLUMN luck_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1.00;
          UPDATE user_stats SET luck_multiplier = 1.00 + (luck * 0.10);
          ALTER TABLE user_stats DROP COLUMN luck;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reward_logs (
        id                   SERIAL PRIMARY KEY,
        discord_id           TEXT,
        minecraft_username   TEXT,
        reward               TEXT,
        tier                 TEXT,
        time                 TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_logs' AND column_name='tier'
        ) THEN
          ALTER TABLE reward_logs ADD COLUMN tier TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_logs' AND column_name='minecraft_username'
        ) THEN
          ALTER TABLE reward_logs ADD COLUMN minecraft_username TEXT;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_transactions (
        id           SERIAL PRIMARY KEY,
        discord_id   TEXT,
        item         TEXT,
        amount       INTEGER,
        cost         INTEGER,
        time         TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivered_rewards (
        id           SERIAL PRIMARY KEY,
        reward_hash  TEXT UNIQUE,
        delivered_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
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
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_queue' AND column_name='minecraft_username'
        ) THEN
          ALTER TABLE reward_queue ADD COLUMN minecraft_username TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_queue' AND column_name='reward_hash'
        ) THEN
          ALTER TABLE reward_queue ADD COLUMN reward_hash TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_queue' AND column_name='attempts'
        ) THEN
          ALTER TABLE reward_queue ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_queue' AND column_name='last_error'
        ) THEN
          ALTER TABLE reward_queue ADD COLUMN last_error TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_queue' AND column_name='created_at'
        ) THEN
          ALTER TABLE reward_queue ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reward_queue' AND column_name='updated_at'
        ) THEN
          ALTER TABLE reward_queue ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key    TEXT PRIMARY KEY,
        value  TEXT
      );
    `);

    logInfo("Database tables ready");
  } catch (err) {
    logError("DB INIT", err);
    throw err;
  }
}

export default pool;