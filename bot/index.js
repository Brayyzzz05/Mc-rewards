import { Client, GatewayIntentBits, Collection, MessageFlags, Events } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import db, { initDB } from "./core/database.js";
import { connectRcon } from "./core/rconHandler.js";
import { deployCommands } from "./core/deployCommands.js";
import { startRewardWorker } from "./systems/rewardQueueWorker.js";
import config from "./config.js";
import { logError, logInfo, logWarn } from "./utils/logger.js";

dotenv.config();

console.log("Starting bot...");

// =====================
// ENV CHECK
// =====================
if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in environment");
  process.exit(1);
}

// Re-export the pool for any legacy importers
export { default as db } from "./core/database.js";

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
    // MessageContent intent intentionally omitted; we only count messages, not read them.
  ]
});

client.commands = new Collection();

// =====================
// LOAD COMMANDS
// =====================
const commandsPath = path.join(process.cwd(), "commands");

async function loadCommands() {
  if (!fs.existsSync(commandsPath)) {
    logWarn("No commands/ directory found");
    return;
  }
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
  const seen = new Set();

  for (const file of files) {
    try {
      const filePath = path.resolve(commandsPath, file);
      const mod = await import(`file://${filePath}`);
      const cmd = mod.default;

      if (!cmd?.data?.name || !cmd?.execute) {
        logWarn(`Skipping ${file}: missing data.name or execute`);
        continue;
      }
      if (seen.has(cmd.data.name)) {
        logWarn(`Duplicate command name "${cmd.data.name}" in ${file} — skipping`);
        continue;
      }
      seen.add(cmd.data.name);
      client.commands.set(cmd.data.name, cmd);
      logInfo(`Loaded command /${cmd.data.name}`);
    } catch (err) {
      logError(`load ${file}`, err);
    }
  }
}

// =====================
// READY
// =====================
client.once(Events.ClientReady, async (c) => {
  logInfo(`Logged in as ${c.user.tag}`);
  // Register slash commands once we know who we are (and we have CLIENT_ID)
  await deployCommands(client);
});

// =====================
// INTERACTIONS
// =====================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) {
    return safeReply(interaction, "Command not found.", true);
  }

  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    await cmd.execute(interaction, { db });
  } catch (err) {
    logError(`/${interaction.commandName}`, err);
    await safeReply(interaction, "Command failed.", true);
  }
});

async function safeReply(interaction, content, ephemeral = false) {
  const payload = ephemeral
    ? { content, flags: MessageFlags.Ephemeral }
    : { content };
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content });
    } else {
      await interaction.reply(payload);
    }
  } catch (err) {
    logError("safeReply", err);
  }
}

// =====================
// MESSAGE TRACKING (ECONOMY) — counts messages, with cooldown
// =====================
const lastCount = new Map();
const COOLDOWN_MS = (config.cooldowns?.message ?? 5) * 1000;

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  if (!msg.guild) return; // ignore DMs

  const now = Date.now();
  const last = lastCount.get(msg.author.id) || 0;
  if (now - last < COOLDOWN_MS) return;
  lastCount.set(msg.author.id, now);

  try {
    await db.query(
      `INSERT INTO user_stats (discord_id, messages)
       VALUES ($1, 1)
       ON CONFLICT (discord_id)
       DO UPDATE SET messages = user_stats.messages + 1,
                     updated_at = NOW()`,
      [msg.author.id]
    );
  } catch (err) {
    logError("message tracking", err);
  }
});

// =====================
// PROCESS-LEVEL SAFETY NETS
// =====================
process.on("unhandledRejection", (err) => logError("unhandledRejection", err));
process.on("uncaughtException", (err) => logError("uncaughtException", err));

async function shutdown(signal) {
  logInfo(`Received ${signal}, shutting down...`);
  try { await client.destroy(); } catch {}
  try { await db.end(); } catch {}
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// =====================
// START
// =====================
(async () => {
  try {
    await initDB();
    await loadCommands();

    // Connect to MC server in the background; don't block bot startup
    connectRcon().catch(err => logError("connectRcon", err));
    startRewardWorker();

    await client.login(process.env.DISCORD_TOKEN);
    logInfo("Bot online");
  } catch (err) {
    logError("STARTUP", err);
    process.exit(1);
  }
})();
