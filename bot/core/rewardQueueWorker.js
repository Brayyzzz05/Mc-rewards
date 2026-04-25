import db from "../core/database.js";
import {
  runCommand,
  isRconConnected,
  isPlayerOnline,
  presence
} from "../core/rconHandler.js";
import { logError, logInfo } from "../utils/logger.js";

const TICK_MS = 5000;
const MAX_ATTEMPTS = 10;

let timer = null;
let started = false;

export function startRewardWorker() {
  if (started) return;
  started = true;

  // Periodic sweep — picks up anything new and retries previous failures
  timer = setInterval(() => flushAll().catch(() => {}), TICK_MS);

  // Immediate flush the moment a player joins the server
  presence.on("join", (name) => {
    logInfo(`Player joined: ${name} — flushing their queue`);
    flushForPlayer(name).catch(err => logError("flushForPlayer", err));
  });

  logInfo("Reward queue worker started");
}

export function stopRewardWorker() {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}

/** Sweep: deliver every queued reward whose target player is currently online. */
async function flushAll() {
  if (!isRconConnected()) return;

  let rows;
  try {
    const res = await db.query(
      `SELECT id, minecraft_username, command, reward_hash, attempts
       FROM reward_queue
       WHERE status = 'pending' AND attempts < $1
       ORDER BY id ASC
       LIMIT 50`,
      [MAX_ATTEMPTS]
    );
    rows = res.rows;
  } catch (err) {
    logError("queue read", err);
    return;
  }

  for (const row of rows) {
    if (!isPlayerOnline(row.minecraft_username)) continue;
    await tryDeliver(row);
  }
}

/** Targeted flush: when a specific player joins, deliver only their queued rewards. */
async function flushForPlayer(name) {
  if (!isRconConnected()) return;

  let rows;
  try {
    const res = await db.query(
      `SELECT id, minecraft_username, command, reward_hash, attempts
       FROM reward_queue
       WHERE status = 'pending'
         AND attempts < $1
         AND LOWER(minecraft_username) = LOWER($2)
       ORDER BY id ASC`,
      [MAX_ATTEMPTS, name]
    );
    rows = res.rows;
  } catch (err) {
    logError("queue read (player)", err);
    return;
  }

  for (const row of rows) {
    // Guard against the player leaving between the join event and this loop
    if (!isPlayerOnline(row.minecraft_username)) break;
    await tryDeliver(row);
  }
}

async function tryDeliver(row) {
  try {
    await runCommand(row.command);
    await db.query(
      `UPDATE reward_queue
       SET status='delivered', updated_at=NOW()
       WHERE id=$1`,
      [row.id]
    );
    if (row.reward_hash) {
      await db.query(
        `INSERT INTO delivered_rewards (reward_hash) VALUES ($1)
         ON CONFLICT (reward_hash) DO NOTHING`,
        [row.reward_hash]
      );
    }
    logInfo(`Queued reward delivered to ${row.minecraft_username}: ${row.command}`);
  } catch (err) {
    const attempts = (row.attempts || 0) + 1;
    const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
    try {
      await db.query(
        `UPDATE reward_queue
         SET attempts=$1, status=$2, last_error=$3, updated_at=NOW()
         WHERE id=$4`,
        [attempts, status, String(err?.message || err), row.id]
      );
    } catch (uerr) {
      logError("queue update", uerr);
    }
  }
}
