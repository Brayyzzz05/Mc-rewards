import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
    import { setSetting, getAllSettings } from "../core/settings.js";
    import { verifyMC, isValidMcName } from "../core/verifySystem.js";
    import { logError } from "../utils/logger.js";
    import db from "../core/database.js";

    export default {
      data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin control panel")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(s =>
          s.setName("forceverify")
            .setDescription("Manually link a Discord user to a Minecraft username")
            .addUserOption(o => o.setName("user").setDescription("Discord user to verify").setRequired(true))
            .addStringOption(o =>
              o.setName("username").setDescription("Minecraft username to link").setRequired(true).setMinLength(1).setMaxLength(16)
            )
        )
        .addSubcommand(s =>
          s.setName("setluck")
            .setDescription("Set the global luck multiplier (e.g. 1.5)")
            .addNumberOption(o =>
              o.setName("value").setDescription("Multiplier, min 0.1").setRequired(true).setMinValue(0.1).setMaxValue(100)
            )
        )
        .addSubcommand(s =>
          s.setName("setmessage")
            .setDescription("Set the public roll announcement template")
            .addStringOption(o =>
              o.setName("text").setDescription("Use {player} and {reward} placeholders").setRequired(true)
            )
        )
        .addSubcommand(s =>
          s.setName("setroll")
            .setDescription("Override base chance for a tier (in raw weight)")
            .addStringOption(o =>
              o.setName("tier").setDescription("Tier name").setRequired(true)
                .addChoices(
                  { name: "common", value: "common" },
                  { name: "uncommon", value: "uncommon" },
                  { name: "rare", value: "rare" },
                  { name: "veryrare", value: "veryrare" },
                  { name: "mythic", value: "mythic" },
                  { name: "ultra", value: "ultra" },
                  { name: "jackpot", value: "jackpot" }
                )
            )
            .addIntegerOption(o =>
              o.setName("weight").setDescription("Raw weight value").setRequired(true).setMinValue(0)
            )
        )
        .addSubcommand(s =>
          s.setName("giverolls")
            .setDescription("Give rolls to a user")
            .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
            .addIntegerOption(o => o.setName("amount").setDescription("How many").setRequired(true).setMinValue(1))
        )
        .addSubcommand(s =>
          s.setName("setrolls")
            .setDescription("Set a user's rolls to an exact number")
            .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
            .addIntegerOption(o => o.setName("amount").setDescription("Exact roll count to set").setRequired(true).setMinValue(0))
        )
        .addSubcommand(s =>
          s.setName("resetrolls")
            .setDescription("Reset a user's rolls back to 0")
            .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
        )
        .addSubcommand(s =>
          s.setName("givemessages")
            .setDescription("Give messages (currency) to a user")
            .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
            .addIntegerOption(o => o.setName("amount").setDescription("How many").setRequired(true).setMinValue(1))
        )
        .addSubcommand(s =>
          s.setName("setuserluck")
            .setDescription("Set a user's luck multiplier directly")
            .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
            .addNumberOption(o =>
              o.setName("multiplier").setDescription("Luck multiplier (e.g. 1.5)").setRequired(true).setMinValue(0.1).setMaxValue(100)
            )
        )
        .addSubcommand(s =>
          s.setName("settings")
            .setDescription("Show current settings")
        )
        .addSubcommand(s =>
          s.setName("queue")
            .setDescription("Show pending reward queue size")
        ),

      async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        try {
          if (sub === "forceverify") {
            const user = interaction.options.getUser("user", true);
            const username = interaction.options.getString("username", true).trim();

            if (!isValidMcName(username)) {
              return interaction.editReply("Invalid Minecraft username. Must be 1–16 characters, letters/numbers/underscores only.");
            }

            const ok = await verifyMC(user.id, username);
            if (!ok) return interaction.editReply("Could not save verification. Try again.");

            return interaction.editReply(
              `Linked **${username}** to <@${user.id}>. They can now use \`/roll\`.`
            );
          }

          if (sub === "setluck") {
            const v = interaction.options.getNumber("value", true);
            await setSetting("luck_multiplier", v);
            return interaction.editReply(`Luck multiplier set to **${v}**`);
          }

          if (sub === "setmessage") {
            const v = interaction.options.getString("text", true);
            await setSetting("roll_message", v);
            return interaction.editReply("Roll message updated");
          }

          if (sub === "setroll") {
            const tier = interaction.options.getString("tier", true);
            const weight = interaction.options.getInteger("weight", true);
            await setSetting(`roll_${tier}`, weight);
            return interaction.editReply(`Tier **${tier}** weight set to **${weight}**`);
          }

          if (sub === "giverolls" || sub === "givemessages") {
            const user = interaction.options.getUser("user", true);
            const amount = interaction.options.getInteger("amount", true);
            const col = sub === "giverolls" ? "rolls" : "messages";
            await db.query(
              `INSERT INTO user_stats (discord_id, ${col}) VALUES ($1, $2)
               ON CONFLICT (discord_id) DO UPDATE SET ${col} = user_stats.${col} + $2,
                                                      updated_at = NOW()`,
              [user.id, amount]
            );
            return interaction.editReply(`Granted ${amount} ${col} to <@${user.id}>`);
          }

          if (sub === "setrolls") {
            const user = interaction.options.getUser("user", true);
            const amount = interaction.options.getInteger("amount", true);
            await db.query(
              `INSERT INTO user_stats (discord_id, rolls) VALUES ($1, $2)
               ON CONFLICT (discord_id) DO UPDATE SET rolls = $2,
                                                      updated_at = NOW()`,
              [user.id, amount]
            );
            return interaction.editReply(`Set <@${user.id}>'s rolls to **${amount}**`);
          }

          if (sub === "resetrolls") {
            const user = interaction.options.getUser("user", true);
            await db.query(
              `INSERT INTO user_stats (discord_id, rolls) VALUES ($1, 0)
               ON CONFLICT (discord_id) DO UPDATE SET rolls = 0, updated_at = NOW()`,
              [user.id]
            );
            return interaction.editReply(`Reset <@${user.id}>'s rolls to **0**`);
          }

          if (sub === "setuserluck") {
            const user = interaction.options.getUser("user", true);
            const multiplier = interaction.options.getNumber("multiplier", true);
            await db.query(
              `INSERT INTO user_stats (discord_id, luck_multiplier) VALUES ($1, $2)
               ON CONFLICT (discord_id) DO UPDATE SET luck_multiplier = $2,
                                                      updated_at = NOW()`,
              [user.id, multiplier]
            );
            return interaction.editReply(`Set <@${user.id}>'s luck multiplier to **${multiplier.toFixed(2)}x**`);
          }

          if (sub === "settings") {
            const all = await getAllSettings();
            const keys = Object.keys(all);
            if (!keys.length) return interaction.editReply("_No settings stored_");
            return interaction.editReply(
              "**Settings**\n" + keys.map(k => `• \`${k}\` = \`${all[k]}\``).join("\n")
            );
          }

          if (sub === "queue") {
            const res = await db.query(
              `SELECT status, COUNT(*)::int AS n FROM reward_queue GROUP BY status`
            );
            if (!res.rows.length) return interaction.editReply("Queue is empty");
            return interaction.editReply(
              "**Queue**\n" + res.rows.map(r => `• ${r.status}: ${r.n}`).join("\n")
            );
          }

          return interaction.editReply("Unknown action");
        } catch (err) {
          logError("ADMIN COMMAND", err);
          return interaction.editReply("Admin command failed.");
        }
      }
    };
  