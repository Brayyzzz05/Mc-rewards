import { SlashCommandBuilder } from "discord.js";
import config from "../config.js";

const TIER_ORDER = ["common", "uncommon", "rare", "veryrare", "mythic", "ultra", "jackpot"];

const TIER_LABEL = {
  common:   "Common",
  uncommon: "Uncommon",
  rare:     "Rare",
  veryrare: "Very Rare",
  mythic:   "Mythic",
  ultra:    "Ultra Rare",
  jackpot:  "Jackpot"
};

export default {
  data: new SlashCommandBuilder()
    .setName("odds")
    .setDescription("Show the odds of rolling each reward tier"),

  async execute(interaction) {
    const pool = config.reward.pool;

    // Sum weights per tier
    const tierWeights = {};
    let grandTotal = 0;
    for (const item of pool) {
      tierWeights[item.tier] = (tierWeights[item.tier] || 0) + item.chance;
      grandTotal += item.chance;
    }

    const lines = ["**Reward Odds**", ""];

    for (const tier of TIER_ORDER) {
      const weight = tierWeights[tier];
      if (!weight) continue;

      const pct = (weight / grandTotal) * 100;
      const oneIn = Math.round(grandTotal / weight);
      const label = TIER_LABEL[tier] || tier;

      // Format percentage — show more decimals for rarer tiers
      const pctStr = pct >= 1
        ? pct.toFixed(2) + "%"
        : pct >= 0.01
          ? pct.toFixed(4) + "%"
          : pct.toFixed(6) + "%";

      lines.push(`**${label}** — ${pctStr} (1 in ${oneIn.toLocaleString()})`);
    }

    return interaction.editReply(lines.join("\n"));
  }
};