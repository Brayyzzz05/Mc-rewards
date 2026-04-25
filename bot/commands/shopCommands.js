import { SlashCommandBuilder } from "discord.js";
import { buyItem, SHOP_ITEMS } from "../systems/shopSystem.js";
import { logError } from "../utils/logger.js";

const ITEM_CHOICES = Object.keys(SHOP_ITEMS).map(k => ({ name: k, value: k }));

export default {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Reward shop (currency: messages)")
    .addSubcommand(s =>
      s.setName("list").setDescription("Show items for sale")
    )
    .addSubcommand(s =>
      s.setName("buy")
        .setDescription("Buy an item with messages")
        .addStringOption(o =>
          o.setName("item")
            .setDescription("What to buy")
            .setRequired(true)
            .addChoices(...ITEM_CHOICES)
        )
        .addIntegerOption(o =>
          o.setName("amount")
            .setDescription("How many bundles (default 1)")
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();

      if (sub === "list") {
        const lines = ["**Shop** — currency is messages"];
        for (const [key, def] of Object.entries(SHOP_ITEMS)) {
          const parts = [];
          if (def.apply.rolls) parts.push(`+${def.apply.rolls} roll${def.apply.rolls > 1 ? "s" : ""}`);
          if (def.apply.luck)  parts.push(`+${def.apply.luck.toFixed(2)} luck multiplier`);
          lines.push(`• \`${key}\` — ${def.cost} messages → ${parts.join(", ")}`);
        }
        lines.push("", "Use `/shop buy item:<name> amount:<n>`.");
        return interaction.editReply(lines.join("\n"));
      }

      if (sub === "buy") {
        const item = interaction.options.getString("item", true);
        const amount = interaction.options.getInteger("amount") ?? 1;
        const res = await buyItem(interaction.user.id, item, amount);
        return interaction.editReply(res);
      }

      return interaction.editReply("Unknown subcommand.");
    } catch (err) {
      logError("SHOP COMMAND", err);
      return interaction.editReply("Shop failed.");
    }
  }
};
