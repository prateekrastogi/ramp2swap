export type SessionPayload = {
  sid: string;
  email: string;
  exp: number;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const importHmacKey = (secret: string) =>
  crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

export const verifySessionToken = async (token: string, secret: string) => {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const key = await importHmacKey(secret);
  const expectedSignature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body));
  const actualSignature = fromBase64Url(signature);
  const expectedBytes = new Uint8Array(expectedSignature);

  if (actualSignature.length !== expectedBytes.length) return null;

  let mismatch = 0;
  for (let index = 0; index < actualSignature.length; index += 1) {
    mismatch |= actualSignature[index] ^ expectedBytes[index];
  }

  if (mismatch !== 0) return null;

  try {
    const payload = JSON.parse(textDecoder.decode(fromBase64Url(body))) as SessionPayload;
    if (!payload.sid || !payload.email || typeof payload.exp !== 'number') return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};
