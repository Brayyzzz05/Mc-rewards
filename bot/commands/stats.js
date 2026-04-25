import { SlashCommandBuilder } from "discord.js";
import { getStats } from "../systems/shopSystem.js";
import { getMCName } from "../systems/verifySystem.js";
import { logError } from "../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Check your reward stats"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const [s, mc] = await Promise.all([getStats(userId), getMCName(userId)]);
      const messages = s?.messages ?? 0;
      const rolls    = s?.rolls    ?? 0;
      const luck     = s?.luck_multiplier ?? 1;

      return interaction.editReply(
        [
          `**Your stats**`,
          `Minecraft:       ${mc ? `\`${mc}\`` : "_not verified_"}`,
          `Messages:        **${messages}**`,
          `Rolls:           **${rolls}**`,
          `Luck multiplier: **${luck.toFixed(2)}x**`
        ].join("\n")
      );
    } catch (err) {
      logError("STATS COMMAND", err);
      return interaction.editReply("Could not load your stats.");
    }
  }
};
