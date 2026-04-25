import { SlashCommandBuilder } from "discord.js";
import db from "../core/database.js";
import { runCommand, isRconConnected, isPlayerOnline } from "../core/rconHandler.js";
import { isValidMcName, verifyMC } from "../core/verifySystem.js";
import { logError } from "../utils/logger.js";

const CODE_TTL_MIN = 5;

async function mojangLookup(name) {
  try {
    const r = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`);
    if (r.status === 200) {
      const j = await r.json();
      return j?.name || null;       // canonical case from Mojang
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Link your Minecraft account")
    .addSubcommand(s => s.setName("start")
      .setDescription("Start verification")
      .addStringOption(o => o.setName("username")
        .setDescription("Your Minecraft username")
        .setRequired(true).setMinLength(1).setMaxLength(16))
      .addStringOption(o => o.setName("type")
        .setDescription("Account type (optional — auto-detect if omitted)")
        .setRequired(false)
        .addChoices(
          { name: "Premium (Mojang/Microsoft)", value: "premium" },
          { name: "Cracked (offline-mode)",     value: "cracked" }
        )))
    .addSubcommand(s => s.setName("confirm")
      .setDescription("Confirm after running /trigger in-game (cracked only)")),

  async execute(interaction) {
    const sub    = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    try {
      if (sub === "start") {
        const name = interaction.options.getString("username", true).trim();
        const typeOpt = interaction.options.getString("type"); // "premium" | "cracked" | null

        if (!isValidMcName(name)) return interaction.editReply("Invalid username.");

        // Decide flow
        let mode = typeOpt;
        let canonical = name;

        if (mode === "premium" || mode === null) {
          const found = await mojangLookup(name);
          if (found) {
            canonical = found;
            mode = "premium";
          } else if (mode === "premium") {
            return interaction.editReply(`No premium account found for **${name}**. Re-run with \`type: cracked\` if this is an offline account.`);
          } else {
            mode = "cracked"; // auto-detect fallback
          }
        }

        if (mode === "premium") {
          await verifyMC(userId, canonical);
          return interaction.editReply(`Verified **${canonical}** (premium). You can now \`/roll\`.`);
        }

        // Cracked path — in-game challenge
        if (!isRconConnected())  return interaction.editReply("Server is offline, try again later.");
        if (!isPlayerOnline(name)) {
          return interaction.editReply(`**${name}** isn't online. Join the server, then run \`/verify start\` again.`);
        }

        const code = Math.floor(100000 + Math.random() * 900000);
        await db.query(
          `INSERT INTO pending_verifications(discord_id, minecraft_username, code, expires_at)
           VALUES ($1,$2,$3, NOW() + INTERVAL '${CODE_TTL_MIN} minutes')
           ON CONFLICT (discord_id) DO UPDATE
           SET minecraft_username=EXCLUDED.minecraft_username,
               code=EXCLUDED.code, expires_at=EXCLUDED.expires_at`,
          [userId, name, code]
        );

        await runCommand(`scoreboard objectives add mcr_verify trigger`).catch(() => {});
        await runCommand(`scoreboard players reset ${name} mcr_verify`).catch(() => {});
        await runCommand(`scoreboard players enable ${name} mcr_verify`);
        await runCommand(
          `tellraw ${name} {"text":"Run in chat to link Discord: /trigger mcr_verify set ${code}","color":"yellow"}`
        );

        return interaction.editReply(
          `Sent a code to **${name}** in-game. Run \`/trigger mcr_verify set <code>\` in chat, then \`/verify confirm\`.`
        );
      }

      if (sub === "confirm") {
        const res = await db.query(
          `SELECT minecraft_username, code, expires_at
           FROM pending_verifications WHERE discord_id=$1`, [userId]);
        const row = res.rows[0];
        if (!row) return interaction.editReply("No pending verification — run `/verify start` first.");
        if (new Date(row.expires_at) < new Date())
          return interaction.editReply("Code expired. Run `/verify start` again.");

        const out = await runCommand(`scoreboard players get ${row.minecraft_username} mcr_verify`);
        const m = /has\s+(-?\d+)/i.exec(out);
        if (!m)                  return interaction.editReply("You haven't entered the code in-game yet.");
        if (parseInt(m[1], 10) !== row.code)
                                 return interaction.editReply("Wrong code. Try again or restart.");

        await verifyMC(userId, row.minecraft_username);
        await db.query(`DELETE FROM pending_verifications WHERE discord_id=$1`, [userId]);
        await runCommand(`scoreboard players reset ${row.minecraft_username} mcr_verify`).catch(() => {});

        return interaction.editReply(`Verified **${row.minecraft_username}** (cracked). You can now \`/roll\`.`);
      }
    } catch (err) {
      logError("VERIFY COMMAND", err);
      return interaction.editReply("Verification failed.");
    }
  }
};