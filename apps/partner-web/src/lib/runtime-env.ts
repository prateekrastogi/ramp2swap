const readCloudflareEnv = async () => {
  try {
    const module = (await import('cloudflare:workers')) as {
      env?: unknown;
    };
    return (module.env as Record<string, string | undefined> | undefined) ?? {};
  } catch {
    return {};
  }
};

const DEFAULT_LOCAL_PARTNER_LINK_BASE_URL = 'http://localhost:1234/r';
const DEFAULT_PRODUCTION_PARTNER_LINK_BASE_URL = 'https://ramp2swap.com/r';

export const getPartnerApiBaseUrl = async () => {
  const runtimeEnv = await readCloudflareEnv();
  return runtimeEnv.PARTNER_API_BASE_URL ?? import.meta.env.PARTNER_API_BASE_URL ?? '';
};

export const getPartnerLinkBaseUrl = async () => {
  const runtimeEnv = await readCloudflareEnv();
  return (
    runtimeEnv.PARTNER_LINK_BASE_URL ??
    import.meta.env.PARTNER_LINK_BASE_URL ??
    (import.meta.env.DEV ? DEFAULT_LOCAL_PARTNER_LINK_BASE_URL : DEFAULT_PRODUCTION_PARTNER_LINK_BASE_URL)
  );
};

export const getSessionSecret = async () => {
  const runtimeEnv = await readCloudflareEnv();
  return runtimeEnv.SESSION_SECRET ?? import.meta.env.SESSION_SECRET ?? '';
};
