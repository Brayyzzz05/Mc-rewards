export default {
    reward: {
      pool: [
        // ── D-TIER ──────────────────────────────────────────────────────
        { tier: "d", cmd: "give {player} oak_log 32",                                                                                                                          chance: 300000 },
        { tier: "d", cmd: "give {player} cooked_beef 16",                                                                                                                      chance: 280000 },
        { tier: "d", cmd: "give {player} torch 32",                                                                                                                            chance: 260000 },
        { tier: "d", cmd: "give {player} coal 16",                                                                                                                             chance: 240000 },
        { tier: "d", cmd: "give {player} red_bed 1",                                                                                                                          chance: 220000 },
        { tier: "d", cmd: "give {player} stone_pickaxe 1 && give {player} stone_axe 1",                                                                                       chance: 200000 },

        // ── C-TIER ──────────────────────────────────────────────────────
        { tier: "c", cmd: "give {player} iron_ingot 32",                                                                                                                       chance: 45000 },
        { tier: "c", cmd: "give {player} iron_helmet 1 && give {player} iron_chestplate 1 && give {player} iron_leggings 1 && give {player} iron_boots 1",                    chance: 38000 },
        { tier: "c", cmd: "give {player} bucket 2",                                                                                                                            chance: 25000 },
        { tier: "c", cmd: "give {player} carrot 32 && give {player} potato 32",                                                                                               chance: 20000 },
        { tier: "c", cmd: "give {player} leather 16",                                                                                                                         chance: 15000 },
        { tier: "c", cmd: "give {player} glass 16",                                                                                                                           chance: 12000 },
        { tier: "c", cmd: "give {player} shield 1",                                                                                                                           chance: 10000 },

        // ── B-TIER ──────────────────────────────────────────────────────
        { tier: "b", cmd: "give {player} diamond 8",                                                                                                                           chance: 5000 },
        { tier: "b", cmd: "give {player} diamond_pickaxe[enchantments={efficiency:4,fortune:3,unbreaking:3}] 1",                                                              chance: 4000 },
        { tier: "b", cmd: "give {player} gold_ingot 32",                                                                                                                      chance: 3333 },
        { tier: "b", cmd: "give {player} experience_bottle 16",                                                                                                               chance: 2800 },
        { tier: "b", cmd: "give {player} enchanted_book[stored_enchantments={mending:1}] 1",                                                                                  chance: 2000 },
        { tier: "b", cmd: "give {player} bow[enchantments={power:3,unbreaking:3}] 1 && give {player} arrow 32",                                                               chance: 1500 },

        // ── A-TIER ──────────────────────────────────────────────────────
        { tier: "a", cmd: "give {player} totem_of_undying 2",                                                                                                                  chance: 400 },
        { tier: "a", cmd: "give {player} enchanted_book[stored_enchantments={mending:1}] 1",                                                                                   chance: 300 },
        { tier: "a", cmd: "give {player} diamond_chestplate[enchantments={protection:4,unbreaking:3,mending:1}] 1",                                                           chance: 250 },
        { tier: "a", cmd: "give {player} golden_apple 32",                                                                                                                     chance: 200 },
        { tier: "a", cmd: "give {player} ancient_debris 16",                                                                                                                   chance: 150 },
        { tier: "a", cmd: "give {player} potion[potion_contents={potion:'minecraft:strength'}] 4 && give {player} potion[potion_contents={potion:'minecraft:instant_health'}] 4 && give {player} potion[potion_contents={potion:'minecraft:fire_resistance'}] 4", chance: 100 },

        // ── S-TIER — God Weapons (steeper curve) ────────────────────────
        { tier: "s", cmd: "give {player} netherite_sword[custom_name='God Sword',enchantments={sharpness:5,looting:3,fire_aspect:2,unbreaking:3,mending:1}] 1",              chance: 15 },
        { tier: "s", cmd: "give {player} netherite_axe[custom_name='God Axe',enchantments={sharpness:5,efficiency:5,unbreaking:3,mending:1}] 1",                             chance: 12 },
        { tier: "s", cmd: "give {player} bow[custom_name='God Bow',enchantments={power:5,flame:1,infinity:1,unbreaking:3}] 1",                                               chance: 9 },
        { tier: "s", cmd: "give {player} crossbow[custom_name='God Crossbow',enchantments={quick_charge:3,multishot:1,unbreaking:3}] 1",                                     chance: 7 },
        { tier: "s", cmd: "give {player} trident[custom_name='God Trident',enchantments={riptide:3,unbreaking:3,mending:1}] 1",                                              chance: 5 },
        { tier: "s", cmd: "give {player} trident[custom_name='God Trident',enchantments={loyalty:3,channeling:1,impaling:5,unbreaking:3,mending:1}] 1",                      chance: 5 },
        { tier: "s", cmd: "give {player} netherite_spear[custom_name='God Spear',enchantments={lunge:3,sharpness:5,looting:3,unbreaking:3,mending:1}] 1",                    chance: 4 },
        { tier: "s", cmd: "give {player} mace[custom_name='God Mace',enchantments={wind_burst:1,density:5,unbreaking:3,mending:1}] 1",                                       chance: 3 },

        // ── S-TIER — Standard Kit ────────────────────────────────────────
        { tier: "s", cmd: "give {player} totem_of_undying 1 && give {player} golden_apple 16 && give {player} firework_rocket 32 && give {player} ender_pearl 16 && give {player} diamond_sword[enchantments={sharpness:5,unbreaking:3}] 1 && give {player} diamond_pickaxe[enchantments={efficiency:5,fortune:3}] 1 && give {player} enchanted_book[stored_enchantments={mending:1}] 1 && give {player} experience_bottle 16 && give {player} obsidian 8 && give {player} water_bucket 1", chance: 2 },

        // ── S-TIER — Beacon Kit ──────────────────────────────────────────
        { tier: "s", cmd: "give {player} beacon 1 && give {player} iron_block 164 && give {player} netherite_ingot 1 && give {player} glass 16 && give {player} obsidian 4 && give {player} iron_pickaxe[enchantments={efficiency:5,unbreaking:3}] 1", chance: 1 },

        // ── JACKPOT — Endgame Shulker Kit ────────────────────────────────
        { tier: "jackpot", cmd: "give {player} elytra[enchantments={unbreaking:3}] 1 && give {player} totem_of_undying 2 && give {player} golden_apple 32 && give {player} firework_rocket[fireworks={flight:3}] 64 && give {player} netherite_sword[enchantments={sharpness:5,looting:3,fire_aspect:2,unbreaking:3,mending:1}] 1 && give {player} netherite_pickaxe[enchantments={efficiency:5,fortune:3,unbreaking:3,mending:1}] 1 && give {player} enchanted_book[stored_enchantments={mending:1}] 1 && give {player} experience_bottle 32 && give {player} ender_pearl 16", chance: 1 }
      ]
    },

    cooldowns: {
      message: 5
    },

    guaranteedRewards: {
      guaranteedDPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedCPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedBPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedAPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedSPlus:       { enabled: false, userId: "1274645481217327108" },
      guaranteedJackpotPlus: { enabled: true,  userId: "1274645481217327108" }
    }
  };
  