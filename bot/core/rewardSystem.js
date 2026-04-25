import db from "../core/database.js";
import { runCommand, isRconConnected, isPlayerOnline } from "../core/rconHandler.js";
import { logError, logInfo } from "../utils/logger.js";
import crypto from "crypto";

function hash(discordId, cmd) {
  return crypto.createHash("sha256")
    .update(`${discordId}:${cmd}:${Date.now()}`)
    .digest("hex");
}

/**
 * Try to deliver immediately; queue when:
 *   - RCON is offline (server down), OR
 *   - the target player is not currently on the server
 * Returns: { delivered, queued, finalCmd, reason }
 */
export async function deliverReward(discordId, mcName, cmd, tier = null) {
  const finalCmd = cmd.replaceAll("{player}", mcName);
  const rewardHash = hash(discordId, finalCmd);

  // Always log the win
  try {
    await db.query(
      `INSERT INTO reward_logs (discord_id, minecraft_username, reward, tier)
       VALUES ($1, $2, $3, $4)`,
      [discordId, mcName, finalCmd, tier]
    );
  } catch (err) {
    logError("reward_logs insert", err);
  }

  // Decide: live deliver or queue
  if (isRconConnected() && isPlayerOnline(mcName)) {
    try {
      await runCommand(finalCmd);
      await db.query(
        `INSERT INTO delivered_rewards (reward_hash) VALUES ($1)
         ON CONFLICT (reward_hash) DO NOTHING`,
        [rewardHash]
      );
      logInfo(`Delivered: ${finalCmd}`);
      return { delivered: true, queued: false, finalCmd, reason: "online" };
    } catch (err) {
      logError("RCON delivery", err);
      // fall through to queue
    }
  }

  const reason = !isRconConnected() ? "server_offline" : "player_offline";

  try {
    await db.query(
      `INSERT INTO reward_queue
       (discord_id, minecraft_username, command, reward_hash, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [discordId, mcName, finalCmd, rewardHash]
    );
    logInfo(`Queued (${reason}): ${finalCmd}`);
    return { delivered: false, queued: true, finalCmd, reason };
  } catch (err) {
    logError("queue insert", err);
    return { delivered: false, queued: false, finalCmd, reason: "queue_error" };
  }
}
