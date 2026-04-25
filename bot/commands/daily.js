import { SlashCommandBuilder } from "discord.js";
import { getSetting, setSetting } from "../core/settings.js";
import { logError } from "../utils/logger.js";
import db from "../core/database.js";

const DAILY_ROLLS = 2;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily 2 rolls (resets every 24 hours)"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const lastClaimStr = await getSetting(`daily_${userId}`, null);

      if (lastClaimStr) {
        const diff = Date.now() - new Date(lastClaimStr).getTime();
        if (diff < DAILY_COOLDOWN_MS) {
          const remaining = DAILY_COOLDOWN_MS - diff;
          const hours = Math.floor(remaining / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          return interaction.editReply(
            `You already claimed your daily! Come back in **${hours}h ${minutes}m**.`
          );
        }
      }

      await db.query(
        `INSERT INTO user_stats (discord_id, rolls) VALUES ($1, $2)
         ON CONFLICT (discord_id) DO UPDATE SET rolls = user_stats.rolls + $2, updated_at = NOW()`,
        [userId, DAILY_ROLLS]
      );

      await setSetting(`daily_${userId}`, new Date().toISOString());

      return interaction.editReply(
        `Daily claimed! You received **${DAILY_ROLLS} rolls**. Come back in 24 hours for more.`
      );
    } catch (err) {
      logError("DAILY COMMAND", err);
      return interaction.editReply("Could not claim daily. Try again later.");
    }
  }
};