import { SlashCommandBuilder } from "discord.js";
import { getSetting, setSetting } from "../core/settings.js";
import { logError } from "../utils/logger.js";
import db from "../core/database.js";

const DAILY_ROLLS      = 2;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STREAK_RESET_MS   = 48 * 60 * 60 * 1000;

function streakBonus(streak) {
  if (streak >= 30) return 7;
  if (streak >= 14) return 4;
  if (streak >= 7)  return 2;
  if (streak >= 3)  return 1;
  return 0;
}

function nextMilestone(streak) {
  if (streak < 3)  return { day: 3,  bonus: 1 };
  if (streak < 7)  return { day: 7,  bonus: 2 };
  if (streak < 14) return { day: 14, bonus: 4 };
  if (streak < 30) return { day: 30, bonus: 7 };
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily 2 rolls (resets every 24 hours)"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const [lastClaimStr, streakStr] = await Promise.all([
        getSetting(`daily_${userId}`, null),
        getSetting(`streak_${userId}`, "0")
      ]);

      const now = Date.now();

      if (lastClaimStr) {
        const diff = now - new Date(lastClaimStr).getTime();
        if (diff < DAILY_COOLDOWN_MS) {
          const remaining = DAILY_COOLDOWN_MS - diff;
          const hours   = Math.floor(remaining / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          return interaction.editReply(
            `You already claimed your daily! Come back in **${hours}h ${minutes}m**.`
          );
        }
      }

      let streak = parseInt(streakStr) || 0;
      if (lastClaimStr) {
        const diff = now - new Date(lastClaimStr).getTime();
        streak = diff <= STREAK_RESET_MS ? streak + 1 : 1;
      } else {
        streak = 1;
      }

      const bonus      = streakBonus(streak);
      const totalRolls = DAILY_ROLLS + bonus;

      await db.query(
        `INSERT INTO user_stats (discord_id, rolls) VALUES ($1, $2)
         ON CONFLICT (discord_id) DO UPDATE SET rolls = user_stats.rolls + $2, updated_at = NOW()`,
        [userId, totalRolls]
      );

      await Promise.all([
        setSetting(`daily_${userId}`,  new Date().toISOString()),
        setSetting(`streak_${userId}`, String(streak))
      ]);

      const lines = [`Daily claimed! **${streak} day streak**`];
      if (bonus > 0) {
        lines.push(`${DAILY_ROLLS} base + **${bonus} streak bonus** = **${totalRolls} rolls**`);
      } else {
        lines.push(`You received **${totalRolls} rolls**`);
      }

      const next = nextMilestone(streak);
      if (next) {
        lines.push(`Next milestone: day **${next.day}** (+${next.bonus} bonus rolls)`);
      } else {
        lines.push(`You're at max streak bonus (+7 rolls per day)!`);
      }

      return interaction.editReply(lines.join("\n"));
    } catch (err) {
      logError("DAILY COMMAND", err);
      return interaction.editReply("Could not claim daily. Try again later.");
    }
  }
};