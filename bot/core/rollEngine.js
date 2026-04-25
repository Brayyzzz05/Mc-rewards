import config from "../config.js";
import { getSetting } from "../core/settings.js";
import { getUserLuck } from "./shopSystem.js";

const TIER_RANK = {
  common: 1,
  uncommon: 2,
  rare: 3,
  veryrare: 4,
  mythic: 5,
  ultra: 6,
  jackpot: 7
};

export async function rollReward(userId, mcName) {
  const pool = config.reward.pool;

  const globalLuckRaw = await getSetting("luck_multiplier", "1");
  const globalLuck = Math.max(0.1, parseFloat(globalLuckRaw) || 1);
  const userLuck = Math.max(0.1, await getUserLuck(userId));
  const luck = globalLuck * userLuck;

  // Check DB for guaranteed minimum tier (set via /admin setguarantee)
  const dbGuarantee = await getSetting(`guarantee_${userId}`, null);
  const minRank = dbGuarantee && TIER_RANK[dbGuarantee] ? TIER_RANK[dbGuarantee] : 0;

  const eligible = pool.filter(r => (TIER_RANK[r.tier] || 0) >= minRank);
  const usePool = eligible.length ? eligible : pool;

  const weighted = usePool.map(r => {
    const rank = TIER_RANK[r.tier] || 1;
    const boost = luck > 1 ? Math.pow(luck, Math.max(0, rank - 1) * 0.5) : 1;
    return { ...r, weight: r.chance * boost };
  });

  const total = weighted.reduce((a, b) => a + b.weight, 0);
  let roll = Math.random() * total;

  for (const r of weighted) {
    roll -= r.weight;
    if (roll <= 0) {
      return { tier: r.tier, cmd: r.cmd.replaceAll("{player}", mcName), luckUsed: luck };
    }
  }

  const fallback = weighted[0];
  return { tier: fallback.tier, cmd: fallback.cmd.replaceAll("{player}", mcName), luckUsed: luck };
}