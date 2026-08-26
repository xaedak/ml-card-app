const API = "https://discord.com/api/v10";

export function getUser(interaction) {
  return interaction.member?.user || interaction.user;
}

export function avatarUrl(user) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
  }
  // new username-based default avatar system
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

async function postMultipart(url, { content, filename, pngBytes, method = "POST" }) {
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ content }));
  form.append("files[0]", new Blob([pngBytes], { type: "image/png" }), filename);
  return fetch(url, { method, body: form });
}

export async function editOriginalResponse(applicationId, interactionToken, { content, pngBytes, filename = "player_card.png" }) {
  const url = `${API}/webhooks/${applicationId}/${interactionToken}/messages/@original`;
  return postMultipart(url, { content, filename, pngBytes, method: "PATCH" });
}

export async function postToChannel(botToken, channelId, { content, pngBytes, filename = "player_card.png" }) {
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ content }));
  form.append("files[0]", new Blob([pngBytes], { type: "image/png" }), filename);
  return fetch(`${API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${botToken}` },
    body: form,
  });
}
