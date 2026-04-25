import { SlashCommandBuilder } from "discord.js";
import { rollReward } from "../systems/rollEngine.js";
import { getMCName } from "../systems/verifySystem.js";
import { deliverReward } from "../systems/rewardSystem.js";
import { consumeRoll, getStats } from "../systems/shopSystem.js";
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
    .setDescription("Roll for a Minecraft reward (uses 1 roll)"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      const mcName = await getMCName(userId);
      if (!mcName) {
        return interaction.editReply("You're not verified. Run `/verify username:<your-mc-name>` first.");
      }

      const stats = await getStats(userId);
      if (!stats || stats.rolls < 1) {
        return interaction.editReply(
          "You have no rolls. Earn messages by chatting, then buy rolls with `/shop buy item:roll`."
        );
      }

      const consumed = await consumeRoll(userId);
      if (!consumed) {
        return interaction.editReply("Could not use a roll. Try again.");
      }

      const result = await rollReward(userId, mcName);
      const delivery = await deliverReward(userId, mcName, result.cmd, result.tier);

      const tierTxt = TIER_LABEL[result.tier] || result.tier || "Reward";
      const queuedReason =
        delivery.reason === "server_offline"
          ? "Server is offline — your reward is queued and will arrive when it's back online."
          : delivery.reason === "player_offline"
            ? "You're not online in-game right now — your reward is queued and will be delivered the moment you log in."
            : "Your reward is queued.";
      const status = delivery.delivered
        ? "Sent in-game now."
        : delivery.queued
          ? queuedReason
          : "Could not queue reward, contact an admin.";

      return interaction.editReply(
        `🎰 **${tierTxt}** rolled for **${mcName}**\n\`${result.cmd}\`\n${status}`
      );
    } catch (err) {
      logError("ROLL COMMAND", err);
      return interaction.editReply("Roll failed.");
    }
  }
};
