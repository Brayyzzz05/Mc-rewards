import { SlashCommandBuilder } from "discord.js";
import { getStats } from "../core/shopSystem.js";
import { getMCName } from "../core/verifySystem.js";
import { getSetting } from "../core/settings.js";
import { logError } from "../utils/logger.js";

const DAILY_COOLDOWN_MS  = 24 * 60 * 60 * 1000;
const WEEKLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function timeLeft(lastStr, cooldownMs) {
  if (!lastStr) return "Ready now";
  const diff = Date.now() - new Date(lastStr).getTime();
  if (diff >= cooldownMs) return "Ready now";
  const remaining = cooldownMs - diff;
  const days    = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours   = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0)  return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Check your reward stats"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const [s, mc, dailyStr, weeklyStr, prestigeStr] = await Promise.all([
        getStats(userId),
        getMCName(userId),
        getSetting(`daily_${userId}`, null),
        getSetting(`weekly_${userId}`, null),
        getSetting(`prestige_${userId}`, "0")
      ]);

      const messages = s?.messages ?? 0;
      const rolls    = s?.rolls    ?? 0;
      const luck     = s?.luck_multiplier ?? 1;
      const prestige = parseInt(prestigeStr) || 0;

      return interaction.editReply(
        [
          `**Your Stats**`,
          `Minecraft:       ${mc ? `\`${mc}\`` : "_not verified_"}`,
          `Prestige:        **${prestige}/5**`,
          `Messages:        **${messages}**`,
          `Rolls:           **${rolls}**`,
          `Luck multiplier: **${luck.toFixed(2)}x**`,
          ``,
          `Daily:           **${timeLeft(dailyStr, DAILY_COOLDOWN_MS)}**`,
          `Weekly:          **${timeLeft(weeklyStr, WEEKLY_COOLDOWN_MS)}**`
        ].join("\n")
      );
    } catch (err) {
      logError("STATS COMMAND", err);
      return interaction.editReply("Could not load your stats.");
    }
  }
};