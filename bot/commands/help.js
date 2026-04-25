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
          "`/roll [amount]` — Roll for a random Minecraft reward (up to 10 at once)",
          "`/odds` — See the chance for each reward tier",
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
          "`/stats` — View your messages, rolls, luck, and linked Minecraft account",
          "`/leaderboard [sort]` — Top 10 players ranked by messages or luck",
          "",
          "**Setup**",
          "`/verify username:<name>` — Link your Minecraft username to your Discord account",
          "",
          "**Admin Only**",
          "`/luckyhour active:<true/false> [multiplier]` — Toggle a server-wide luck multiplier event",
          "`/admin` — Admin management commands",
        ].join("\n")
      );
    }
  };
  