import { Rcon } from "rcon-client";
import { EventEmitter } from "events";
import { logError, logInfo, logWarn } from "../utils/logger.js";

let rcon = null;
let connected = false;
let connecting = false;
let retry = 5000;
const MAX_RETRY = 60000;

const PRESENCE_POLL_MS = 3000;
let onlinePlayers = new Set();
export const presence = new EventEmitter();

function configured() {
  return Boolean(
    process.env.RCON_HOST &&
    process.env.RCON_PORT &&
    process.env.RCON_PASSWORD
  );
}

export function isRconConnected() {
  return connected;
}

/** Case-insensitive online check (Minecraft Java usernames are case-insensitive in practice). */
export function isPlayerOnline(name) {
  if (!name) return false;
  return onlinePlayers.has(name.toLowerCase());
}

export function getOnlinePlayers() {
  return Array.from(onlinePlayers);
}

export async function connectRcon() {
  if (!configured()) {
    logWarn("RCON not configured (RCON_HOST/PORT/PASSWORD missing) — in-game delivery disabled, rewards will be queued");
    return;
  }
  if (connecting) return;
  connecting = true;

  try {
    logInfo("Connecting RCON...");
    rcon = await Rcon.connect({
      host: process.env.RCON_HOST,
      port: Number(process.env.RCON_PORT),
      password: process.env.RCON_PASSWORD
    });

    rcon.on("end", () => {
      connected = false;
      onlinePlayers = new Set();
      logWarn("RCON connection ended, will retry");
      scheduleReconnect();
    });

    rcon.on("error", (err) => {
      logError("RCON SOCKET", err);
      connected = false;
    });

    const initial = await rcon.send("list");
    updatePresenceFromList(initial);

    connected = true;
    retry = 5000;
    logInfo("RCON connected");
  } catch (err) {
    connected = false;
    logWarn(`RCON offline (${err?.message || err}); retrying in ${retry / 1000}s`);
    scheduleReconnect();
  } finally {
    connecting = false;
  }
}

function scheduleReconnect() {
  setTimeout(() => connectRcon(), retry);
  retry = Math.min(retry * 2, MAX_RETRY);
}

export async function runCommand(cmd) {
  if (!rcon || !connected) throw new Error("RCON_OFFLINE");
  try {
    // rcon-client doesn't support && chains; split on && and run sequentially
    const parts = cmd.split("&&").map(s => s.trim()).filter(Boolean);
    const results = [];
    for (const part of parts) {
      results.push(await rcon.send(part));
    }
    return results.join(" | ");
  } catch (err) {
    connected = false;
    scheduleReconnect();
    throw err;
  }
}

/**
 * Parse the response of `list`. Vanilla format:
 *   "There are X of a max of Y players online: name1, name2, name3"
 * Some forks (Paper/Spigot/Folia) include extra info but the post-colon
 * comma list is reliable. If there are no players, the segment after the
 * colon is empty.
 */
function parseListResponse(text) {
  if (!text || typeof text !== "string") return [];
  // Strip Minecraft section signs / color codes
  const clean = text.replace(/\u00A7./g, "");
  const colonIdx = clean.indexOf(":");
  if (colonIdx === -1) return [];
  const after = clean.slice(colonIdx + 1).trim();
  if (!after) return [];
  return after
    .split(",")
    .map(s => s.trim())
    .map(s => s.split(/\s+/)[0])      // strip "(role)" suffixes if present
    .filter(s => /^[A-Za-z0-9_]{1,16}$/.test(s));
}

function updatePresenceFromList(text) {
  const names = parseListResponse(text);
  const next = new Set(names.map(n => n.toLowerCase()));

  // Diff to emit join/leave
  const joined = [];
  const left = [];
  for (const n of next) if (!onlinePlayers.has(n)) joined.push(n);
  for (const n of onlinePlayers) if (!next.has(n)) left.push(n);

  onlinePlayers = next;

  for (const n of joined) presence.emit("join", n);
  for (const n of left) presence.emit("leave", n);
}

// Presence + heartbeat poller (acts as RCON heartbeat too)
setInterval(async () => {
  if (!connected || !rcon) return;
  try {
    const res = await rcon.send("list");
    updatePresenceFromList(res);
  } catch {
    connected = false;
    onlinePlayers = new Set();
    scheduleReconnect();
  }
}, PRESENCE_POLL_MS);
