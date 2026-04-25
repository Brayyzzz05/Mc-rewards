import { SlashCommandBuilder } from "discord.js";
import { rollReward } from "../core/rollEngine.js";
import { getMCName } from "../core/verifySystem.js";
import { deliverReward } from "../core/rewardSystem.js";
import { consumeRoll, getStats } from "../core/shopSystem.js";
import { logError } from "../utils/logger.js";

const TIER_LABEL = {
  common:   "Common",
  uncommon: "Uncommon",
  rare:     "Rare",
  veryrare: "Very Rare",
  mythic:   "Mythic",
  ultra:    "Ultra Rare",
  jackpot:  "JACKPOT"
};

export default {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll for a Minecraft reward")
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("How many rolls to use at once (default 1, max 10)")
        .setMinValue(1).setMaxValue(10).setRequired(false)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const amount = interaction.options.getInteger("amount") ?? 1;

      const mcName = await getMCName(userId);
      if (!mcName) {
        return interaction.editReply("You're not verified. Run `/verify username:<your-mc-name>` first.");
      }

      const stats = await getStats(userId);
      if (!stats || stats.rolls < amount) {
        return interaction.editReply(
          `You don't have enough rolls. You have **${stats?.rolls ?? 0}**, need **${amount}**.`
        );
      }

      // Single roll — detailed response
      if (amount === 1) {
        const consumed = await consumeRoll(userId);
        if (!consumed) return interaction.editReply("Could not use a roll. Try again.");

        const result   = await rollReward(userId, mcName);
        const delivery = await deliverReward(userId, mcName, result.cmd, result.tier);
        const tierTxt  = TIER_LABEL[result.tier] || result.tier;

        const queuedReason =
          delivery.reason === "server_offline"
            ? "Server is offline — your reward is queued and will arrive when it's back online."
            : delivery.reason === "player_offline"
              ? "You're not online in-game — your reward is queued and will be delivered when you log in."
              : "Your reward is queued.";

        return interaction.editReply(
          `**${tierTxt}** rolled for **${mcName}**\n\`${result.cmd}\`\n${
            delivery.delivered ? "Sent in-game now." : delivery.queued ? queuedReason : "Could not queue reward, contact an admin."
          }`
        );
      }

      // Multi roll — compact response
      const lines = [];
      for (let i = 0; i < amount; i++) {
        const consumed = await consumeRoll(userId);
        if (!consumed) { lines.push(`Roll ${i + 1}: Could not use roll.`); break; }

        const result   = await rollReward(userId, mcName);
        const delivery = await deliverReward(userId, mcName, result.cmd, result.tier);
        const tierTxt  = TIER_LABEL[result.tier] || result.tier;
        const status   = delivery.delivered ? "delivered" : delivery.queued ? "queued" : "failed";
        const shortCmd = result.cmd.length > 55 ? result.cmd.slice(0, 55) + "..." : result.cmd;

        lines.push(`**${tierTxt}** — \`${shortCmd}\` *(${status})*`);
      }

      return interaction.editReply(
        [`**${amount} rolls** for **${mcName}**:`, "", ...lines].join("\n")
      );
    } catch (err) {
      logError("ROLL COMMAND", err);
      return interaction.editReply("Roll failed.");
    }
  }
};