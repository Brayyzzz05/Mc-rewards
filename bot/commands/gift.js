import { SlashCommandBuilder } from "discord.js";
import { logError } from "../utils/logger.js";
import db from "../core/database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("Gift some of your rolls to another user")
    .addUserOption(o =>
      o.setName("user").setDescription("Who to gift rolls to").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount").setDescription("How many rolls to gift").setRequired(true).setMinValue(1).setMaxValue(50)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const target = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);

      if (target.id === userId) {
        return interaction.editReply("You can't gift rolls to yourself.");
      }
      if (target.bot) {
        return interaction.editReply("You can't gift rolls to a bot.");
      }

      const client = await db.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `INSERT INTO user_stats (discord_id) VALUES ($1) ON CONFLICT (discord_id) DO NOTHING`,
          [userId]
        );

        const cur = await client.query(
          `SELECT rolls FROM user_stats WHERE discord_id=$1 FOR UPDATE`,
          [userId]
        );
        const have = cur.rows[0]?.rolls ?? 0;

        if (have < amount) {
          await client.query("ROLLBACK");
          return interaction.editReply(
            `You don't have enough rolls. You have **${have}**, tried to gift **${amount}**.`
          );
        }

        await client.query(
          `UPDATE user_stats SET rolls = rolls - $1, updated_at = NOW() WHERE discord_id = $2`,
          [amount, userId]
        );

        await client.query(
          `INSERT INTO user_stats (discord_id, rolls) VALUES ($1, $2)
           ON CONFLICT (discord_id) DO UPDATE SET rolls = user_stats.rolls + $2, updated_at = NOW()`,
          [target.id, amount]
        );

        await client.query("COMMIT");
        return interaction.editReply(
          `Gifted **${amount} roll${amount > 1 ? "s" : ""}** to <@${target.id}>!`
        );
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logError("GIFT COMMAND", err);
      return interaction.editReply("Could not send gift. Try again later.");
    }
  }
};