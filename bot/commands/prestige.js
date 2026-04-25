import { SlashCommandBuilder } from "discord.js";
import { getSetting, setSetting } from "../core/settings.js";
import { logError } from "../utils/logger.js";
import db from "../core/database.js";

const MAX_PRESTIGE = 5;
const LUCK_PER_PRESTIGE = 0.25;

function prestigeCost(level) {
  return {
    messages: 300 * Math.pow(2, level),
    rolls:    5   * Math.pow(2, level)
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Spend messages and rolls for a permanent +0.25 luck boost (max 5 times)"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const currentPrestige = parseInt(await getSetting(`prestige_${userId}`, "0")) || 0;

      if (currentPrestige >= MAX_PRESTIGE) {
        return interaction.editReply(
          `You've reached max prestige (**${MAX_PRESTIGE}**) with a total of **+${(currentPrestige * LUCK_PER_PRESTIGE).toFixed(2)} luck** from prestige.`
        );
      }

      const cost      = prestigeCost(currentPrestige);
      const nextLevel = currentPrestige + 1;

      const client = await db.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `INSERT INTO user_stats (discord_id) VALUES ($1) ON CONFLICT (discord_id) DO NOTHING`,
          [userId]
        );

        const cur = await client.query(
          `SELECT messages, rolls FROM user_stats WHERE discord_id=$1 FOR UPDATE`,
          [userId]
        );
        const have = cur.rows[0] || { messages: 0, rolls: 0 };

        if (have.messages < cost.messages || have.rolls < cost.rolls) {
          await client.query("ROLLBACK");
          return interaction.editReply(
            [
              `**Prestige ${nextLevel}** cost:`,
              `• **${cost.messages}** messages — you have ${have.messages}`,
              `• **${cost.rolls}** rolls — you have ${have.rolls}`,
              ``,
              `Reward: **+${LUCK_PER_PRESTIGE} permanent luck multiplier**`
            ].join("\n")
          );
        }

        await client.query(
          `UPDATE user_stats
           SET messages        = messages - $1,
               rolls           = rolls - $2,
               luck_multiplier = luck_multiplier + $3,
               updated_at      = NOW()
           WHERE discord_id = $4`,
          [cost.messages, cost.rolls, LUCK_PER_PRESTIGE, userId]
        );

        await client.query("COMMIT");
        await setSetting(`prestige_${userId}`, String(nextLevel));

        const nextCost = nextLevel < MAX_PRESTIGE ? prestigeCost(nextLevel) : null;
        return interaction.editReply(
          [
            `Prestiged to **Level ${nextLevel}**!`,
            `Spent **${cost.messages} messages** and **${cost.rolls} rolls**.`,
            `You gained **+${LUCK_PER_PRESTIGE} permanent luck multiplier**.`,
            nextCost
              ? `Next prestige costs **${nextCost.messages} messages** and **${nextCost.rolls} rolls**.`
              : `You've reached the maximum prestige level!`
          ].join("\n")
        );
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logError("PRESTIGE COMMAND", err);
      return interaction.editReply("Could not process prestige. Try again later.");
    }
  }
};