import { SlashCommandBuilder } from "discord.js";
import { verifyMC, isValidMcName } from "../systems/verifySystem.js";
import { logError } from "../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Link your Minecraft username to your Discord account")
    .addStringOption(opt =>
      opt.setName("username")
        .setDescription("Your Minecraft Java username (3-16 chars, letters/digits/_)")
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(16)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("username", true).trim();

    if (!isValidMcName(username)) {
      return interaction.editReply("Invalid Minecraft username. Use 3–16 chars: letters, digits, underscore.");
    }

    try {
      const ok = await verifyMC(interaction.user.id, username);
      if (!ok) return interaction.editReply("Could not save your verification. Try again later.");
      return interaction.editReply(`Linked **${username}** to your Discord. You can now use \`/roll\`.`);
    } catch (err) {
      logError("VERIFY COMMAND", err);
      return interaction.editReply("Verification failed.");
    }
  }
};
