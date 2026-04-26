export default {
    reward: {
      pool: [
        // ── D-TIER  (80%) ────────────────────────────────────────────────
        { tier: "d", cmd: "give {player} oak_log 32",                                                                                                                          chance: 315000 },
        { tier: "d", cmd: "give {player} cooked_beef 16",                                                                                                                      chance: 286000 },
        { tier: "d", cmd: "give {player} torch 32",                                                                                                                            chance: 271000 },
        { tier: "d", cmd: "give {player} coal 16",                                                                                                                             chance: 257000 },
        { tier: "d", cmd: "give {player} red_bed 1",                                                                                                                           chance: 243000 },
        { tier: "d", cmd: "give {player} stone_pickaxe 1 && give {player} stone_axe 1",                                                                                        chance: 228000 },

        // ── C-TIER  (13.3%) ──────────────────────────────────────────────
        { tier: "c", cmd: "give {player} iron_ingot 32",                                                                                                                       chance: 60000 },
        { tier: "c", cmd: "give {player} iron_helmet 1 && give {player} iron_chestplate 1 && give {player} iron_leggings 1 && give {player} iron_boots 1",                    chance: 50000 },
        { tier: "c", cmd: "give {player} bucket 2",                                                                                                                            chance: 40000 },
        { tier: "c", cmd: "give {player} carrot 32 && give {player} potato 32",                                                                                               chance: 37000 },
        { tier: "c", cmd: "give {player} leather 16",                                                                                                                         chance: 30000 },
        { tier: "c", cmd: "give {player} glass 16",                                                                                                                           chance: 27000 },
        { tier: "c", cmd: "give {player} shield 1",                                                                                                                           chance: 23000 },

        // ── B-TIER  (4%) ─────────────────────────────────────────────────
        { tier: "b", cmd: "give {player} diamond 8",                                                                                                                           chance: 20000 },
        { tier: "b", cmd: "give {player} diamond_pickaxe[enchantments={efficiency:4,fortune:3,unbreaking:3}] 1",                                                              chance: 16000 },
        { tier: "b", cmd: "give {player} gold_ingot 32",                                                                                                                      chance: 15000 },
        { tier: "b", cmd: "give {player} experience_bottle 16",                                                                                                               chance: 13000 },
        { tier: "b", cmd: "give {player} enchanted_book[stored_enchantments={mending:1}] 1",                                                                                  chance: 10000 },
        { tier: "b", cmd: "give {player} bow[enchantments={power:3,unbreaking:3}] 1 && give {player} arrow 32",                                                               chance: 6000 },

        // ── A-TIER  (2.7%) ───────────────────────────────────────────────
        { tier: "a", cmd: "give {player} totem_of_undying 2",                                                                                                                  chance: 17000 },
        { tier: "a", cmd: "give {player} enchanted_book[stored_enchantments={mending:1}] 1",                                                                                   chance: 13000 },
        { tier: "a", cmd: "give {player} diamond_chestplate[enchantments={protection:4,unbreaking:3,mending:1}] 1",                                                           chance: 10000 },
        { tier: "a", cmd: "give {player} golden_apple 32",                                                                                                                     chance: 8000 },
        { tier: "a", cmd: "give {player} ancient_debris 16",                                                                                                                   chance: 3000 },
        { tier: "a", cmd: "give {player} breeze_rod 64",                                                                                                                          chance: 5000 },
        { tier: "a", cmd: "give {player} potion[potion_contents={potion:'minecraft:strength'}] 4 && give {player} potion[potion_contents={potion:'minecraft:instant_health'}] 4 && give {player} potion[potion_contents={potion:'minecraft:fire_resistance'}] 4", chance: 2000 },

        // ── S-TIER — God Weapons ─────────────────────────────────────────
        { tier: "s", cmd: "give {player} netherite_sword[custom_name='God Sword',enchantments={sharpness:5,looting:3,fire_aspect:2,unbreaking:3,mending:1}] 1",              chance: 5 },
        { tier: "s", cmd: "give {player} netherite_axe[custom_name='God Axe',enchantments={sharpness:5,efficiency:5,unbreaking:3,mending:1}] 1",                             chance: 4 },
        { tier: "s", cmd: "give {player} bow[custom_name='God Bow',enchantments={power:5,flame:1,infinity:1,unbreaking:3}] 1",                                               chance: 3 },
        { tier: "s", cmd: "give {player} crossbow[custom_name='God Crossbow',enchantments={quick_charge:3,multishot:1,unbreaking:3}] 1",                                     chance: 2 },
        { tier: "s", cmd: "give {player} trident[custom_name='God Trident',enchantments={riptide:3,unbreaking:3,mending:1}] 1",                                              chance: 2 },
        { tier: "s", cmd: "give {player} trident[custom_name='God Trident',enchantments={loyalty:3,channeling:1,impaling:5,unbreaking:3,mending:1}] 1",                      chance: 2 },
        { tier: "s", cmd: "give {player} mace[custom_name='God Mace',enchantments={wind_burst:1,density:5,unbreaking:3,mending:1}] 1",                                       chance: 1 },

        // ── S-TIER — Kits ────────────────────────────────────────────────
        { tier: "s", cmd: "give {player} totem_of_undying 1 && give {player} golden_apple 16 && give {player} firework_rocket 32 && give {player} ender_pearl 16 && give {player} diamond_sword[enchantments={sharpness:5,unbreaking:3}] 1 && give {player} diamond_pickaxe[enchantments={efficiency:5,fortune:3}] 1 && give {player} enchanted_book[stored_enchantments={mending:1}] 1 && give {player} experience_bottle 16 && give {player} obsidian 8 && give {player} water_bucket 1", chance: 1 },
        { tier: "s", cmd: "give {player} beacon 1 && give {player} iron_block 164 && give {player} netherite_ingot 1 && give {player} glass 16 && give {player} obsidian 4 && give {player} iron_pickaxe[enchantments={efficiency:5,unbreaking:3}] 1", chance: 1 },

        // ── JACKPOT  (1 in 2,000,000) ────────────────────────────────────
        { tier: "jackpot", cmd: "give {player} elytra[enchantments={unbreaking:3}] 1 && give {player} totem_of_undying 2 && give {player} golden_apple 32 && give {player} firework_rocket[fireworks={flight:3}] 64 && give {player} netherite_sword[enchantments={sharpness:5,looting:3,fire_aspect:2,unbreaking:3,mending:1}] 1 && give {player} netherite_pickaxe[enchantments={efficiency:5,fortune:3,unbreaking:3,mending:1}] 1 && give {player} enchanted_book[stored_enchantments={mending:1}] 1 && give {player} experience_bottle 32 && give {player} ender_pearl 16", chance: 1 },

      ]
    },

    cooldowns: {
      message: 5
    },

    guaranteedRewards: {
      guaranteedDTierPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedCTierPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedBTierPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedATierPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedSTierPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedJackpotTierPlus: { enabled: false, userId: "1274645481217327108" },
    }
  };
  