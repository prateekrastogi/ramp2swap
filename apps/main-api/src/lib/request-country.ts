const DEBUG_COUNTRY_HEADER = 'x-debug-country';
const FORWARDED_COUNTRY_HEADER = 'x-ramp-country';

const normalizeCountry = (value: string | null | undefined) => {
  const candidate = value?.trim().toUpperCase() ?? '';
  return /^[A-Z]{2}$/.test(candidate) ? candidate : null;
};

const getCloudflareCountry = (request: Request) => {
  const requestWithCf = request as Request & {
    cf?: {
      country?: string;
    };
  };

  return normalizeCountry(requestWithCf.cf?.country);
};

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

export const getRequestCountry = (request: Request) => {
  const forwardedCountry = normalizeCountry(request.headers.get(FORWARDED_COUNTRY_HEADER));
  if (forwardedCountry) {
    return forwardedCountry;
  }

  const cloudflareCountry = getCloudflareCountry(request);
  if (cloudflareCountry) {
    return cloudflareCountry;
  }

  const { hostname } = new URL(request.url);
  if (!isLocalHostname(hostname)) {
    return null;
  }

  return normalizeCountry(request.headers.get(DEBUG_COUNTRY_HEADER));
};

export const getDebugCountryHeaderName = () => DEBUG_COUNTRY_HEADER;
