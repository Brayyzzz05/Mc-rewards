export default {
  reward: {
    pool: [
      { tier: "common",       cmd: "give {player} oak_log 64",        chance: 300000 },
      { tier: "common",       cmd: "give {player} bread 64",          chance: 280000 },
      { tier: "common",       cmd: "give {player} coal 64",           chance: 260000 },
      { tier: "common",       cmd: "give {player} iron_ingot 64",     chance: 240000 },

      { tier: "uncommon",     cmd: "give {player} gold_ingot 32",     chance: 90000 },
      { tier: "uncommon",     cmd: "give {player} emerald 32",        chance: 60000 },

      { tier: "rare",         cmd: "give {player} diamond 16",        chance: 15000 },
      { tier: "rare",         cmd: "give {player} breeze_rod 16",     chance: 12000 },
      { tier: "rare",         cmd: "give {player} golden_apple 16",   chance: 10000 },

      { tier: "veryrare",     cmd: "give {player} netherite_ingot 1", chance: 2000 },

      { tier: "mythic",       cmd: "give {player} enchanted_golden_apple 1", chance: 200 },

      { tier: "ultra",        cmd: "give {player} elytra 1",          chance: 50 },

      {
        tier: "jackpot",
        cmd: "give {player} minecraft:beacon 4 && give {player} minecraft:netherite_block 1 && give {player} minecraft:diamond_block 12 && give {player} minecraft:gold_block 16 && give {player} minecraft:iron_block 32 && give {player} minecraft:mace[minecraft:enchantments={levels:{\"minecraft:wind_burst\":1,\"minecraft:unbreaking\":3,\"minecraft:density\":5,\"minecraft:mending\":1}}] 1",
        chance: 10
      }
    ]
  },

  cooldowns: {
    message: 5
  },

  guaranteedRewards: {
    guaranteedCommonPlus:   { enabled: false, userId: "1274645481217327108" },
    guaranteedUncommonPlus: { enabled: false, userId: "1274645481217327108" },
    guaranteedRarePlus:     { enabled: false, userId: "1274645481217327108" },
    guaranteedVeryRarePlus: { enabled: false, userId: "1274645481217327108" },
    guaranteedMythicPlus:   { enabled: false, userId: "1274645481217327108" },
    guaranteedUltraPlus:    { enabled: false, userId: "1274645481217327108" },
    guaranteedJackpotPlus:  { enabled: false, userId: "1274645481217327108" }
  }
};