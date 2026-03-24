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

export const getPartnerApiBaseUrl = async () => {
  const runtimeEnv = await readCloudflareEnv();
  return runtimeEnv.PARTNER_API_BASE_URL ?? import.meta.env.PARTNER_API_BASE_URL ?? '';
};

export const getSessionSecret = async () => {
  const runtimeEnv = await readCloudflareEnv();
  return runtimeEnv.SESSION_SECRET ?? import.meta.env.SESSION_SECRET ?? '';
};
