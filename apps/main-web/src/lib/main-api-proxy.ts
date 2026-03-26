const DEFAULT_LOCAL_MAIN_API_ORIGIN = 'http://127.0.0.1:7878';

function getLocalMainApiOrigin() {
  const configuredOrigin = import.meta.env.MAIN_API_LOCAL_ORIGIN?.trim();
  return configuredOrigin && configuredOrigin.length > 0
    ? configuredOrigin.replace(/\/$/, '')
    : DEFAULT_LOCAL_MAIN_API_ORIGIN;
}

function isLocalRequest(request: Request) {
  const { hostname } = new URL(request.url);
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export async function forwardToMainApi(request: Request, path: string, init: RequestInit) {
  const localMainApiOrigin = getLocalMainApiOrigin();

  if (isLocalRequest(request)) {
    return fetch(`${localMainApiOrigin}${path}`, init);
  }

  const cloudflareWorkers = await import('cloudflare:workers').catch(() => null);
  const workerEnv = cloudflareWorkers?.env as Env | undefined;

  if (workerEnv?.MAIN_API) {
    return workerEnv.MAIN_API.fetch(`https://main-api${path}`, init);
  }

  return fetch(`${localMainApiOrigin}${path}`, init);
}
