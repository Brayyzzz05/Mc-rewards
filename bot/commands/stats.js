import { SlashCommandBuilder } from "discord.js";
import { getStats } from "../core/shopSystem.js";
import { getMCName } from "../core/verifySystem.js";
import { logError } from "../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show your messages, rolls, luck, and linked Minecraft account"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const stats  = await getStats(userId);
      const mcName = await getMCName(userId);

      const messages = stats?.messages ?? 0;
      const rolls    = stats?.rolls ?? 0;
      const luck     = Number(stats?.luck_multiplier ?? 1).toFixed(2);

      return interaction.editReply(
        [
          `**Stats for <@${userId}>**`,
          `Linked MC: ${mcName ? `**${mcName}**` : "_not verified_"}`,
          `Messages:  **${messages}**`,
          `Rolls:     **${rolls}**`,
          `Luck:      **${luck}x**`
        ].join("\n")
      );
    } catch (err) {
      logError("STATS COMMAND", err);
      return interaction.editReply("Could not load your stats.");
    }
  }
};