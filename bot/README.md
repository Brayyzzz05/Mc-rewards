# MC Rewards Bot (v2)

A Discord bot that lets users earn messages by chatting, buy spins/luck in a shop,
roll for randomized Minecraft rewards, and deliver them in-game via RCON.

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env` and fill in:

   - `DISCORD_TOKEN` — bot token from the Discord Developer Portal
   - `CLIENT_ID` — your bot's **Application ID** (required to register slash commands)
   - `GUILD_ID` — *optional*; set this to your test server ID for instant command updates.
     Leave it blank in production for global commands (which take up to ~1h to roll out).
   - `DATABASE_URL` — Postgres connection string
   - `RCON_HOST`, `RCON_PORT`, `RCON_PASSWORD` — Minecraft server RCON.
     If RCON is offline or unset, rewards are saved in a queue and delivered automatically
     when the server comes back online.

3. **Run**

   ```bash
   npm start
   ```

   The bot creates all tables on first run and registers slash commands automatically
   when it logs in. To re-register manually:

   ```bash
   npm run deploy
   ```

## Bot permissions / intents

Invite the bot with the **`applications.commands`** and **`bot`** scopes, and grant it
**Send Messages** + **Read Message History** in the channels it should track.

Intents used: `Guilds`, `GuildMessages`. (No privileged intents required.)

## Commands

| Command | What it does |
| --- | --- |
| `/verify username:<mc-name>` | Link your Minecraft Java username to your Discord account. |
| `/stats` | Show your messages, rolls, luck multiplier, and linked MC name. |
| `/shop list` | List shop items (rolls and luck) and their cost in **messages**. |
| `/shop buy item:<name> amount:<n>` | Buy rolls or luck using your earned messages. |
| `/roll` | Spend 1 roll to draw a reward and deliver it in-game. |
| `/admin setluck value:<n>` | Admin: set the **global** luck multiplier. |
| `/admin setmessage text:<...>` | Admin: set the public roll announcement template. |
| `/admin setroll tier:<t> weight:<n>` | Admin: override a tier's base weight. |
| `/admin giverolls user:<@u> amount:<n>` | Admin: grant rolls to a user. |
| `/admin givemessages user:<@u> amount:<n>` | Admin: grant messages (currency) to a user. |
| `/admin setuserluck user:<@u> multiplier:<n>` | Admin: set a user's personal luck multiplier directly. |
| `/admin settings` | Admin: dump all settings. |
| `/admin queue` | Admin: show pending vs failed reward queue counts. |

## Economy flow

**Currency = messages.** Everything in the shop is paid for with messages you earn by chatting.

1. Chat in the server → each message (max 1 every 5 seconds per user) earns 1 message point.
2. Spend messages in the shop:
   - `/shop buy item:roll` — 20 messages → +1 roll
   - `/shop buy item:roll5` — 80 messages → +5 rolls
   - `/shop buy item:luck1` — 100 messages → +0.10 luck multiplier
   - `/shop buy item:luck5` — 400 messages → +0.50 luck multiplier
3. `/roll` spends 1 roll, picks a reward weighted by tier rarity. Your **personal luck
   multiplier** combines with the **global luck multiplier** to boost rarer tiers.
4. The reward is delivered to your linked Minecraft account via RCON.
   - If the **server is offline**, the reward is queued and delivered automatically when RCON reconnects (~5s).
   - If **you're offline in-game**, the reward is queued. The bot polls the server's online list every 3s
     and the queue is flushed for you the moment you log in (typically within a couple of seconds of joining).

`/stats` shows: linked MC username, messages, rolls, and your luck multiplier (e.g. `1.50x`).

## What changed from v1

- Removed duplicate `/roll` command (`rewardCommands.js`) so commands actually load.
- Added a real `/verify` slash command (was helpers only — couldn't be used in Discord).
- `/roll` now actually delivers via RCON and logs the win; falls back to a queue when offline.
- One shared Postgres pool; consistent column names (`minecraft_username` everywhere).
- Schema initialized on startup — `user_stats`, `settings`, `delivered_rewards`,
  `reward_queue`, etc. are all created so `/stats`, `/shop`, `/admin` no longer crash.
- Slash commands are now registered with Discord on startup (REST deploy).
- Fixed `rcon-client` v4 import + handling of chained `&&` commands.
- RCON connector is started by `index.js` and reconnects with exponential backoff.
- Reward queue worker is started by `index.js`.
- `.env.example` matches the variable names the code actually reads (`DISCORD_TOKEN`,
  `CLIENT_ID`, `DATABASE_URL`, …).
- Message tracking respects `config.cooldowns.message`.
- Removed the privileged `MessageContent` intent (not needed; we only count messages).
- `interaction.reply()` after `deferReply()` bug fixed; safe-reply helper added.
- Admin command split into proper subcommands with typed options and validation.
- Shop uses transactions to prevent race conditions on simultaneous buys.
