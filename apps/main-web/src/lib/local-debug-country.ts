const LOCAL_DEBUG_COUNTRIES = ['IN', 'US', 'DE'] as const;
const DEBUG_COUNTRY_HEADER = 'x-debug-country';
const LOCAL_DEBUG_COUNTRY_INDEX_KEY = 'ramp2swap-local-debug-country-index';

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

const getNextLocalCountry = () => {
  if (typeof window === 'undefined') {
    return LOCAL_DEBUG_COUNTRIES[0] ?? 'IN';
  }

  const currentIndex = Number.parseInt(
    window.localStorage.getItem(LOCAL_DEBUG_COUNTRY_INDEX_KEY) ?? '-1',
    10,
  );
  const safeCurrentIndex =
    Number.isInteger(currentIndex) && currentIndex >= -1 && currentIndex < LOCAL_DEBUG_COUNTRIES.length
      ? currentIndex
      : -1;
  const nextIndex = (safeCurrentIndex + 1) % LOCAL_DEBUG_COUNTRIES.length;

  window.localStorage.setItem(LOCAL_DEBUG_COUNTRY_INDEX_KEY, String(nextIndex));
  return LOCAL_DEBUG_COUNTRIES[nextIndex] ?? 'IN';
};

export const buildLocalDebugCountryHeaders = (hostname: string) => {
  const headers = new Headers({
    'content-type': 'application/json',
  });

  if (isLocalHostname(hostname)) {
    headers.set(DEBUG_COUNTRY_HEADER, getNextLocalCountry());
  }

  return headers;
};
