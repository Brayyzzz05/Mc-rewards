import { SlashCommandBuilder } from "discord.js";
import { logError } from "../utils/logger.js";
import db from "../core/database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top players")
    .addStringOption(o =>
      o.setName("sort")
        .setDescription("What to rank by (default: messages)")
        .setRequired(false)
        .addChoices(
          { name: "Messages", value: "messages" },
          { name: "Luck",     value: "luck_multiplier" }
        )
    ),

  async execute(interaction) {
    try {
      const sort   = interaction.options.getString("sort") ?? "messages";
      const column = sort === "luck_multiplier" ? "luck_multiplier" : "messages";
      const label  = sort === "luck_multiplier" ? "Luck" : "Messages";

      const res = await db.query(
        `SELECT u.discord_id, u.messages, u.luck_multiplier, v.minecraft_username
         FROM user_stats u
         LEFT JOIN mc_verifications v ON u.discord_id = v.discord_id
         ORDER BY u.${column} DESC
         LIMIT 10`
      );

      if (!res.rows.length) return interaction.editReply("No data yet.");

      const medals = ["🥇", "🥈", "🥉"];
      const lines  = [`**Leaderboard — Top ${label}**`, ""];

      res.rows.forEach((row, i) => {
        const place = medals[i] || `${i + 1}.`;
        const name  = row.minecraft_username ? `**${row.minecraft_username}**` : `<@${row.discord_id}>`;
        const value = sort === "luck_multiplier"
          ? `${Number(row.luck_multiplier).toFixed(2)}x luck`
          : `${row.messages} messages`;
        lines.push(`${place} ${name} — ${value}`);
      });

      return interaction.editReply(lines.join("\n"));
    } catch (err) {
      logError("LEADERBOARD COMMAND", err);
      return interaction.editReply("Could not load leaderboard.");
    }
  }
};