import { verifyDiscordRequest } from "./verify.js";
import { TEMPLATES, ROLE_OPTIONS, RANK_OPTIONS } from "./templates.js";
import { renderCard } from "./render.js";
import { getUser, avatarUrl, editOriginalResponse, postToChannel } from "./discordApi.js";

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2, MESSAGE_COMPONENT: 3, MODAL_SUBMIT: 5 };
const ResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  MODAL: 9,
};
const SESSION_TTL_SECONDS = 900; // 15 minutes to finish the flow

async function getSession(env, id) {
  const raw = await env.SESSIONS.get(`session:${id}`);
  return raw ? JSON.parse(raw) : {};
}
async function putSession(env, id, data) {
  await env.SESSIONS.put(`session:${id}`, JSON.stringify(data), { expirationTtl: SESSION_TTL_SECONDS });
}
async function deleteSession(env, id) {
  await env.SESSIONS.delete(`session:${id}`);
}

function json(body) {
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}

function templateSelectRow(sessionId) {
  return [
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: `tpl:${sessionId}`,
          placeholder: "Choose a background...",
          options: Object.entries(TEMPLATES).map(([key, t]) => ({ label: t.label, value: key })),
        },
      ],
    },
  ];
}

function rolesRankComponents(sessionId, session) {
  return [
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: `roles:${sessionId}`,
          placeholder: "Role(s) played — optional",
          min_values: 0,
          max_values: ROLE_OPTIONS.length,
          options: ROLE_OPTIONS.map((r) => ({ label: r, value: r, default: (session.roles || []).includes(r) })),
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: `rank:${sessionId}`,
          placeholder: "Highest rank achieved",
          options: RANK_OPTIONS.map((r) => ({ label: r, value: r, default: session.highestRank === r })),
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3, // green
          label: "Generate my card",
          custom_id: `gen:${sessionId}`,
          disabled: !session.highestRank, // require a rank pick before allowing generate
        },
      ],
    },
  ];
}

function summaryText(session) {
  const bits = [];
  bits.push(`**Background:** ${TEMPLATES[session.templateKey]?.label ?? "-"}`);
  bits.push(`**Name:** ${session.displayName ?? "-"}`);
  bits.push(`**Roles:** ${(session.roles || []).length ? session.roles.join(", ") : "none picked yet"}`);
  bits.push(`**Highest rank:** ${session.highestRank ?? "not picked yet"}`);
  return `Almost done! Pick your role(s) (optional) and your highest rank, then hit **Generate**.\n\n${bits.join("\n")}`;
}

function modal1Definition(sessionId) {
  return {
    title: "Player Card - Part 1",
    custom_id: `modal1:${sessionId}`,
    components: [
      textInput("name", "Name to show on the card", "e.g. ShadowFang", 32),
      textInput("birthday", "Birthday (DD/MM)", "e.g. 14/03", 5),
      textInput("playerid", "Mobile Legends Player ID", "e.g. 123456789", 20),
      textInput("serverid", "Server ID", "e.g. 8210", 20),
      textInput("hero", "Main Hero", "e.g. Lancelot", 30),
    ],
  };
}
function textInput(customId, label, placeholder, maxLength) {
  return {
    type: 1,
    components: [
      { type: 4, custom_id: customId, style: 1, label, placeholder, max_length: maxLength, required: true },
    ],
  };
}

function extractModalValues(data) {
  const out = {};
  for (const row of data.components) {
    const comp = row.components[0];
    out[comp.custom_id] = comp.value;
  }
  return out;
}

function normalizeBirthday(raw) {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return raw.trim(); // fall back to whatever they typed rather than blocking them
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return raw.trim();
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Mobile Legends Player Card bot is running.", { status: 200 });
    }

    const { valid, body } = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
    if (!valid) return new Response("Bad request signature", { status: 401 });

    const interaction = JSON.parse(body);

    // 1. Discord's setup handshake
    if (interaction.type === InteractionType.PING) {
      return json({ type: ResponseType.PONG });
    }

    // 2. Slash command: /playercard
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      if (interaction.data.name === "playercard") {
        const sessionId = crypto.randomUUID();
        await putSession(env, sessionId, {});
        return json({
          type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content:
              "**Let's build your Mobile Legends Player Card!** Pick a background to start:\n" +
              "-# Bot by @Mikun190",
            flags: 1 << 6, // ephemeral
            components: templateSelectRow(sessionId),
          },
        });
      }
      return json({ type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: "Unknown command.", flags: 1 << 6 } });
    }

    // 3. Component interactions: select menus + button
    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      const [action, sessionId] = interaction.data.custom_id.split(":");
      const session = await getSession(env, sessionId);

      if (action === "tpl") {
        session.templateKey = interaction.data.values[0];
        await putSession(env, sessionId, session);
        return json({ type: ResponseType.MODAL, data: modal1Definition(sessionId) });
      }

      if (action === "roles") {
        session.roles = interaction.data.values;
        await putSession(env, sessionId, session);
        return json({
          type: ResponseType.UPDATE_MESSAGE,
          data: { content: summaryText(session), components: rolesRankComponents(sessionId, session) },
        });
      }

      if (action === "rank") {
        session.highestRank = interaction.data.values[0];
        await putSession(env, sessionId, session);
        return json({
          type: ResponseType.UPDATE_MESSAGE,
          data: { content: summaryText(session), components: rolesRankComponents(sessionId, session) },
        });
      }

      if (action === "gen") {
        ctx.waitUntil(
          finishCard(env, interaction, sessionId).catch((err) => console.error("finishCard failed", err))
        );
        return json({ type: ResponseType.DEFERRED_UPDATE_MESSAGE });
      }
    }

    // 4. Modal submission (part 1 of the form)
    if (interaction.type === InteractionType.MODAL_SUBMIT) {
      const [action, sessionId] = interaction.data.custom_id.split(":");
      if (action === "modal1") {
        const session = await getSession(env, sessionId);
        const values = extractModalValues(interaction.data);
        session.displayName = values.name?.trim() || "Player";
        session.birthday = normalizeBirthday(values.birthday || "");
        session.mlId = values.playerid?.trim() || "-";
        session.mlServer = values.serverid?.trim() || "-";
        session.mainHero = values.hero?.trim() || "-";
        await putSession(env, sessionId, session);

        return json({
          type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: summaryText(session),
            flags: 1 << 6,
            components: rolesRankComponents(sessionId, session),
          },
        });
      }
    }

    return new Response("Unhandled interaction type", { status: 400 });
  },
};

async function finishCard(env, interaction, sessionId) {
  const session = await getSession(env, sessionId);
  const user = getUser(interaction);
  const avatar = avatarUrl(user);
  const cache = caches.default;

  const pngBytes = await renderCard({
    answers: { ...session, templateBaseUrl: env.TEMPLATE_BASE_URL },
    avatarUrl: avatar,
    cache,
  });

  await editOriginalResponse(env.DISCORD_APPLICATION_ID, interaction.token, {
    content: "✅ Here's your finished player card!\n-# Bot by @Mikun190",
    pngBytes,
  });

  await postToChannel(env.DISCORD_BOT_TOKEN, env.CARD_CHANNEL_ID, {
    content: `🎴 New player card from <@${user.id}>! *(card bot by @Mikun190)*`,
    pngBytes,
  });

  await deleteSession(env, sessionId);
}
