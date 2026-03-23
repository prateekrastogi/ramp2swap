const OTP_LENGTH = 6;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  sid: string;
  email: string;
  exp: number;
};

const textEncoder = new TextEncoder();

const toBase64Url = (value: ArrayBuffer | Uint8Array | string) => {
  const bytes =
    typeof value === 'string'
      ? textEncoder.encode(value)
      : value instanceof Uint8Array
        ? value
        : new Uint8Array(value);

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

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

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const createOtp = () => {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] % 10 ** OTP_LENGTH;
  return randomValue.toString().padStart(OTP_LENGTH, '0');
};

export const createRandomToken = (bytes = 24) => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64Url(randomBytes);
};

export const hashOtp = async (otp: string, salt: string, secret: string) => {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(`${otp}:${salt}:${secret}`));
  return toBase64Url(digest);
};

export const createSessionToken = async (payload: SessionPayload, secret: string) => {
  const body = toBase64Url(JSON.stringify(payload));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body));
  return `${body}.${toBase64Url(signature)}`;
};

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
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (!payload.sid || !payload.email || typeof payload.exp !== 'number') return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const getSessionExpiry = () => Date.now() + SESSION_TTL_MS;
