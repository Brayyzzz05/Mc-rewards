import db from "../core/database.js";
import { logError } from "../utils/logger.js";

// =====================
// LINK MC ACCOUNT
// =====================
export async function verifyMC(discordId, mcName) {
  try {
    await db.query(
      `INSERT INTO mc_verifications(discord_id, minecraft_username, verified_at)
       VALUES($1, $2, NOW())
       ON CONFLICT (discord_id)
       DO UPDATE SET minecraft_username = EXCLUDED.minecraft_username,
                     verified_at = NOW()`,
      [discordId, mcName]
    );
    return true;
  } catch (err) {
    logError("verifyMC", err);
    return false;
  }
}

// =====================
// GET MC NAME
// =====================
export async function getMCName(discordId) {
  try {
    const res = await db.query(
      "SELECT minecraft_username FROM mc_verifications WHERE discord_id=$1",
      [discordId]
    );
    return res.rows[0]?.minecraft_username || null;
  } catch (err) {
    logError("getMCName", err);
    return null;
  }
}

// =====================
// CHECK IF VERIFIED
// =====================
export async function isVerified(discordId) {
  try {
    const res = await db.query(
      "SELECT 1 FROM mc_verifications WHERE discord_id=$1",
      [discordId]
    );
    return res.rows.length > 0;
  } catch (err) {
    logError("isVerified", err);
    return false;
  }
}

// Basic Minecraft username validation (Java edition rules: 3-16 chars, [A-Za-z0-9_])
export function isValidMcName(name) {
  return typeof name === "string" && /^[A-Za-z0-9_]{3,16}$/.test(name);
}
