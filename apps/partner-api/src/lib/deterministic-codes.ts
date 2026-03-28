const CODE_CONSONANTS = 'bcdfghjklmnprstvwxz';
const CODE_VOWELS = 'aeiou';
const CODE_DIGITS = '23456789';

const getAlphabetForIndex = (index: number) =>
  index % 2 === 0 ? CODE_CONSONANTS : CODE_VOWELS;

export const createHumanReadableDeterministicCode = async (
  secret: string,
  namespace: string,
  value: string,
  length: number,
) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return '';
  }

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${namespace}:${secret}:${normalizedValue}`),
  );
  const bytes = new Uint8Array(digest);

  return Array.from({ length }, (_, index) => {
    const alphabet = getAlphabetForIndex(index);
    const byte = bytes[index % bytes.length] ?? 0;
    return alphabet[byte % alphabet.length] ?? alphabet[0];
  }).join('');
};

export const createDeterministicUppercaseCode = async (
  secret: string,
  namespace: string,
  value: string,
  length: number,
) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return '';
  }

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${namespace}:${secret}:${normalizedValue}`),
  );
  const bytes = new Uint8Array(digest);
  const alphabet = `ABCDEFGHJKLMNPQRSTUVWXYZ${CODE_DIGITS}`;

  return Array.from({ length }, (_, index) => {
    const byte = bytes[index % bytes.length] ?? 0;
    return alphabet[byte % alphabet.length] ?? alphabet[0];
  }).join('');
};
