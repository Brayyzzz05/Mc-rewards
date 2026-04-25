import { SlashCommandBuilder } from "discord.js";
import { getSetting, setSetting } from "../core/settings.js";
import { logError } from "../utils/logger.js";
import db from "../core/database.js";

const WEEKLY_ROLLS = 7;
const WEEKLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Claim your weekly 7 rolls (resets every 7 days)"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const lastClaimStr = await getSetting(`weekly_${userId}`, null);

      if (lastClaimStr) {
        const diff = Date.now() - new Date(lastClaimStr).getTime();
        if (diff < WEEKLY_COOLDOWN_MS) {
          const remaining = WEEKLY_COOLDOWN_MS - diff;
          const days    = Math.floor(remaining / (24 * 60 * 60 * 1000));
          const hours   = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          return interaction.editReply(
            `You already claimed your weekly! Come back in **${days}d ${hours}h ${minutes}m**.`
          );
        }
      }

      await db.query(
        `INSERT INTO user_stats (discord_id, rolls) VALUES ($1, $2)
         ON CONFLICT (discord_id) DO UPDATE SET rolls = user_stats.rolls + $2, updated_at = NOW()`,
        [userId, WEEKLY_ROLLS]
      );

      await setSetting(`weekly_${userId}`, new Date().toISOString());

      return interaction.editReply(
        `Weekly claimed! You received **${WEEKLY_ROLLS} rolls**. Come back in 7 days for more.`
      );
    } catch (err) {
      logError("WEEKLY COMMAND", err);
      return interaction.editReply("Could not claim weekly. Try again later.");
    }
  }
};