import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { logError, logInfo, logWarn } from "../utils/logger.js";

dotenv.config();

export async function deployCommands(client) {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token) throw new Error("Missing DISCORD_TOKEN");
  if (!clientId) {
    logWarn("CLIENT_ID is not set; cannot register slash commands. Set CLIENT_ID in your .env (your bot's Application ID).");
    return;
  }

  const commandsJSON = [];

  if (client?.commands?.size) {
    for (const cmd of client.commands.values()) {
      commandsJSON.push(cmd.data.toJSON());
    }
  } else {
    // Standalone mode: load directly from disk
    const commandsPath = path.join(process.cwd(), "commands");
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
    for (const f of files) {
      const mod = await import(`file://${path.resolve(commandsPath, f)}`);
      const cmd = mod.default;
      if (cmd?.data?.toJSON) commandsJSON.push(cmd.data.toJSON());
    }
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    if (guildId) {
      logInfo(`Registering ${commandsJSON.length} guild commands to ${guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandsJSON }
      );
      logInfo("Guild commands registered (instant update)");
    } else {
      logInfo(`Registering ${commandsJSON.length} global commands...`);
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsJSON }
      );
      logInfo("Global commands registered (may take up to 1 hour to appear)");
    }
  } catch (err) {
    logError("DEPLOY COMMANDS", err);
  }
}

// Allow running standalone:  node core/deployCommands.js
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCommands(null).then(() => process.exit(0));
}
