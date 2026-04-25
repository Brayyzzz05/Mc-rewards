import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { setSetting, getSetting } from "../core/settings.js";
import { logError } from "../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("luckyhour")
    .setDescription("Toggle a lucky hour event that multiplies everyone's luck")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(o =>
      o.setName("active").setDescription("Enable or disable lucky hour").setRequired(true)
    )
    .addNumberOption(o =>
      o.setName("multiplier")
        .setDescription("How much to multiply everyone's luck (default 5)")
        .setMinValue(1).setMaxValue(100).setRequired(false)
    ),

  async execute(interaction) {
    try {
      const active     = interaction.options.getBoolean("active", true);
      const multiplier = interaction.options.getNumber("multiplier") ?? 5;

      await setSetting("luckyhour_active",     active ? "true" : "false");
      await setSetting("luckyhour_multiplier",  String(multiplier));

      return interaction.editReply(
        active
          ? `Lucky hour is now **ON** — everyone's luck is multiplied by **${multiplier}x**!`
          : "Lucky hour is now **OFF**. Luck is back to normal."
      );
    } catch (err) {
      logError("LUCKYHOUR COMMAND", err);
      return interaction.editReply("Could not update lucky hour. Try again.");
    }
  }
};