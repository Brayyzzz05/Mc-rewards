import db from "../core/database.js";
import { logError } from "../utils/logger.js";

// Costs are in messages. Each item adds rolls and/or luck multiplier.
const COST_MAP = {
  roll:   { cost: 20,  apply: { rolls: 1, luck: 0   } },
  roll5:  { cost: 80,  apply: { rolls: 5, luck: 0   } },
  luck1:  { cost: 100, apply: { rolls: 0, luck: 0.1 } },
  luck5:  { cost: 400, apply: { rolls: 0, luck: 0.5 } }
};

export const SHOP_ITEMS = COST_MAP;

export async function buyItem(userId, item, amount = 1) {
  const def = COST_MAP[item];
  if (!def) return "Invalid item. Try `/shop list` to see options.";
  if (!Number.isInteger(amount) || amount < 1) return "Amount must be a positive integer.";

  const totalCost = def.cost * amount;
  const rollsAdd  = (def.apply.rolls || 0) * amount;
  const luckAdd   = (def.apply.luck  || 0) * amount;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO user_stats (discord_id) VALUES ($1)
       ON CONFLICT (discord_id) DO NOTHING`,
      [userId]
    );

    const cur = await client.query(
      `SELECT messages FROM user_stats WHERE discord_id=$1 FOR UPDATE`,
      [userId]
    );
    const have = cur.rows[0]?.messages ?? 0;

    if (have < totalCost) {
      await client.query("ROLLBACK");
      return `Not enough messages. You have ${have}, need ${totalCost}.`;
    }

    await client.query(
      `UPDATE user_stats
       SET messages        = messages - $1,
           rolls           = rolls + $2,
           luck_multiplier = luck_multiplier + $3,
           updated_at      = NOW()
       WHERE discord_id = $4`,
      [totalCost, rollsAdd, luckAdd, userId]
    );

    await client.query(
      `INSERT INTO shop_transactions (discord_id, item, amount, cost)
       VALUES ($1, $2, $3, $4)`,
      [userId, item, amount, totalCost]
    );

    await client.query("COMMIT");
    return `Purchased **${item}** x${amount} for ${totalCost} messages.`;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logError("buyItem", err);
    return "Shop error, try again.";
  } finally {
    client.release();
  }
}

export async function getStats(userId) {
  try {
    await db.query(
      `INSERT INTO user_stats (discord_id) VALUES ($1)
       ON CONFLICT (discord_id) DO NOTHING`,
      [userId]
    );
    const res = await db.query(
      `SELECT discord_id, messages, rolls, luck_multiplier
       FROM user_stats WHERE discord_id=$1`,
      [userId]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      discord_id: row.discord_id,
      messages: Number(row.messages),
      rolls: Number(row.rolls),
      luck_multiplier: Number(row.luck_multiplier)
    };
  } catch (err) {
    logError("getStats", err);
    return null;
  }
}

export async function consumeRoll(userId) {
  const res = await db.query(
    `UPDATE user_stats
     SET rolls = rolls - 1, updated_at = NOW()
     WHERE discord_id = $1 AND rolls > 0
     RETURNING rolls`,
    [userId]
  );
  return res.rows.length > 0;
}

export async function getUserLuck(userId) {
  const res = await db.query(
    `SELECT luck_multiplier FROM user_stats WHERE discord_id=$1`,
    [userId]
  );
  return Number(res.rows[0]?.luck_multiplier ?? 1);
}
