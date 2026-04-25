import db from "./database.js";

export async function setSetting(key, value) {
  await db.query(
    `INSERT INTO settings(key, value)
     VALUES($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, String(value)]
  );
}

export async function getSetting(key, fallback = null) {
  const res = await db.query(
    "SELECT value FROM settings WHERE key=$1",
    [key]
  );
  return res.rows[0]?.value ?? fallback;
}

export async function getAllSettings() {
  const res = await db.query("SELECT key, value FROM settings");
  const out = {};
  for (const r of res.rows) out[r.key] = r.value;
  return out;
}
