import type { APIRoute } from 'astro';

const DEFAULT_LOCAL_MAIN_API_ORIGIN = 'http://127.0.0.1:7878';

function getLocalMainApiOrigin() {
  const configuredOrigin = import.meta.env.MAIN_API_LOCAL_ORIGIN?.trim();
  return configuredOrigin && configuredOrigin.length > 0
    ? configuredOrigin.replace(/\/$/, '')
    : DEFAULT_LOCAL_MAIN_API_ORIGIN;
}

function isLocalRequest(request: Request) {
  const { hostname } = new URL(request.url);
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';

  if (!text) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Intent text is required.',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }

  const init: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ text }),
  };

  const runtimeEnv = (locals as { runtime?: { env?: Env } }).runtime?.env;
  const localMainApiOrigin = getLocalMainApiOrigin();

  if (isLocalRequest(request)) {
    console.log('[main-web] Forwarding /api/intent to local main-api', {
      target: `${localMainApiOrigin}/intent`,
    });

    return fetch(`${localMainApiOrigin}/intent`, init);
  }

  if (runtimeEnv?.MAIN_API) {
    console.log('[main-web] Forwarding /api/intent through Cloudflare service binding');
    return runtimeEnv.MAIN_API.fetch('https://main-api/intent', init);
  }

  console.log('[main-web] Forwarding /api/intent to fallback main-api origin', {
    target: `${localMainApiOrigin}/intent`,
  });

  return fetch(`${localMainApiOrigin}/intent`, init);
};
