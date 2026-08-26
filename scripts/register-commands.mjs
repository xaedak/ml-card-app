// Run this once (and again any time you change the command definition):
//   node scripts/register-commands.mjs
// Requires DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN as environment
// variables in your shell (not the deployed worker secrets).

const appId = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_BOT_TOKEN;

if (!appId || !token) {
  console.error("Set DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN env vars first.");
  process.exit(1);
}

const commands = [
  {
    name: "playercard",
    description: "Create your Mobile Legends player card (bot by @Mikun190)",
    type: 1,
  },
];

const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
  method: "PUT", // PUT replaces the full command list with this one
  headers: {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error("Failed to register commands:", res.status, await res.text());
  process.exit(1);
}

console.log("Slash command(s) registered:", await res.json());
