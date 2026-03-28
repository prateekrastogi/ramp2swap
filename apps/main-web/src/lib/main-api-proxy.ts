const DEFAULT_LOCAL_MAIN_API_ORIGIN = 'http://127.0.0.1:7878';
const DEBUG_COUNTRY_HEADER = 'x-debug-country';

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

export function buildMainApiProxyHeaders(request: Request) {
  const headers = new Headers({
    'content-type': 'application/json',
  });

  const debugCountry = request.headers.get(DEBUG_COUNTRY_HEADER);
  if (debugCountry) {
    headers.set(DEBUG_COUNTRY_HEADER, debugCountry);
  }

  return headers;
}
