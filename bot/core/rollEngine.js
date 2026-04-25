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

const GUARANTEED_MAP = {
  guaranteedCommonPlus:   "common",
  guaranteedUncommonPlus: "uncommon",
  guaranteedRarePlus:     "rare",
  guaranteedVeryRarePlus: "veryrare",
  guaranteedMythicPlus:   "mythic",
  guaranteedUltraPlus:    "ultra",
  guaranteedJackpotPlus:  "jackpot"
};

function minTierForUser(userId) {
  let best = 0;
  for (const [key, tier] of Object.entries(GUARANTEED_MAP)) {
    const g = config.guaranteedRewards?.[key];
    if (!g?.enabled) continue;
    const ids = Array.isArray(g.userId) ? g.userId : [g.userId];
    if (ids.includes(userId)) {
      best = Math.max(best, TIER_RANK[tier] || 0);
    }
  }
  return best;
}

export async function rollReward(userId, mcName) {
  const pool = config.reward.pool;

  const [globalLuckRaw, userLuck, luckyHourActive, luckyHourMultRaw] = await Promise.all([
    getSetting("luck_multiplier",    "1"),
    getUserLuck(userId),
    getSetting("luckyhour_active",   "false"),
    getSetting("luckyhour_multiplier", "5")
  ]);

  const globalLuck     = Math.max(0.1, parseFloat(globalLuckRaw) || 1);
  const luckyHourMult  = luckyHourActive === "true" ? Math.max(1, parseFloat(luckyHourMultRaw) || 5) : 1;
  const luck           = Math.max(0.1, globalLuck * userLuck) * luckyHourMult;

  const minRank = minTierForUser(userId);

  const eligible = pool.filter(r => (TIER_RANK[r.tier] || 0) >= minRank);
  const usePool  = eligible.length ? eligible : pool;

  const weighted = usePool.map(r => {
    const rank  = TIER_RANK[r.tier] || 1;
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