import { SlashCommandBuilder } from "discord.js";
import { isValidMcName, verifyMC } from "../core/verifySystem.js";
import { logError } from "../utils/logger.js";

async function mojangLookup(name) {
  try {
    const r = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`);
    if (r.status === 200) {
      const j = await r.json();
      return j?.name || null;
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Link your Minecraft username to your Discord account")
    .addStringOption(o => o.setName("username")
      .setDescription("Your Minecraft username")
      .setRequired(true).setMinLength(1).setMaxLength(16))
    .addStringOption(o => o.setName("type")
      .setDescription("Account type (optional — auto-detect if omitted)")
      .setRequired(false)
      .addChoices(
        { name: "Premium (Mojang/Microsoft)", value: "premium" },
        { name: "Cracked (offline-mode)",     value: "cracked" }
      )),

  async execute(interaction) {
    try {
      const userId  = interaction.user.id;
      const name    = interaction.options.getString("username", true).trim();
      const typeOpt = interaction.options.getString("type");

      if (!isValidMcName(name)) {
        return interaction.editReply("Invalid Minecraft username.");
      }

      let mode = typeOpt;
      let canonical = name;

      if (mode === "premium" || mode === null) {
        const found = await mojangLookup(name);
        if (found) {
          canonical = found;
          mode = "premium";
        } else if (mode === "premium") {
          return interaction.editReply(
            `No premium account found for **${name}**. Re-run with \`type: cracked\` if this is an offline account.`
          );
        } else {
          mode = "cracked";
        }
      }

      const ok = await verifyMC(userId, canonical);
      if (!ok) return interaction.editReply("Could not save your verification. Try again later.");

      const tag = mode === "premium" ? "premium" : "cracked";
      return interaction.editReply(
        `Linked **${canonical}** to your Discord (${tag}). You can now use \`/roll\`.`
      );
    } catch (err) {
      logError("VERIFY COMMAND", err);
      return interaction.editReply("Verification failed.");
    }
  }
};