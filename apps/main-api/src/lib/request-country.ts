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

export const getRequestCountry = (request: Request) => {
  const cloudflareCountry = getCloudflareCountry(request);
  if (cloudflareCountry) {
    return cloudflareCountry;
  }

  return null;
};
