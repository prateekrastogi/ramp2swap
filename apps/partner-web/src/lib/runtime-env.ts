type RuntimeLocals = Partial<App.Locals> | undefined;

const readRuntimeEnv = (locals?: RuntimeLocals) => {
  const runtime = locals?.runtime as { env?: Record<string, string | undefined> } | undefined;
  return runtime?.env ?? {};
};

export const getPartnerApiBaseUrl = (locals?: RuntimeLocals) => {
  const runtimeEnv = readRuntimeEnv(locals);
  return runtimeEnv.PARTNER_API_BASE_URL ?? import.meta.env.PARTNER_API_BASE_URL ?? '';
};

export const getSessionSecret = (locals?: RuntimeLocals) => {
  const runtimeEnv = readRuntimeEnv(locals);
  return runtimeEnv.SESSION_SECRET ?? import.meta.env.SESSION_SECRET ?? '';
};
