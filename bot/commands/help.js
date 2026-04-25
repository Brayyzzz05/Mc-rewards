import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands"),

  async execute(interaction) {
    return interaction.editReply(
      [
        "**Commands**",
        "",
        "**Rewards**",
        "`/roll` — Use 1 roll to win a random Minecraft reward",
        "`/odds` — See the odds for each reward tier",
        "",
        "**Economy**",
        "`/daily` — Claim 2 free rolls every 24 hours",
        "`/weekly` — Claim 7 free rolls every 7 days",
        "`/shop list` — See what you can buy with messages",
        "`/shop buy item:<name>` — Buy rolls or luck from the shop",
        "`/gift @user <amount>` — Send some of your rolls to another user",
        "",
        "**Progression**",
        "`/prestige` — Spend messages and rolls for a permanent +0.25 luck boost (max 5)",
        "`/stats` — View your messages, rolls, luck, prestige, and cooldown timers",
        "",
        "**Setup**",
        "`/verify username:<name>` — Link your Minecraft username to your Discord account",
      ].join("\n")
    );
  }
};