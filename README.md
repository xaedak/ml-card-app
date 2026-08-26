# Mobile Legends Player Card — Serverless (Cloudflare Workers)

This is the **on-demand** version of the card bot: nothing runs until someone
types `/playercard`. No process to keep alive, no server to babysit. It costs
$0 on Cloudflare's free tier for normal-sized communities.

## How it works
1. Member runs `/playercard`
2. A dropdown appears (ephemeral, only they see it) to pick one of 5 backgrounds
3. A popup form (modal) asks: Name, Birthday, Player ID, Server ID, Main Hero
4. A second step lets them pick Role(s) (optional) and Highest Rank, then hit **Generate**
5. The worker renders the card (Satori → SVG → PNG via resvg-wasm) and:
   - sends it back to them privately
   - posts it publicly to the channel you configured

Everything happens inside a single Cloudflare Worker function that only
executes when Discord sends it an interaction — there is no always-on process.

## One-time setup

### 1. Create the Discord application
- https://discord.com/developers/applications → New Application
- **General Information** tab: copy the **Application ID** and **Public Key**
- **Bot** tab → Reset Token → copy the **bot token**
  (enable no privileged intents — this version doesn't need them)
- **OAuth2 → URL Generator**: check `bot` and `applications.commands` scopes,
  permissions `Send Messages` + `Attach Files`. Use the generated URL to
  invite the bot to your server.

### 2. Push the template images somewhere public
The worker fetches your 5 background PNGs at request time (keeps the deployed
worker small and fast). Easiest option: push this whole project to the
GitHub repo you already set up, in `assets/templates/`, then your base URL is:
```
https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/assets/templates
```
You'll set this as the `TEMPLATE_BASE_URL` secret in step 5.

### 3. Install tools and dependencies
```bash
npm install -g wrangler   # if you don't have it already
npm install
wrangler login
```

### 4. Create the KV namespace (stores in-progress answers for a few minutes)
```bash
wrangler kv namespace create SESSIONS
```
Copy the `id` it prints into `wrangler.toml`, replacing `REPLACE_WITH_KV_ID`.

### 5. Set your secrets
```bash
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_BOT_TOKEN
wrangler secret put DISCORD_APPLICATION_ID
wrangler secret put CARD_CHANNEL_ID
wrangler secret put TEMPLATE_BASE_URL
```
(It'll prompt you to paste each value — nothing is written to disk or git.)

### 6. Deploy
```bash
wrangler deploy
```
This prints your worker's URL, e.g. `https://ml-card-worker.YOUR-SUBDOMAIN.workers.dev`.

### 7. Tell Discord where to send interactions
Discord Developer Portal → your app → **General Information** →
**Interactions Endpoint URL** → paste your worker URL from step 6 → Save.
Discord immediately sends a test ping; if `DISCORD_PUBLIC_KEY` is correct
it'll save successfully.

### 8. Register the slash command
```bash
DISCORD_APPLICATION_ID=your_app_id DISCORD_BOT_TOKEN=your_bot_token \
  node scripts/register-commands.mjs
```
Global commands can take up to an hour to show up the first time; if you
want it instantly for testing, register it as a guild command instead (see
comment in `scripts/register-commands.mjs` for the guild-scoped endpoint).

### 9. Try it
In your server, type `/playercard`.

## Updating things later
- **Change a background or add a 6th one**: edit `src/templates.js`, push the
  new PNG to the GitHub repo, redeploy with `wrangler deploy` (no secrets
  need to change — the worker fetches images by filename at request time).
- **Change the card layout**: edit `src/render.js`, then `wrangler deploy`.
- **Change the command itself**: edit `scripts/register-commands.mjs`, rerun it.
- **Watch logs while testing**: `wrangler tail`

## Notes / limitations
- Discord interaction responses must fire within 3 seconds, so the actual
  image generation happens after an immediate "thinking..." acknowledgment
  (`DEFERRED_UPDATE_MESSAGE`), then the result is patched in — this is normal
  and by design, not a bug if you see a brief loading state.
- KV session data auto-expires after 15 minutes, so if someone starts the
  flow and abandons it partway, nothing lingers.
- This was built and reviewed carefully, but wasn't run end-to-end against
  live Discord servers before being handed to you (that requires a public
  HTTPS endpoint + real Discord app credentials, which this build
  environment doesn't have). Deploy it and test with `/playercard` — if
  anything errors, run `wrangler tail` to see the live error and send it
  over so it can be fixed.
