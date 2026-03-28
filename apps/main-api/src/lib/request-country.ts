const DEBUG_COUNTRY_HEADER = 'x-debug-country';

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
