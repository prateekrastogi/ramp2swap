const LOCAL_DEBUG_COUNTRIES = ['IN', 'US', 'DE'] as const;
const DEBUG_COUNTRY_HEADER = 'x-debug-country';

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

const pickRandomLocalCountry = () =>
  LOCAL_DEBUG_COUNTRIES[Math.floor(Math.random() * LOCAL_DEBUG_COUNTRIES.length)] ?? 'IN';

export const buildLocalDebugCountryHeaders = (hostname: string) => {
  const headers = new Headers({
    'content-type': 'application/json',
  });

  if (isLocalHostname(hostname)) {
    headers.set(DEBUG_COUNTRY_HEADER, pickRandomLocalCountry());
  }

  return headers;
};
