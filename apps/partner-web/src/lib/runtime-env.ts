const readCloudflareEnv = async () => {
  try {
    const module = (await import('cloudflare:workers')) as {
      env?: Record<string, string | undefined>;
    };
    return module.env ?? {};
  } catch {
    return {};
  }
};

export const getPartnerApiBaseUrl = async () => {
  const runtimeEnv = await readCloudflareEnv();
  return runtimeEnv.PARTNER_API_BASE_URL ?? import.meta.env.PARTNER_API_BASE_URL ?? '';
};

export const getSessionSecret = async () => {
  const runtimeEnv = await readCloudflareEnv();
  return runtimeEnv.SESSION_SECRET ?? import.meta.env.SESSION_SECRET ?? '';
};
