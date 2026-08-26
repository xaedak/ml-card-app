import nacl from "tweetnacl";

/**
 * Every request Discord sends must be verified using its Ed25519 signature,
 * or Discord will reject your endpoint during setup. This has to run on the
 * *raw* request body (before you JSON.parse it).
 */
export async function verifyDiscordRequest(request, publicKey) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text(); // raw text, read only once

  if (!signature || !timestamp) {
    return { valid: false, body };
  }

  const isValid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(publicKey)
  );

  return { valid: isValid, body };
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
